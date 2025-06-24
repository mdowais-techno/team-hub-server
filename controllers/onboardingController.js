import Onboarding from '../models/Onboarding.js';

// ✅ Get all Onboarding with pagination & search
export const getOnboarding = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || '';

    const query = search
      ? { name: { $regex: search, $options: 'i' } }
      : {};

    const total = await Onboarding.countDocuments(query);

    const onboardings = await Onboarding.find(query)
      .populate('createdBy', 'name email role')
      .populate('department', 'name')
      .populate('tasks.mentor', 'fullName avatar phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.status(200).json({
      onboardings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('❌ Error fetching onboarding:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding' });
  }
};

// ✅ Get Onboarding by ID
export const getOnboardingById = async (req, res) => {
  try {
    const onboarding = await Onboarding.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('department', 'name')
      .populate('tasks.mentor', 'fullName avatar phone');

    if (!onboarding) {
      return res.status(404).json({ error: 'Onboarding not found' });
    }

    res.status(200).json({ onboarding });
  } catch (error) {
    console.error('❌ Error fetching Onboarding by ID:', error);
    res.status(500).json({ error: 'Failed to fetch Onboarding' });
  }
};

// ✅ Create Onboarding — only 'admin' or 'hr'
export const createOnboarding = async (req, res) => {
  try {
    const { name, position, startDate, department, description, tasks } = req.body;

    if (!['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Only Admin or HR can create onboarding.' });
    }

    const newOnboarding = new Onboarding({
      name: name.trim(),
      position: position.trim(),
      startDate,
      department,
      description: description.trim(),
      tasks,
      createdBy: req.user._id,
    });

    await newOnboarding.save();

    res.status(201).json({
      message: 'Onboarding created successfully',
      onboarding: newOnboarding,
    });
  } catch (error) {
    console.error('❌ Error creating Onboarding:', error);
    res.status(500).json({ error: 'Failed to create Onboarding' });
  }
};

// ✅ Update Onboarding — only creator or admin/hr
export const updateOnboarding = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, position, startDate, department, description, tasks } = req.body;

    const onboarding = await Onboarding.findById(id);
    if (!onboarding) {
      return res.status(404).json({ error: 'Onboarding not found' });
    }

    if (!['admin', 'hr'].includes(req.user.role) && !onboarding.createdBy.equals(req.user._id)) {
      return res.status(403).json({ error: 'Access denied. You are not authorized to update this onboarding.' });
    }

    onboarding.name = name?.trim() || onboarding.name;
    onboarding.position = position?.trim() || onboarding.position;
    onboarding.startDate = startDate || onboarding.startDate;
    onboarding.department = department || onboarding.department;
    onboarding.description = description?.trim() || onboarding.description;
    onboarding.tasks = tasks || onboarding.tasks;

    await onboarding.save();

    res.json({
      message: 'Onboarding updated successfully',
      onboarding,
    });
  } catch (error) {
    console.error('❌ Error updating onboarding:', error);
    res.status(500).json({ error: 'Failed to update onboarding' });
  }
};

// ✅ Delete Onboarding — only creator or admin
export const deleteOnboarding = async (req, res) => {
  try {
    const { id } = req.params;
    const onboarding = await Onboarding.findById(id);

    if (!onboarding) {
      return res.status(404).json({ error: 'Onboarding not found' });
    }

    if (!['admin'].includes(req.user.role) && !onboarding.createdBy.equals(req.user._id)) {
      return res.status(403).json({ error: 'Access denied. You cannot delete this Onboarding.' });
    }

    await Onboarding.findByIdAndDelete(id);

    res.json({ message: 'Onboarding deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting Onboarding:', error);
    res.status(500).json({ error: 'Failed to delete Onboarding' });
  }
};
