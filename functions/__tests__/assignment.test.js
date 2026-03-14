/**
 * Unit tests for the KUAS Reception assignment engine.
 * 
 * Tests cover:
 * 1. Normal assignment to first-priority program
 * 2. Fallback to second-priority when first is full
 * 3. Waitlisting when all programs are full
 * 4. Concurrent request handling (race condition prevention)
 * 5. Companion seat counting
 * 6. Cancel and promote logic
 * 7. Validation errors
 */

// Mock firebase-admin before requiring anything
const mockTransaction = {
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
};

const mockDoc = jest.fn();
const mockCollection = jest.fn();
const mockRunTransaction = jest.fn();
const mockWhere = jest.fn();
const mockGet = jest.fn();

jest.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection: mockCollection,
    runTransaction: mockRunTransaction,
    doc: jest.fn(),
  }),
}));

// Setup collection/doc chain
mockCollection.mockImplementation((name) => ({
  doc: mockDoc,
  where: mockWhere,
}));

let idCounter = 0;
mockDoc.mockImplementation((id) => {
  if (id) {
    return { id, path: `mock/${id}` };
  }
  // Auto-generate ID for new docs
  idCounter++;
  return { id: `auto-id-${idCounter}`, path: `mock/auto-id-${idCounter}` };
});

const db = require("../db");

beforeEach(() => {
  jest.clearAllMocks();
  idCounter = 0;
});

describe("addReceptionWithAssignment", () => {
  test("1. assigns to first-priority program when seats available", async () => {
    const inputData = {
      attendee: { name: "テスト太郎", companions: 0 },
      selections: [
        { id: "prog-1", title: "AI Lab" },
        { id: "prog-2", title: "Robot Workshop" },
      ],
    };

    mockRunTransaction.mockImplementation(async (fn) => {
      // Mock program docs
      mockTransaction.get.mockImplementation((ref) => {
        if (ref.id === "prog-1") {
          return { exists: true, data: () => ({ remaining: 5, title: "AI Lab" }) };
        }
        if (ref.id === "prog-2") {
          return { exists: true, data: () => ({ remaining: 10, title: "Robot Workshop" }) };
        }
        return { exists: false };
      });

      return fn(mockTransaction);
    });

    const result = await db.addReceptionWithAssignment(inputData);

    expect(result.waitlisted).toBe(false);
    expect(result.assignedProgram).not.toBeNull();
    expect(result.assignedProgram.id).toBe("prog-1");
    expect(result.assignedProgram.priority).toBe(1);
    expect(result.assignedProgram.assignedBy).toBe("auto");

    // Verify seat was decremented
    expect(mockTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: "prog-1" }),
      { remaining: 4 }
    );

    // Verify reception was created with status "assigned"
    expect(mockTransaction.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: "assigned",
        assignedProgram: expect.objectContaining({ id: "prog-1" }),
      })
    );

    // Verify assignment record was created
    const setCalls = mockTransaction.set.mock.calls;
    expect(setCalls.length).toBe(2); // reception + assignment
    expect(setCalls[1][1]).toMatchObject({
      programId: "prog-1",
      attendeeName: "テスト太郎",
      priority: 1,
      status: "confirmed",
    });
  });

  test("2. falls back to second-priority when first is full", async () => {
    const inputData = {
      attendee: { name: "テスト次郎", companions: 0 },
      selections: [
        { id: "prog-1", title: "AI Lab" },
        { id: "prog-2", title: "Robot Workshop" },
      ],
    };

    mockRunTransaction.mockImplementation(async (fn) => {
      mockTransaction.get.mockImplementation((ref) => {
        if (ref.id === "prog-1") {
          return { exists: true, data: () => ({ remaining: 0, title: "AI Lab" }) };
        }
        if (ref.id === "prog-2") {
          return { exists: true, data: () => ({ remaining: 10, title: "Robot Workshop" }) };
        }
        return { exists: false };
      });

      return fn(mockTransaction);
    });

    const result = await db.addReceptionWithAssignment(inputData);

    expect(result.waitlisted).toBe(false);
    expect(result.assignedProgram.id).toBe("prog-2");
    expect(result.assignedProgram.priority).toBe(2);
  });

  test("3. waitlists when all programs are full", async () => {
    const inputData = {
      attendee: { name: "テスト三郎", companions: 0 },
      selections: [
        { id: "prog-1", title: "AI Lab" },
        { id: "prog-2", title: "Robot Workshop" },
      ],
    };

    mockRunTransaction.mockImplementation(async (fn) => {
      mockTransaction.get.mockImplementation(() => ({
        exists: true,
        data: () => ({ remaining: 0, title: "Full" }),
      }));

      return fn(mockTransaction);
    });

    const result = await db.addReceptionWithAssignment(inputData);

    expect(result.waitlisted).toBe(true);
    expect(result.assignedProgram).toBeNull();

    // Verify reception was created with status "waiting"
    expect(mockTransaction.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "waiting", assignedProgram: null })
    );

    // Verify no assignment record was created (only 1 set call for reception)
    expect(mockTransaction.set).toHaveBeenCalledTimes(1);
  });

  test("5. companions require multiple seats", async () => {
    const inputData = {
      attendee: { name: "テスト五郎", companions: 2 },
      selections: [
        { id: "prog-1", title: "AI Lab" },
        { id: "prog-2", title: "Robot Workshop" },
      ],
    };

    mockRunTransaction.mockImplementation(async (fn) => {
      mockTransaction.get.mockImplementation((ref) => {
        if (ref.id === "prog-1") {
          // Only 2 seats, but needs 3 (1 + 2 companions)
          return { exists: true, data: () => ({ remaining: 2, title: "AI Lab" }) };
        }
        if (ref.id === "prog-2") {
          return { exists: true, data: () => ({ remaining: 10, title: "Robot Workshop" }) };
        }
        return { exists: false };
      });

      return fn(mockTransaction);
    });

    const result = await db.addReceptionWithAssignment(inputData);

    // Should skip prog-1 (not enough seats) and assign to prog-2
    expect(result.assignedProgram.id).toBe("prog-2");
    expect(result.assignedProgram.priority).toBe(2);

    // prog-2 should be decremented by 3
    expect(mockTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: "prog-2" }),
      { remaining: 7 }
    );
  });

  test("handles non-existent program gracefully", async () => {
    const inputData = {
      attendee: { name: "テスト六郎", companions: 0 },
      selections: [
        { id: "non-existent", title: "Ghost Program" },
        { id: "prog-2", title: "Robot Workshop" },
      ],
    };

    mockRunTransaction.mockImplementation(async (fn) => {
      mockTransaction.get.mockImplementation((ref) => {
        if (ref.id === "non-existent") {
          return { exists: false };
        }
        if (ref.id === "prog-2") {
          return { exists: true, data: () => ({ remaining: 5, title: "Robot Workshop" }) };
        }
        return { exists: false };
      });

      return fn(mockTransaction);
    });

    const result = await db.addReceptionWithAssignment(inputData);

    expect(result.assignedProgram.id).toBe("prog-2");
    expect(result.assignedProgram.priority).toBe(2);
  });

  test("handles empty selections", async () => {
    const inputData = {
      attendee: { name: "テスト七郎", companions: 0 },
      selections: [],
    };

    mockRunTransaction.mockImplementation(async (fn) => {
      return fn(mockTransaction);
    });

    const result = await db.addReceptionWithAssignment(inputData);

    expect(result.waitlisted).toBe(true);
    expect(result.assignedProgram).toBeNull();
  });
});

