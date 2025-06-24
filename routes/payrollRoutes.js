import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Placeholder routes for payroll
router.get('/', authenticateToken, (req, res) => {
  res.json({ message: 'Payroll endpoint - coming soon' });
});

export default router;