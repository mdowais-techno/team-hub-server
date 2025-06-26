
const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Permission profile name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  jobProfile: {
    type: String,
    trim: true
  },
  sections: [{
    id: String,
    title: String,
    permissions: [{
      id: String,
      name: String,
      view: Boolean,
      add: Boolean,
      edit: Boolean,
      delete: Boolean,
      more: String
    }]
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the 'updatedAt' field on save
permissionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;
