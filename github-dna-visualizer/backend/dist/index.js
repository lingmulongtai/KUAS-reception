"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const user_1 = require("./routes/user");
const card_1 = require("./routes/card");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    methods: ['GET', 'POST'],
    credentials: true,
}));
app.use(express_1.default.json());
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/user', user_1.userRouter);
app.use('/api/card', card_1.cardRouter);
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({ error: isDev ? (err.message || 'Internal Server Error') : 'Internal Server Error' });
});
app.listen(PORT, () => {
    console.log(`GitHub DNA Visualizer backend running on http://localhost:${PORT}`);
});
exports.default = app;
