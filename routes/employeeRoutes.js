import express from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  getEmployeesByDepartment
} from '../controllers/employeeController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Employee validation rules
const validateEmployee = [
  body('fullName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters'),
  body('email')
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage('Valid email is required'),
  body('department')
    .isMongoId()
    .withMessage('Valid department ID is required'),
  body('jobProfile')
    .isMongoId()
    .withMessage('Valid job profile ID is required'),
  body('jobTitle')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Job title must be at least 2 characters'),
  body('startDate')
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('status')
    .optional()
    .isIn(['Active', 'Inactive', 'On Leave', 'Terminated'])
    .withMessage('Invalid status'),
  body('role')
    .optional()
    .isIn(['admin', 'hr', 'manager', 'employee'])
    .withMessage('Invalid role')
];

const validateEmployeeUpdate = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage('Valid email is required'),
  body('department')
    .optional()
    .isMongoId()
    .withMessage('Valid department ID is required'),
  body('jobProfile')
    .optional()
    .isMongoId()
    .withMessage('Valid job profile ID is required'),
  body('jobTitle')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Job title must be at least 2 characters'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('status')
    .optional()
    .isIn(['Active', 'Inactive', 'On Leave', 'Terminated'])
    .withMessage('Invalid status'),
  body('role')
    .optional()
    .isIn(['admin', 'hr', 'manager', 'employee'])
    .withMessage('Invalid role')
];

const validateMongoId = [
  param('id').isMongoId().withMessage('Valid employee ID is required')
];

// All routes require authentication
router.use(authenticateToken);

// Get all employees (admin, hr, manager can access)
router.get('/', authorizeRoles('admin', 'hr', 'manager'), getEmployees);

// Get employee statistics (admin, hr can access)
router.get('/stats', authorizeRoles('admin', 'hr'), getEmployeeStats);

// Get employees by department (admin, hr, manager can access)
router.get('/department/:departmentId', 
  authorizeRoles('admin', 'hr', 'manager'),
  [param('departmentId').isMongoId().withMessage('Valid department ID is required')],
  validateRequest,
  getEmployeesByDepartment
);

// Get employee by ID (admin, hr, manager can access, employees can access their own)
router.get('/:id', 
  validateMongoId,
  validateRequest,
  getEmployeeById
);

// Create new employee (admin, hr only)
router.post('/', 
  authorizeRoles('admin', 'hr'), 
  validateEmployee, 
  validateRequest, 
  createEmployee
);

// Update employee (admin, hr only)
router.put('/:id', 
  authorizeRoles('admin', 'hr'), 
  validateMongoId.concat(validateEmployeeUpdate), 
  validateRequest, 
  updateEmployee
);

// Delete employee (admin only)
router.delete('/:id', 
  authorizeRoles('admin'), 
  validateMongoId, 
  validateRequest, 
  deleteEmployee
);

export default router;