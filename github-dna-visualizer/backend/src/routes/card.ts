import { Router } from 'express';
import { generateCardData, CardData } from '../services/cardGenerator';

export const cardRouter = Router();

cardRouter.post('/generate', (req, res) => {
  try {
    const cardData: CardData = req.body;
    const result = generateCardData(cardData);
    res.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Card generation failed';
    res.status(500).json({ error: message });
  }
});