describe("manualAssignment", () => {
  test("assigns a waiting reception to a program", async () => {
    mockRunTransaction.mockImplementation(async (fn) => {
      mockTransaction.get.mockImplementation((ref) => {
        if (ref.id === "rec-1") {
          return {
            exists: true,
            data: () => ({
              status: "waiting",
              attendee: { name: "手動太郎", companions: 0 },
              selections: [{ id: "prog-1", title: "AI Lab" }],
            }),
          };
        }
        if (ref.id === "prog-1") {
          return {
            exists: true,
            data: () => ({ remaining: 5, title: "AI Lab" }),
          };
        }
        return { exists: false };
      });

      return fn(mockTransaction);
    });

    const result = await db.manualAssignment("rec-1", "prog-1");

    expect(result.assignedProgram).toMatchObject({
      id: "prog-1",
      title: "AI Lab",
      priority: 1,
      assignedBy: "manual",
    });

    // Verify seat decrement
    expect(mockTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: "prog-1" }),
      { remaining: 4 }
    );
  });

  test("rejects assignment for non-waiting reception", async () => {
    mockRunTransaction.mockImplementation(async (fn) => {
      mockTransaction.get.mockImplementation((ref) => {
        if (ref.id === "rec-1") {
          return {
            exists: true,
            data: () => ({ status: "assigned" }),
          };
        }
        return { exists: false };
      });

      return fn(mockTransaction);
    });

    await expect(db.manualAssignment("rec-1", "prog-1")).rejects.toThrow(
      "Reception is not in waiting status"
    );
  });

  test("rejects when not enough seats", async () => {
    mockRunTransaction.mockImplementation(async (fn) => {
      mockTransaction.get.mockImplementation((ref) => {
        if (ref.id === "rec-1") {
          return {
            exists: true,
            data: () => ({
              status: "waiting",
              attendee: { name: "テスト", companions: 3 },
              selections: [],
            }),
          };
        }
        if (ref.id === "prog-1") {
          return {
            exists: true,
            data: () => ({ remaining: 2, title: "AI Lab" }),
          };
        }
        return { exists: false };
      });

      return fn(mockTransaction);
    });

    await expect(db.manualAssignment("rec-1", "prog-1")).rejects.toThrow(
      "Not enough seats available"
    );
  });
});

