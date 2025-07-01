import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
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
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'hr', 'manager', 'employee'],
      message: 'Role must be one of: admin, hr, manager, employee'
    },
    default: 'employee'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  jobProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobProfile'
  },
  jobTitle: {
    type: String,
    trim: true
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  startDate: {
    type: Date
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'on_leave', 'terminated'],
      message: 'Status must be one of: active, inactive, on_leave, terminated'
    },
    default: 'active'
  },
  avatar: {
    type: String
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
  permissions: [{
    type: String
  }],
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate employee ID
// userSchema.pre('save', async function(next) {
//   if (!this.employeeId && this.isNew) {
//     try {
//       const count = await this.constructor.countDocuments();
//       this.employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
//     } catch (error) {
//       console.error('Error generating employee ID:', error);
//     }
//   }
//   next();
// });

// Generate 8-character employee ID with department prefix
userSchema.pre('save', async function (next) {
  if (!this.employeeId && this.isNew) {
    try {
      let deptPrefix = 'GEN'; // default prefix if department is missing
      if (this.department) {
        const Department = mongoose.model('Department');
        const dept = await Department.findById(this.department);
        if (dept && dept.name) {
          deptPrefix = dept.name
            .split(' ')[0]     // Take first word (optional)
            .toUpperCase()
            .slice(0, 3);      // Take first 3 letters
        }
      }

      // Remove non-alphabetic characters from prefix
      deptPrefix = deptPrefix.replace(/[^A-Z]/g, '');

      // Create a numeric suffix (max 5 digits)
      const randomNum = Math.floor(10000 + Math.random() * 90000); // e.g., 12345

      this.employeeId = `${deptPrefix}${randomNum}`.slice(0, 8); // Trim to max 8 chars
    } catch (error) {
      console.error('❌ Error generating employee ID:', error);
    }
  }
  next();
});


// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};



export default mongoose.model('User', userSchema);