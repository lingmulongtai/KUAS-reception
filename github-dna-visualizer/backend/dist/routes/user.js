"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const githubApi_1 = require("../services/githubApi");
exports.userRouter = (0, express_1.Router)();
exports.userRouter.get('/:username', async (req, res, next) => {
    try {
        const { username } = req.params;
        if (!username || !/^[a-zA-Z0-9-]+$/.test(username)) {
            res.status(400).json({ error: 'Invalid username format. Username must contain only alphanumeric characters and hyphens.' });
            return;
        }
        const data = await (0, githubApi_1.getAggregatedData)(username);
        res.json(data);
    }
    catch (err) {
        next(err);
    }
});