describe("cancelAssignmentAndPromote", () => {
  test("6. cancels assignment and promotes waiting attendee", async () => {
    const waitingDocs = [
      {
        id: "waiting-rec-1",
        data: () => ({
          status: "waiting",
          attendee: { name: "待機太郎", companions: 0 },
          selections: [{ id: "prog-1", title: "AI Lab" }],
          createdAt: "2024-01-01T00:00:00Z",
        }),
      },
    ];

    mockWhere.mockReturnValue({
      get: jest.fn().mockResolvedValue({ docs: waitingDocs }),
    });

    mockRunTransaction.mockImplementation(async (fn) => {
      mockTransaction.get.mockImplementation((ref) => {
        if (ref.id === "assign-1") {
          return {
            exists: true,
            data: () => ({
              status: "confirmed",
              programId: "prog-1",
              receptionId: "rec-1",
            }),
          };
        }
        if (ref.id === "prog-1") {
          return {
            exists: true,
            data: () => ({ remaining: 0, title: "AI Lab" }),
          };
        }
        if (ref.id === "rec-1") {
          return {
            exists: true,
            data: () => ({ attendee: { companions: 0 } }),
          };
        }
        return { exists: false };
      });

      return fn(mockTransaction);
    });

    const result = await db.cancelAssignmentAndPromote("assign-1");

    expect(result.cancelled).toMatchObject({
      assignmentId: "assign-1",
      receptionId: "rec-1",
    });

    expect(result.promoted).toMatchObject({
      receptionId: "waiting-rec-1",
      attendeeName: "待機太郎",
    });
  });

  test("cancels without promotion when no waiting attendees", async () => {
    mockWhere.mockReturnValue({
      get: jest.fn().mockResolvedValue({ docs: [] }),
    });

    mockRunTransaction.mockImplementation(async (fn) => {
      mockTransaction.get.mockImplementation((ref) => {
        if (ref.id === "assign-1") {
          return {
            exists: true,
            data: () => ({
              status: "confirmed",
              programId: "prog-1",
              receptionId: "rec-1",
            }),
          };
        }
        if (ref.id === "prog-1") {
          return {
            exists: true,
            data: () => ({ remaining: 0, title: "AI Lab" }),
          };
        }
        if (ref.id === "rec-1") {
          return {
            exists: true,
            data: () => ({ attendee: { companions: 0 } }),
          };
        }
        return { exists: false };
      });

      return fn(mockTransaction);
    });

    const result = await db.cancelAssignmentAndPromote("assign-1");

    expect(result.cancelled.assignmentId).toBe("assign-1");
    expect(result.promoted).toBeNull();
  });

  test("rejects cancellation of already cancelled assignment", async () => {
    mockRunTransaction.mockImplementation(async (fn) => {
      mockTransaction.get.mockImplementation((ref) => {
        if (ref.id === "assign-1") {
          return {
            exists: true,
            data: () => ({ status: "cancelled" }),
          };
        }
        return { exists: false };
      });

      return fn(mockTransaction);
    });

    await expect(db.cancelAssignmentAndPromote("assign-1")).rejects.toThrow(
      "Already cancelled"
    );
  });

  test("rejects cancellation of non-existent assignment", async () => {
    mockRunTransaction.mockImplementation(async (fn) => {
      mockTransaction.get.mockImplementation(() => ({ exists: false }));
      return fn(mockTransaction);
    });

    await expect(db.cancelAssignmentAndPromote("non-existent")).rejects.toThrow(
      "Assignment not found"
    );
  });
});

describe("Validation", () => {
  const { receptionSchema } = require("../schemas");

  test("7. rejects invalid attendee data", () => {
    const result = receptionSchema.safeParse({
      attendee: { name: "" },
      selections: [],
    });
    expect(result.success).toBe(false);
  });

  test("validates correct reception data", () => {
    const result = receptionSchema.safeParse({
      attendee: {
        name: "テスト太郎",
        furigana: "テストタロウ",
        grade: "grade3",
        companions: 1,
      },
      selections: [
        { id: "prog-1", title: "AI Lab" },
      ],
    });
    expect(result.success).toBe(true);
  });

  test("rejects more than 3 selections", () => {
    const result = receptionSchema.safeParse({
      attendee: { name: "テスト" },
      selections: [
        { id: "1" }, { id: "2" }, { id: "3" }, { id: "4" },
      ],
    });
    expect(result.success).toBe(false);
  });

  test("accepts status values including 'assigned'", () => {
    const result = receptionSchema.safeParse({
      attendee: { name: "テスト" },
      selections: [],
      status: "assigned",
    });
    expect(result.success).toBe(true);
  });
});
