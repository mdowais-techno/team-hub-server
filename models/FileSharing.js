// models/FileSharing.js
import mongoose from 'mongoose';

const sharingFileSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  jobProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobProfile'
  },
  accessType: {
    type: String,
    enum: ['viewer', 'editor', 'admin'],
    default: 'viewer'
  },
  sharedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create compound indexes to prevent duplicate shares
// sharingFileSchema.index({ key: 1, user: 1 }, { unique: true, sparse: true });
// sharingFileSchema.index({ key: 1, department: 1 }, { unique: true, sparse: true });
// sharingFileSchema.index({ key: 1, jobProfile: 1 }, { unique: true, sparse: true });

const SharingFile = mongoose.model('SharingFile', sharingFileSchema);
export default SharingFile;
