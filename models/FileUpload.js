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

// import mongoose from 'mongoose';

// const fileUploadSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true
//     },
//     size: {
//       type: Number,
//       default: null // Optional for external links
//     },
//     key: {
//       type: String,
//       trim: true,
//       default: '' // Optional for external links
//     },
//     type: {
//       type: String,
//       enum: ['file', 'link'], // Can be a physical file or an external link
//       required: true
//     },
//     url: {
//       type: String,
//       trim: true,
//       default: null // Only used for external links
//     },
//     path: {
//       type: String,
//       trim: true,
//       default: ''
//     },
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true
//     }
//   },
//   {
//     timestamps: true
//   }
// );

// const FileUpload = mongoose.model('FileUpload', fileUploadSchema);
// export default FileUpload;
