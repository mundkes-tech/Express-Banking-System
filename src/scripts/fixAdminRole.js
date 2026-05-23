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

const fixAdminRole = async () => {
  try {
    await connectDB();

    // Update admin role
    const result = await Employee.updateOne(
      { employeeId: 'ADMIN001' },
      { role: 'admin' }
    );

    if (result.modifiedCount > 0) {
      console.log('✓ Admin role updated successfully!');
      const admin = await Employee.findOne({ employeeId: 'ADMIN001' });
      console.log('Updated Admin Details:');
      console.log(`  Employee ID: ${admin.employeeId}`);
      console.log(`  Name: ${admin.name}`);
      console.log(`  Role: ${admin.role}`);
    } else {
      console.log('⚠ No changes made or admin not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error fixing admin role:', error.message);
    process.exit(1);
  }
};

fixAdminRole();
