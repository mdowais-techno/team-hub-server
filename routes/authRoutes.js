import express from 'express';
import { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  changePassword 
} from '../controllers/authController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateRegistration, validateLogin, validateRequest } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/login', validateLogin, validateRequest, login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);

// Admin/HR only routes
router.post('/register', authenticateToken, authorizeRoles('admin', 'hr'), validateRegistration, validateRequest, register);

export default router;