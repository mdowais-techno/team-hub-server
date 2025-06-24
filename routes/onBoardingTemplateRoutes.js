import express from 'express';
import {
    getTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
} from '../controllers/onBoardingTemplateController.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateDepartment, validateRequest } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all departments (all authenticated users)
router.get('/', getTemplates);

// Get department by ID (all authenticated users)
router.get('/:id', getTemplateById);

// Admin/HR only routes
router.post('/', authorizeRoles('admin', 'hr'), validateDepartment, validateRequest, createTemplate);
router.put('/:id', authorizeRoles('admin', 'hr'), validateDepartment, validateRequest, updateTemplate);
router.delete('/:id', authorizeRoles('admin'), deleteTemplate);

export default router;