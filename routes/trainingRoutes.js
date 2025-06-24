import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Placeholder routes for training
router.get('/', authenticateToken, (req, res) => {
  res.json({ message: 'Training endpoint - coming soon' });
});

export default router;