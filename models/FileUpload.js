import mongoose from 'mongoose';

const fileUploadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    key: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    path: {
      type: String,
      trim: true,
      default: ''
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

const FileUpload = mongoose.model('FileUpload', fileUploadSchema);
export default FileUpload;