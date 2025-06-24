import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const employeeSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters long'],
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  jobProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobProfile',
    required: [true, 'Job profile is required']
  },
  jobTitle: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Inactive', 'On Leave', 'Terminated'],
      message: 'Status must be one of: Active, Inactive, On Leave, Terminated'
    },
    default: 'Active'
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  salary: {
    amount: {
      type: Number,
      min: [0, 'Salary cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  avatar: {
    type: String,
    default: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100'
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'hr', 'manager', 'employee'],
      message: 'Role must be one of: admin, hr, manager, employee'
    },
    default: 'employee'
  },
  lastLogin: {
    type: Date
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate employee ID before saving
employeeSchema.pre('save', async function(next) {
  if (!this.employeeId && this.isNew) {
    try {
      const count = await this.constructor.countDocuments();
      this.employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating employee ID:', error);
    }
  }
  next();
});

// Hash password before saving
employeeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Normalize email before saving
employeeSchema.pre('save', function(next) {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

// Compare password method
employeeSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data when converting to JSON
employeeSchema.methods.toJSON = function() {
  const employee = this.toObject();
  delete employee.password;
  return employee;
};

//Indexes for better performance and uniqueness
// employeeSchema.index({ email: 1 }, { unique: true });
// employeeSchema.index({ employeeId: 1 }, { unique: true, sparse: true });
// employeeSchema.index({ department: 1 });
// employeeSchema.index({ status: 1 });
// employeeSchema.index({ fullName: 1 });

export default mongoose.model('Employee', employeeSchema);