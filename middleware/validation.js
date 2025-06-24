import { body, validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

export const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'hr', 'manager', 'employee'])
    .withMessage('Invalid role')
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const validateDepartment = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Department name must be at least 2 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters')
];

export const validateJobProfile = [
  body('title')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Job title must be at least 2 characters'),
  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  body('department')
    .isMongoId()
    .withMessage('Valid department ID is required')
];