import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import JobProfile from '../models/JobProfile.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
// Get all employees
export const getEmployees = async (req, res) => {
  try {
    console.log('👥 Fetching employees...');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || '';
    const department = req.query.department || '';
    const status = req.query.status || '';

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) query.department = department;
    if (status) query.status = status;

    const total = await Employee.countDocuments(query);

    const employees = await Employee.find(query)
      .populate('department', 'name')
      .populate('jobProfile', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    console.log(`✅ Found ${employees.length} employees`);

    res.status(200).json({
      employees,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('❌ Get employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

// Get employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    console.log('👤 Fetching employee by ID:', req.params.id);
    const employee = await Employee.findById(req.params.id)
      .populate('department', 'name')
      .populate('jobProfile', 'title');

    if (!employee) {
      console.log('❌ Employee not found:', req.params.id);
      return res.status(404).json({ error: 'Employee not found' });
    }

    console.log('✅ Employee found:', employee.fullName);
    res.json({ employee });
  } catch (error) {
    console.error('❌ Get employee error:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
};

// Create new employee
export const createEmployee2 = async (req, res) => {
  try {
    console.log('➕ Creating employee:', req.body);
    const {
      fullName,
      email,
      password,
      department,
      jobProfile,
      jobTitle,
      startDate,
      status,
      phone,
      salary,
      role
    } = req.body;

    // Normalize email for checking duplicates
    const normalizedEmail = email.toLowerCase().trim();
    console.log('🔍 Checking for existing employee with email:', normalizedEmail);

    // Check if employee already exists with normalized email
    const existingEmployee = await Employee.findOne({
      email: normalizedEmail
    });

    if (existingEmployee) {
      console.log('❌ Employee already exists with email:', normalizedEmail);
      console.log('❌ Existing employee:', existingEmployee.email);
      return res.status(400).json({
        error: 'An employee with this email address already exists',
        field: 'email'
      });
    }

    // Verify department exists
    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      console.log('❌ Invalid department:', department);
      return res.status(400).json({ error: 'Invalid department selected' });
    }

    // Verify job profile exists
    const jobProfileExists = await JobProfile.findById(jobProfile);
    if (!jobProfileExists) {
      console.log('❌ Invalid job profile:', jobProfile);
      return res.status(400).json({ error: 'Invalid job profile selected' });
    }

    // Prepare employee data
    const employeeData = {
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: password || 'defaultPassword123',
      department,
      jobProfile,
      jobTitle: jobTitle.trim(),
      startDate,
      status: status || 'Active',
      role: role || 'employee'
    };

    // Add optional fields if provided
    if (phone && phone.trim()) {
      employeeData.phone = phone.trim();
    }

    // Handle salary - convert to number and validate
    if (salary !== undefined && salary !== null && salary !== '') {
      const salaryAmount = Number(salary);
      if (isNaN(salaryAmount) || salaryAmount < 0) {
        return res.status(400).json({
          error: 'Salary must be a valid positive number',
          field: 'salary'
        });
      }
      employeeData.salary = {
        amount: salaryAmount,
        currency: 'USD'
      };
    }

    console.log('📝 Creating employee with data:', employeeData);

    const employee = new Employee(employeeData);
    await employee.save();

    console.log('✅ Employee created successfully:', employee.fullName);

    // 🔐 Also create corresponding user for login
    const userExists = await User.findOne({ email: normalizedEmail });
    if (!userExists) {
      const user = new User({
        name: employee.fullName,
        email: employee.email,
        password: employee.password,
        role: employee.role,
        department: employee.department,
        jobProfile: employee.jobProfile,
        jobTitle: employee.jobTitle,
        startDate: employee.startDate,
        employeeId:"EMP0003"
      });

      await user.save();
      console.log('✅ Linked user created for employee:', user.email);
    }

    // Update department's employee list
    await Department.findByIdAndUpdate(
      department,
      { $addToSet: { employees: employee._id } }
    );

    const populatedEmployee = await Employee.findById(employee._id)
      .populate('department', 'name')
      .populate('jobProfile', 'title');

    res.status(201).json({
      message: 'Employee created successfully',
      employee: populatedEmployee
    });
  } catch (error) {
    console.error('❌ Create employee error:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      if (field === 'email') {
        return res.status(400).json({
          error: 'An employee with this email address already exists',
          field: 'email'
        });
      }
      return res.status(400).json({
        error: 'Duplicate entry detected',
        field: field || 'unknown'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }

    res.status(500).json({ error: 'Failed to create employee' });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      department,
      jobProfile,
      jobTitle,
      startDate,
      status,
      phone,
      salary,
      role
    } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    // 🔍 Check if employee exists
    const existingEmployee = await Employee.findOne({ email: normalizedEmail });
    if (existingEmployee) {
      return res.status(400).json({
        error: 'An employee with this email address already exists',
        field: 'email'
      });
    }

    // ✅ Validate department and job profile
    const [departmentExists, jobProfileExists] = await Promise.all([
      Department.findById(department),
      JobProfile.findById(jobProfile)
    ]);

    if (!departmentExists) {
      return res.status(400).json({ error: 'Invalid department selected' });
    }
    if (!jobProfileExists) {
      return res.status(400).json({ error: 'Invalid job profile selected' });
    }

    // 🔐 Hash password once
    const hashedPassword = await bcrypt.hash(password || 'defaultPassword123', 12);

    // ✅ Step 1: Create user first (auto-generates employeeId in pre-save)
    const user = new User({
      name: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role || 'employee',
      department,
      jobProfile,
      jobTitle: jobTitle.trim(),
      startDate
    });

    await user.save(); // triggers pre-save to generate employeeId

    // ✅ Step 2: Use same employeeId in Employee
    const employee = new Employee({
      fullName: user.name,
      email: user.email,
      password: user.password,
      department: user.department,
      jobProfile: user.jobProfile,
      jobTitle: user.jobTitle,
      startDate: user.startDate,
      status: status || 'Active',
      role: user.role,
      employeeId: user.employeeId,
      phone: phone?.trim(),
      salary: salary
        ? { amount: Number(salary), currency: 'USD' }
        : undefined
    });

    await employee.save();

    // 📌 Add employee to department
    await Department.findByIdAndUpdate(
      department,
      { $addToSet: { employees: employee._id } }
    );

    const populatedEmployee = await Employee.findById(employee._id)
      .populate('department', 'name')
      .populate('jobProfile', 'title');

    return res.status(201).json({
      message: 'Employee created successfully',
      employee: populatedEmployee
    });
  } catch (error) {
    console.error('❌ Error creating employee:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(400).json({
        error: `Duplicate entry for ${field}`,
        field
      });
    }

    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ error: 'Validation failed', details });
    }

    return res.status(500).json({ error: 'Failed to create employee' });
  }
};

