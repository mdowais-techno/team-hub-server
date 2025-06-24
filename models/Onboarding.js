import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    minlength: [1, 'Task title must be at least 1 character long'],
    maxlength: [100, 'Task title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true,
    minlength: [1, 'Description must be at least 1 character long'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  completedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

const onboardingSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  position: { type: String, required: true },
  startDate: { type: Date, required: true },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  description: {
    type: String,
    trim: true,
    minlength: [1, 'Description must be at least 1 character long'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  avatar: {
    type: String,
    default: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100'
  },
  tasks: [taskSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

export default mongoose.model('OnboardingProcess', onboardingSchema);
