import express from 'express';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from '../controllers/departmentController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateDepartment, validateRequest } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all departments (all authenticated users)
router.get('/', getDepartments);

// Get department by ID (all authenticated users)
router.get('/:id', getDepartmentById);

// Admin/HR only routes
router.post('/', authorizeRoles('admin', 'hr'), validateDepartment, validateRequest, createDepartment);
router.put('/:id', authorizeRoles('admin', 'hr'), validateDepartment, validateRequest, updateDepartment);
router.delete('/:id', authorizeRoles('admin'), deleteDepartment);

export default router;