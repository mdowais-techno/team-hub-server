import express from 'express';
import {
    getOnboarding,
    getOnboardingById,
    createOnboarding,
    updateOnboarding,
    deleteOnboarding,
} from '../controllers/onboardingController.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateDepartment, validateRequest } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all onboarding (all authenticated users)
router.get('/', getOnboarding);

// Get onboarding by ID (all authenticated users)
router.get('/:id', getOnboardingById);

// Admin/HR only routes
router.post('/', authorizeRoles('admin', 'hr'), validateDepartment, validateRequest, createOnboarding);
router.put('/:id', authorizeRoles('admin', 'hr'), validateDepartment, validateRequest, updateOnboarding);
router.delete('/:id', authorizeRoles('admin'), deleteOnboarding);

export default router;