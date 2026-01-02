const express = require("express");
const cors = require("cors");
const { DeepL } = require("deepl-node");
const { receptionSchema, translateSchema } = require("./schemas");
const db = require("./db");
const logger = require("firebase-functions/logger");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// --- Programs ---
app.get("/programs", async (req, res) => {
    try {
        const programs = await db.getPrograms();
        res.json({ programs });
    } catch (e) {
        logger.error(e);
        res.status(500).json({ error: "Internal Error" });
    }
});

app.patch("/programs/:id", async (req, res) => {
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
app.post("/receptions", async (req, res) => {
    try {
        const result = receptionSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: "Validation Error", details: result.error.format() });
        }
        const id = await db.addReception(result.data);
        res.json({ id });
    } catch (e) {
        logger.error(e);
        res.status(500).json({ error: "Internal Error" });
    }
});

app.get("/receptions/stats", async (req, res) => {
    try {
        const stats = await db.getReceptionStats();
        res.json(stats);
    } catch (e) {
        logger.error(e);
        res.status(500).json({ error: "Internal Error" });
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
