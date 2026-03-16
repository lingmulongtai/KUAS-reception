import { Router } from 'express';
import { getAggregatedData } from '../services/githubApi';

export const userRouter = Router();

userRouter.get('/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    if (!username || !/^[a-zA-Z0-9-]+$/.test(username)) {
      res.status(400).json({ error: 'Invalid username format. Username must contain only alphanumeric characters and hyphens.' });
      return;
    }
    const data = await getAggregatedData(username);
    res.json(data);
  } catch (err) {
    next(err);
  }
});
