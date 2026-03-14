const admin = require("firebase-admin");

/**
 * Express middleware that verifies Firebase Auth ID tokens.
 * Extracts the token from the Authorization header (Bearer <token>).
 * On success, attaches the decoded token to req.user.
 */
const verifyAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "認証トークンがありません" });
    }

    const token = authHeader.split("Bearer ")[1];

    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(403).json({ error: "認証トークンが無効です" });
    }
};

module.exports = { verifyAuth };
