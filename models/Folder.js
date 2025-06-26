import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    path: {
      type: String,
      trim: true,
      default: ''
    },
    parent: {
      type: String,
      trim: true,
      default: ''
    },
    type: {
      type: String,
      enum: ['folder'],
      default: 'folder'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

const Folder = mongoose.model('Folder', folderSchema);
export default Folder;
