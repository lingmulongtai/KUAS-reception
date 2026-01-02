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

const addReception = async (data) => {
    const docRef = await db.collection("receptions").add({
        ...data,
        createdAt: new Date().toISOString(),
    });
    return docRef.id;
};

const getReceptionStats = async () => {
    const snapshot = await db.collection("receptions").get();
    let stats = { completed: 0, waiting: 0, reserved: 0, walkIn: 0 };

    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === "completed") stats.completed++;
        if (data.status === "waiting") stats.waiting++;
        if (data.attendee?.reserved) stats.reserved++;
        else stats.walkIn++;
    });
    return stats;
};

const getSystemSettings = async () => {
    const doc = await db.collection("system").doc("settings").get();
    if (!doc.exists) return {};
    return doc.data();
};

module.exports = {
    getPrograms,
    getProgramById,
    updateProgramCapacity,
    addReception,
    getReceptionStats,
    getSystemSettings,
    db
};
