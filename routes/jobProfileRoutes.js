import express from 'express';
import {
  getJobProfiles,
  getJobProfileById,
  createJobProfile,
  updateJobProfile,
  deleteJobProfile
} from '../controllers/jobProfileController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateJobProfile, validateRequest } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all job profiles (all authenticated users)
router.get('/', getJobProfiles);

// Get job profile by ID (all authenticated users)
router.get('/:id', getJobProfileById);

// Admin/HR only routes
router.post('/', authorizeRoles('admin', 'hr'), validateJobProfile, validateRequest, createJobProfile);
router.put('/:id', authorizeRoles('admin', 'hr'), validateJobProfile, validateRequest, updateJobProfile);
router.delete('/:id', authorizeRoles('admin'), deleteJobProfile);

export default router;