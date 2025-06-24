import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/services/user/models/User.js';

dotenv.config();
mongoose.connect(process.env.MONGODB_URI);

const seedAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ email: 'admin@teamhub.com' });
    if (existingAdmin) {
      console.log('Admin already exists');
      return process.exit(0);
    }

    const admin = new User({
      name: 'Master Admin',
      email: 'admin@teamhub.com',
      password: 'password', // Will be hashed automatically
      role: 'admin',
      status: 'active'
    });

    await admin.save();
    console.log('Master admin created successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
};

seedAdmin();
