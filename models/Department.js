import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Department name must be at least 2 characters long'],
    maxlength: [100, 'Department name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  employees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  budget: {
    amount: {
      type: Number,
      min: [0, 'Budget cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive'],
      message: 'Status must be either active or inactive'
    },
    default: 'active'
  }
}, {
  timestamps: true
});

// Virtual for employee count
departmentSchema.virtual('employeeCount').get(function() {
  return this.employees ? this.employees.length : 0;
});

// Ensure virtuals are included in JSON output
departmentSchema.set('toJSON', { virtuals: true });


export default mongoose.model('Department', departmentSchema);