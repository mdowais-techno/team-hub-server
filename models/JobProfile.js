import mongoose from 'mongoose';

const jobProfileSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    minlength: [2, 'Job title must be at least 2 characters long'],
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  responsibilities: [{
    type: String,
    trim: true,
    maxlength: [500, 'Each responsibility cannot exceed 500 characters']
  }],
  requirements: [{
    type: String,
    trim: true,
    maxlength: [500, 'Each requirement cannot exceed 500 characters']
  }],
  skills: [{
    type: String,
    trim: true,
    maxlength: [100, 'Each skill cannot exceed 100 characters']
  }],
  modules: {
    type: Number,
    enum: {
      values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      message: 'Modules must be between 1 and 10'
    },
    default: 1
  },
  positions: {
    type: Number,
    enum: {
      values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      message: 'Positions must be between 1 and 10'
    },
    default: 1
  },
  experienceLevel: {
    type: String,
    enum: {
      values: ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'],
      message: 'Experience level must be one of: entry, junior, mid, senior, lead, executive'
    },
    default: 'entry'
  },
  salaryRange: {
    min: {
      type: Number,
      default: 0,
      min: [0, 'Minimum salary cannot be negative']
    },
    max: {
      type: Number,
      default: 0,
      min: [0, 'Maximum salary cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  employmentType: {
    type: String,
    enum: {
      values: ['full-time', 'part-time', 'contract', 'internship'],
      message: 'Employment type must be one of: full-time, part-time, contract, internship'
    },
    default: 'full-time'
  },
  location: {
    type: String,
    enum: {
      values: ['remote', 'on-site', 'hybrid'],
      message: 'Location must be one of: remote, on-site, hybrid'
    },
    default: 'on-site'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required']
  }
}, {
  timestamps: true
});

// Validation for salary range
jobProfileSchema.pre('save', function(next) {
  if (this.salaryRange.min > this.salaryRange.max && this.salaryRange.max > 0) {
    next(new Error('Minimum salary cannot be greater than maximum salary'));
  }
  next();
});

export default mongoose.model('JobProfile', jobProfileSchema);