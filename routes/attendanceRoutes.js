import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Placeholder routes for attendance
router.get('/', authenticateToken, (req, res) => {
  res.json({ message: 'Attendance endpoint - coming soon' });
});

export default router;