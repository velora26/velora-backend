import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import env from '../config/env';
import { User } from '../models/user.model';

const checkAdmin = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to DB.');
    const admin = await User.findOne({ email: 'admin@velora.com' }).select('+password');
    if (!admin) {
      console.log('Admin account NOT found in database!');
    } else {
      console.log('Admin user found:');
      console.log('ID:', admin._id);
      console.log('Name:', admin.name);
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('IsVerified:', admin.isVerified);
      
      const isMatch = await bcrypt.compare('admin123', admin.password || '');
      console.log('Password check ("admin123" matches?):', isMatch);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error checking admin:', err);
    process.exit(1);
  }
};

checkAdmin();
