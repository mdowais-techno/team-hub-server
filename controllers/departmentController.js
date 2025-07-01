import Department from '../models/Department.js';
import User from '../models/User.js';
import JobProfile from '../models/JobProfile.js';

// Get all departments
export const getDepartments = async (req, res) => {
  try {
    console.log('🏢 Fetching departments...');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || '';

    const query = search
      ? { name: { $regex: search, $options: 'i' } }
      : {};

    const total = await Department.countDocuments(query);

    const departments = await Department.find(query)
      .populate('head', 'name email')
      .populate('employees', 'fullName email jobTitle') // Use 'fullName'
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(); // lean for performance

    // 💡 Fetch job profiles once
    const jobProfiles = await JobProfile.find({}, 'title department').lean();

    // 🧠 Map job profiles by departmentId
    const jobProfilesMap = {};
    for (const profile of jobProfiles) {
      const depId = profile.department.toString();
      if (!jobProfilesMap[depId]) jobProfilesMap[depId] = [];
      jobProfilesMap[depId].push(profile.title);
    }

    // ➕ Inject job profiles into department
    const enrichedDepartments = departments.map(dep => {
      const jobProfileTitles = jobProfilesMap[dep._id.toString()] || [];
      return {
        ...dep,
        jobProfiles: jobProfileTitles,
        jobProfileCount: jobProfileTitles.length,
      };
    });

    console.log(`✅ Enriched ${enrichedDepartments.length} departments`);

    res.status(200).json({
      departments: enrichedDepartments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('❌ Get departments error:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

// Get department by ID
export const getDepartmentById = async (req, res) => {
  try {
    console.log('🏢 Fetching department by ID:', req.params.id);

    // Fetch department details with head & employees populated
    const department = await Department.findById(req.params.id)
      .populate('head', 'name email jobTitle')
      .populate('employees', 'name email jobTitle status')
      .lean(); // Use lean for better performance

    if (!department) {
      console.log('❌ Department not found:', req.params.id);
      return res.status(404).json({ error: 'Department not found' });
    }

    // Fetch job profiles for this department
    const jobProfiles = await JobProfile.find({ department: req.params.id }, 'title').lean();
    const jobProfileTitles = jobProfiles.map(p => p.title);

    // Add job profiles to department object
    const enrichedDepartment = {
      ...department,
      jobProfiles: jobProfileTitles,
      jobProfileCount: jobProfileTitles.length,
    };

    console.log('✅ Department found:', department.name);
    res.json({ department: enrichedDepartment });

  } catch (error) {
    console.error('❌ Get department error:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
};


// Create new department
export const createDepartment = async (req, res) => {
  try {
    console.log('➕ Creating department:', req.body.name);
    const { name, description, head, budget, location } = req.body;

    // Check if department already exists
    const existingDepartment = await Department.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    
    if (existingDepartment) {
      console.log('❌ Department already exists:', name);
      return res.status(400).json({ error: 'Department already exists with this name' });
    }

    const department = new Department({
      name: name.trim(),
      description: description?.trim(),
      head,
      budget,
      location: location?.trim()
    });

    await department.save();
    console.log('✅ Department created:', department.name);

    // Update the head user's department if specified
    if (head) {
      await User.findByIdAndUpdate(head, { department: department._id });
      console.log('👤 Updated head user department');
    }

    const populatedDepartment = await Department.findById(department._id)
      .populate('head', 'name email');

    res.status(201).json({
      message: 'Department created successfully',
      department: populatedDepartment
    });
  } catch (error) {
    console.error('❌ Create department error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Department with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create department' });
  }
};

// Update department
export const updateDepartment = async (req, res) => {
  try {
    console.log('✏️ Updating department:', req.params.id);
    const { name, description, head, budget, location, status } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (head !== undefined) updateData.head = head;
    if (budget !== undefined) updateData.budget = budget;
    if (location !== undefined) updateData.location = location?.trim();
    if (status !== undefined) updateData.status = status;

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('head', 'name email');

    if (!department) {
      console.log('❌ Department not found for update:', req.params.id);
      return res.status(404).json({ error: 'Department not found' });
    }

    // Update the head user's department if changed
    if (head) {
      await User.findByIdAndUpdate(head, { department: department._id });
    }

    console.log('✅ Department updated:', department.name);
    res.json({
      message: 'Department updated successfully',
      department
    });
  } catch (error) {
    console.error('❌ Update department error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Department with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to update department' });
  }
};

// Delete department
export const deleteDepartment = async (req, res) => {
  try {
    console.log('🗑️ Deleting department:', req.params.id);

    const department = await Department.findById(req.params.id);
    if (!department) {
      console.log('❌ Department not found for deletion:', req.params.id);
      return res.status(404).json({ error: 'Department not found' });
    }

    // 1. Check if department has any employees
    const employeeCount = await User.countDocuments({ department: req.params.id });

    // 2. Check if any job profiles are associated with this department
    const jobProfileCount = await JobProfile.countDocuments({ department: req.params.id });

    if (employeeCount > 0 || jobProfileCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete department. Please reassign or remove all employees and job profiles before deleting.',
      });
    }

    await Department.findByIdAndDelete(req.params.id);
    console.log('✅ Department deleted:', department.name);

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('❌ Delete department error:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
};