// Update employee
export const updateEmployee = async (req, res) => {
  try {
    console.log('✏️ Updating employee:', req.params.id);
    const {
      fullName,
      email,
      department,
      jobProfile,
      jobTitle,
      startDate,
      status,
      phone,
      salary,
      role
    } = req.body;

    const updateData = {};

    if (fullName) updateData.fullName = fullName.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (department) updateData.department = department;
    if (jobProfile) updateData.jobProfile = jobProfile;
    if (jobTitle) updateData.jobTitle = jobTitle.trim();
    if (startDate) updateData.startDate = startDate;
    if (status) updateData.status = status;
    if (phone !== undefined) updateData.phone = phone?.trim();
    if (role) updateData.role = role;

    // Handle salary update
    if (salary !== undefined) {
      if (salary === null || salary === '') {
        updateData.salary = undefined;
      } else {
        const salaryAmount = Number(salary);
        if (isNaN(salaryAmount) || salaryAmount < 0) {
          return res.status(400).json({
            error: 'Salary must be a valid positive number',
            field: 'salary'
          });
        }
        updateData.salary = {
          amount: salaryAmount,
          currency: 'USD'
        };
      }
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('department', 'name').populate('jobProfile', 'title');

    if (!employee) {
      console.log('❌ Employee not found for update:', req.params.id);
      return res.status(404).json({ error: 'Employee not found' });
    }

    console.log('✅ Employee updated:', employee.fullName);
    res.json({
      message: 'Employee updated successfully',
      employee
    });
  } catch (error) {
    console.error('❌ Update employee error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      if (field === 'email') {
        return res.status(400).json({
          error: 'An employee with this email address already exists',
          field: 'email'
        });
      }
      return res.status(400).json({
        error: 'Duplicate entry detected',
        field: field || 'unknown'
      });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }

    res.status(500).json({ error: 'Failed to update employee' });
  }
};

// Delete employee
export const deleteEmployee = async (req, res) => {
  try {
    console.log('🗑️ Deleting employee:', req.params.id);
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      console.log('❌ Employee not found for deletion:', req.params.id);
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Remove employee from department's employee list
    await Department.findByIdAndUpdate(
      employee.department,
      { $pull: { employees: employee._id } }
    );

    await Employee.findByIdAndDelete(req.params.id);
    console.log('✅ Employee deleted:', employee.fullName);

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('❌ Delete employee error:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
};

// Get employee statistics
export const getEmployeeStats = async (req, res) => {
  try {
    console.log('📊 Fetching employee statistics...');

    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'Active' });
    const inactiveEmployees = await Employee.countDocuments({ status: 'Inactive' });

    const departmentStats = await Employee.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'department'
        }
      },
      {
        $unwind: '$department'
      },
      {
        $project: {
          departmentName: '$department.name',
          count: 1
        }
      }
    ]);

    console.log('✅ Employee statistics calculated');

    res.json({
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      inactiveEmployees,
      departmentStats
    });
  } catch (error) {
    console.error('❌ Get employee stats error:', error);
    res.status(500).json({ error: 'Failed to fetch employee statistics' });
  }
};

// Get employees by department
export const getEmployeesByDepartment = async (req, res) => {
  try {
    console.log('🏢 Fetching employees by department:', req.params.departmentId);

    const employees = await Employee.find({ department: req.params.departmentId })
      .populate('department', 'name')
      .populate('jobProfile', 'title')
      .sort({ fullName: 1 });

    console.log(`✅ Found ${employees.length} employees in department`);

    res.json({ employees });
  } catch (error) {
    console.error('❌ Get employees by department error:', error);
    res.status(500).json({ error: 'Failed to fetch employees by department' });
  }
};