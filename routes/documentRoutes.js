import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Placeholder routes for documents
router.get('/', authenticateToken, (req, res) => {
  res.json({ message: 'Documents endpoint - coming soon' });
});

export default router;