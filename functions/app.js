const express = require("express");
const cors = require("cors");
const { DeepL } = require("deepl-node");
const { receptionSchema, translateSchema, manualAssignmentSchema } = require("./schemas");
const db = require("./db");
const logger = require("firebase-functions/logger");
const { verifyAuth } = require("./middleware/auth");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// --- Programs ---
// GET /programs — Public: anyone can view programs
app.get("/programs", async (req, res) => {
    try {
        const programs = await db.getPrograms();
        res.json({ programs });
    } catch (e) {
        logger.error(e);
        res.status(500).json({ error: "Internal Error" });
    }
});

// PATCH /programs/:id — Admin only: update program capacity
app.patch("/programs/:id", verifyAuth, async (req, res) => {
    try {
        const { remaining } = req.body;
        if (typeof remaining !== 'number' || remaining < 0) {
            return res.status(400).json({ error: "Invalid capacity" });
        }
        await db.updateProgramCapacity(req.params.id, remaining);
        res.json({ success: true });
    } catch (e) {
        logger.error(e);
        res.status(500).json({ error: "Internal Error" });
    }
});

// --- Receptions ---
// POST /receptions — Public: attendees submit reception with automatic assignment
app.post("/receptions", async (req, res) => {
    try {
        const result = receptionSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: "Validation Error", details: result.error.format() });
        }
        const assignmentResult = await db.addReceptionWithAssignment(result.data);
        res.json(assignmentResult);
    } catch (e) {
        logger.error(e);
        res.status(500).json({ error: "Internal Error" });
    }
});

// GET /receptions/stats — Public: view reception statistics
app.get("/receptions/stats", async (req, res) => {
    try {
        const stats = await db.getReceptionStats();
        res.json(stats);
    } catch (e) {
        logger.error(e);
        res.status(500).json({ error: "Internal Error" });
    }
});

// --- Assignments ---
// POST /assignments/manual — Admin only: manual assignment
app.post("/assignments/manual", verifyAuth, async (req, res) => {
    const parsed = manualAssignmentSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Validation Error", details: parsed.error.format() });
    }

    const { receptionId, programId } = parsed.data;

    try {
        const result = await db.manualAssignment(receptionId, programId);
        res.json(result);
    } catch (e) {
        logger.error(e);
        res.status(500).json({ error: e.message || "Internal Error" });
    }
});

// POST /assignments/:id/cancel — Admin only: cancel assignment and promote waitlisted
app.post("/assignments/:id/cancel", verifyAuth, async (req, res) => {
    try {
        const result = await db.cancelAssignmentAndPromote(req.params.id);
        res.json(result);
    } catch (e) {
        logger.error(e);
        res.status(500).json({ error: e.message || "Internal Error" });
    }
});

// --- Settings ---
app.get("/system/settings", async (req, res) => {
    try {
        const settings = await db.getSystemSettings();
        res.json(settings);
    } catch (e) {
        logger.error(e);
        res.status(500).json({ error: "Internal Error" });
    }
});

// --- Translation ---
const ruleBasedTranslate = (text, targetLang) => {
    const dictionaries = {
        EN: { "予約": "reservation", "受付": "reception", "完了": "completed" },
        JA: { reservation: "予約", reception: "受付", completed: "完了" },
    };
    const dict = dictionaries[targetLang?.toUpperCase()] ?? {};
    return text.split(/(\s+)/).map(s => dict[s.toLowerCase()] ?? dict[s] ?? s).join("");
};

// POST /translate — Public: translation service
app.post("/translate", async (req, res) => {
    const { text, targetLang } = req.body;
    if (!text || !targetLang) return res.status(400).json({ error: "Missing text or targetLang" });

    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
        return res.json({ translation: ruleBasedTranslate(text, targetLang), provider: "rule-based" });
    }

    try {
        const client = new DeepL({ authKey: apiKey });
        const result = await client.translateText(text, null, targetLang);
        res.json({ translation: result.text, provider: "deepl" });
    } catch (e) {
        logger.error("DeepL Error", e);
        res.json({ translation: ruleBasedTranslate(text, targetLang), provider: "rule-based-fallback" });
    }
});

module.exports = app;
