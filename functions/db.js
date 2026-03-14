const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore();

const getPrograms = async () => {
    const snapshot = await db.collection("programs").orderBy("order", "asc").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getProgramById = async (id) => {
    const doc = await db.collection("programs").doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
};

const updateProgramCapacity = async (id, remaining) => {
    await db.collection("programs").doc(id).update({ remaining });
};

// Legacy addReception (kept for backward compatibility, prefer addReceptionWithAssignment)
const addReception = async (data) => {
    const docRef = await db.collection("receptions").add({
        ...data,
        createdAt: new Date().toISOString(),
    });
    return docRef.id;
};

/**
 * Add a reception with automatic program assignment using Firestore transaction.
 * Tries to assign the attendee to their highest-priority program that has available seats.
 * If no seats are available for any selection, the reception is placed on a waitlist.
 */
const addReceptionWithAssignment = async (data) => {
    return db.runTransaction(async (transaction) => {
        const selections = data.selections || [];
        let assignedProgram = null;
        let assignedPriority = 0;

        // Calculate required seats (attendee + companions)
        const requiredSeats = 1 + (data.attendee?.companions || 0);

        // Try each selection in priority order
        for (let i = 0; i < selections.length; i++) {
            const programRef = db.collection("programs").doc(selections[i].id);
            const programDoc = await transaction.get(programRef);

            if (!programDoc.exists) continue;

            const programData = programDoc.data();

            if (programData.remaining >= requiredSeats) {
                // Seats available → confirm assignment
                transaction.update(programRef, {
                    remaining: programData.remaining - requiredSeats,
                });

                assignedProgram = {
                    id: selections[i].id,
                    title: selections[i].title || programData.title,
                    priority: i + 1,
                    assignedAt: new Date().toISOString(),
                    assignedBy: "auto",
                };
                assignedPriority = i + 1;
                break;
            }
        }

        // Create reception record
        const receptionRef = db.collection("receptions").doc();
        transaction.set(receptionRef, {
            attendee: data.attendee,
            selections: data.selections,
            notes: data.notes || "",
            assignedProgram: assignedProgram,
            status: assignedProgram ? "assigned" : "waiting",
            createdAt: new Date().toISOString(),
        });

        // If assigned, also create assignment record
        if (assignedProgram) {
            const assignmentRef = db.collection("assignments").doc();
            transaction.set(assignmentRef, {
                receptionId: receptionRef.id,
                programId: assignedProgram.id,
                attendeeName: data.attendee?.name || "",
                priority: assignedPriority,
                status: "confirmed",
                assignedAt: new Date().toISOString(),
            });
        }

        return {
            id: receptionRef.id,
            assignedProgram,
            waitlisted: !assignedProgram,
        };
    });
};

/**
 * Manual assignment by admin: assign a waiting reception to a specific program.
 * Uses a transaction to atomically check and decrement seats.
 */
const manualAssignment = async (receptionId, programId) => {
    return db.runTransaction(async (transaction) => {
        // Get the reception
        const receptionRef = db.collection("receptions").doc(receptionId);
        const receptionDoc = await transaction.get(receptionRef);

        if (!receptionDoc.exists) {
            throw new Error("Reception not found");
        }

        const receptionData = receptionDoc.data();

        if (receptionData.status !== "waiting") {
            throw new Error("Reception is not in waiting status");
        }

        // Get the program
        const programRef = db.collection("programs").doc(programId);
        const programDoc = await transaction.get(programRef);

        if (!programDoc.exists) {
            throw new Error("Program not found");
        }

        const programData = programDoc.data();
        const requiredSeats = 1 + (receptionData.attendee?.companions || 0);

        if (programData.remaining < requiredSeats) {
            throw new Error("Not enough seats available");
        }

        // Determine priority based on selections
        const selectionIndex = (receptionData.selections || []).findIndex(
            (s) => s.id === programId
        );
        const priority = selectionIndex >= 0 ? selectionIndex + 1 : 0; // 0 = not in original selections

        const assignedProgram = {
            id: programId,
            title: programData.title,
            priority: priority,
            assignedAt: new Date().toISOString(),
            assignedBy: "manual",
        };

        // Decrement seats
        transaction.update(programRef, {
            remaining: programData.remaining - requiredSeats,
        });

        // Update reception
        transaction.update(receptionRef, {
            assignedProgram: assignedProgram,
            status: "assigned",
        });

        // Create assignment record
        const assignmentRef = db.collection("assignments").doc();
        transaction.set(assignmentRef, {
            receptionId: receptionId,
            programId: programId,
            attendeeName: receptionData.attendee?.name || "",
            priority: priority,
            status: "confirmed",
            assignedAt: new Date().toISOString(),
        });

        return {
            assignmentId: assignmentRef.id,
            assignedProgram,
        };
    });
};

/**
 * Cancel an assignment and promote the next waiting attendee.
 * Uses a transaction to atomically restore seats and potentially assign them to a waiter.
 */
const cancelAssignmentAndPromote = async (assignmentId) => {
    return db.runTransaction(async (transaction) => {
        // 1. Get the assignment
        const assignmentRef = db.collection("assignments").doc(assignmentId);
        const assignmentDoc = await transaction.get(assignmentRef);

        if (!assignmentDoc.exists) {
            throw new Error("Assignment not found");
        }

        const assignment = assignmentDoc.data();

        if (assignment.status === "cancelled") {
            throw new Error("Already cancelled");
        }

        // 2. Get the program
        const programRef = db.collection("programs").doc(assignment.programId);
        const programDoc = await transaction.get(programRef);
        const programData = programDoc.data();

        // 3. Get the original reception to calculate seats to restore
        const receptionRef = db.collection("receptions").doc(assignment.receptionId);
        const receptionDoc = await transaction.get(receptionRef);
        const receptionData = receptionDoc.data();
        const seatsToRestore = 1 + (receptionData?.attendee?.companions || 0);

        // 4. Cancel the assignment
        transaction.update(assignmentRef, {
            status: "cancelled",
            cancelledAt: new Date().toISOString(),
        });

        // 5. Update the reception status
        transaction.update(receptionRef, {
            assignedProgram: null,
            status: "cancelled",
        });

        // 6. Check for waitlisted attendees who want this program
        // Note: We need to query outside the transaction since Firestore
        // transactions only support get/set/update/delete, not queries directly.
        // We'll query first, then do reads inside the transaction.
        const waitingSnapshot = await db
            .collection("receptions")
            .where("status", "==", "waiting")
            .get();

        let promoted = null;
        let newRemainingSeats = programData.remaining + seatsToRestore;

        // Sort by createdAt (oldest first for fairness)
        const waitingReceptions = waitingSnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        for (const waiting of waitingReceptions) {
            const selectionIndex = (waiting.selections || []).findIndex(
                (s) => s.id === assignment.programId
            );

            if (selectionIndex === -1) continue;

            const requiredSeats = 1 + (waiting.attendee?.companions || 0);

            if (newRemainingSeats < requiredSeats) continue;

            // Promote this attendee
            const newAssignedProgram = {
                id: assignment.programId,
                title: programData.title,
                priority: selectionIndex + 1,
                assignedAt: new Date().toISOString(),
                assignedBy: "auto",
            };

            const waitingRef = db.collection("receptions").doc(waiting.id);
            transaction.update(waitingRef, {
                assignedProgram: newAssignedProgram,
                status: "assigned",
            });

            newRemainingSeats -= requiredSeats;

            const newAssignmentRef = db.collection("assignments").doc();
            transaction.set(newAssignmentRef, {
                receptionId: waiting.id,
                programId: assignment.programId,
                attendeeName: waiting.attendee?.name || "",
                priority: selectionIndex + 1,
                status: "confirmed",
                assignedAt: new Date().toISOString(),
            });

            promoted = {
                receptionId: waiting.id,
                attendeeName: waiting.attendee?.name || "",
            };
            break; // Only promote one attendee per cancellation
        }

        // Update program remaining seats
        transaction.update(programRef, {
            remaining: newRemainingSeats,
        });

        return {
            cancelled: {
                assignmentId,
                receptionId: assignment.receptionId,
            },
            promoted,
        };
    });
};

const getReceptionStats = async () => {
    const snapshot = await db.collection("receptions").get();
    let stats = { completed: 0, waiting: 0, assigned: 0, cancelled: 0, reserved: 0, walkIn: 0 };

    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === "completed") stats.completed++;
        if (data.status === "waiting") stats.waiting++;
        if (data.status === "assigned") stats.assigned++;
        if (data.status === "cancelled") stats.cancelled++;
        if (data.attendee?.reserved) stats.reserved++;
        else stats.walkIn++;
    });
    return stats;
};

// Fixed: Use settings/reception-settings (unified with frontend)
const getSystemSettings = async () => {
    const doc = await db.collection("settings").doc("reception-settings").get();
    if (!doc.exists) return {};
    return doc.data();
};

module.exports = {
    getPrograms,
    getProgramById,
    updateProgramCapacity,
    addReception,
    addReceptionWithAssignment,
    manualAssignment,
    cancelAssignmentAndPromote,
    getReceptionStats,
    getSystemSettings,
    db
};
