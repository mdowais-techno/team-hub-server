import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true,
        minlength: [1, 'Task title must be at least 1 characters long'],
        maxlength: [100, 'Task title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Task description is required'],
        trim: true,
        minlength: [1, 'Description must be at least 1 characters long'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    mentor:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    }
});

const templateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    description: {
        type: String,
        required: [true, 'Template description is required'],
        trim: true,
        minlength: [1, 'Description must be at least 1 characters long'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    tasks: [taskSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

export default mongoose.model('OnboardingTemplate', templateSchema);
