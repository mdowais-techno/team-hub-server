import mongoose from 'mongoose';

const externalLinkSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    path: {
      type: String,
      trim: true,
      default: ''
    },
    type: {
      type: String,
      enum: ['link'],
      default: 'link'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

const ExternalLink = mongoose.model('ExternalLink', externalLinkSchema);
export default ExternalLink;