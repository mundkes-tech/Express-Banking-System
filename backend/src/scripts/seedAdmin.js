const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Employee = require('../models/Employee');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const seedAdminUser = async () => {
  try {
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await Employee.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.employeeId);
      process.exit(0);
    }

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);

    const admin = await Employee.create({
      employeeId: 'ADMIN001',
      name: 'Bank Administrator',
      email: 'admin@bankfintech.com',
      password: hashedPassword,
      role: 'admin',
      department: 'Management',
      phone: '9999999999',
      isActive: true,
    });

    console.log('✓ Admin user created successfully!');
    console.log('Admin Details:');
    console.log(`  Employee ID: ${admin.employeeId}`);
    console.log(`  Name: ${admin.name}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Password: Admin@123`);
    console.log(`  Role: ${admin.role}`);
    console.log('\nPlease change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
    process.exit(1);
  }
};

seedAdminUser();
