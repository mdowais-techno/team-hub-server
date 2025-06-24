import OnBoardingTemplate from '../models/OnBoardingTemplate.js';


// ✅ Get all templates with pagination & search
export const getTemplates = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || '';

    const query = search
      ? { name: { $regex: search, $options: 'i' } }
      : {};

    const total = await OnBoardingTemplate.countDocuments(query);

    const templates = await OnBoardingTemplate.find(query)
      .populate('createdBy', 'name email role')
      .populate('department', 'name')
      .populate('tasks.mentor', 'fullName avatar phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.status(200).json({
      templates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

// ✅ Get template by ID
export const getTemplateById = async (req, res) => {
  try {
    const template = await OnBoardingTemplate.findById(req.params.id).populate('createdBy', 'name email role').populate('department', 'name').populate('tasks.mentor', 'fullName avatar phone');

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.status(200).json({ template });
  } catch (error) {
    console.error('❌ Error fetching template by ID:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
};

// ✅ Create template — only 'admin' or 'hr'
export const createTemplate = async (req, res) => {
  try {
    const { name, department, description, tasks } = req.body;

    // Role check
    if (!['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Only Admin or HR can create templates.' });
    }

    const newTemplate = new OnBoardingTemplate({
      name: name.trim(),
      department: department.trim(),
      description: description.trim(),
      tasks,
      createdBy: req.user._id,
    });

    await newTemplate.save();

    res.status(201).json({
      message: 'Template created successfully',
      template: newTemplate,
    });
  } catch (error) {
    console.error('❌ Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
};

// ✅ Update template — only creator or admin/hr
export const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, description, tasks } = req.body;

    const template = await OnBoardingTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Allow only admin/hr or creator to update
    if (
      !['admin', 'hr'].includes(req.user.role) &&
      !template.createdBy.equals(req.user._id)
    ) {
      return res.status(403).json({ error: 'Access denied. You are not authorized to update this template.' });
    }

    template.name = name?.trim() || template.name;
    template.department = department?.trim() || template.department;
    template.description = description?.trim() || template.description;
    template.tasks = tasks || template.tasks;

    await template.save();

    res.json({
      message: 'Template updated successfully',
      template,
    });
  } catch (error) {
    console.error('❌ Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
};

// ✅ Delete template — only creator or admin
export const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await OnBoardingTemplate.findById(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Only admin or creator can delete
    if (
      !['admin'].includes(req.user.role) &&
      !template.createdBy.equals(req.user._id)
    ) {
      return res.status(403).json({ error: 'Access denied. You cannot delete this template.' });
    }

    await OnBoardingTemplate.findByIdAndDelete(id);

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
};
