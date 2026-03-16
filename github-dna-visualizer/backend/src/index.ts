import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { userRouter } from './routes/user';
import { cardRouter } from './routes/card';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/user', userRouter);
app.use('/api/card', cardRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({ error: isDev ? (err.message || 'Internal Server Error') : 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`GitHub DNA Visualizer backend running on http://localhost:${PORT}`);
});

export default app;
