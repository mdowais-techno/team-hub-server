import express from 'express';
import User from '../models/User.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all users (admin/hr only)
router.get('/', authorizeRoles('admin', 'hr'), async (req, res) => {
  try {
    const { page = 1, limit = 10, department, role, status, search } = req.query;
    
    const query = {};
    if (department) query.department = department;
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .populate('department', 'name')
      .populate('jobProfile', 'title')
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('department', 'name')
      .populate('jobProfile', 'title')
      .select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user can access this profile
    if (req.user.id !== req.params.id && !['admin', 'hr', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;