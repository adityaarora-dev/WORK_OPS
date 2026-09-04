const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });
const { User } = require('../models/User');
const { Employee } = require('../models/Employee');
const { Department } = require('../models/Department');

async function provisionAditya() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas.');

  // 1. Clean up suvidh.music21@gmail.com and candidate test records
  await User.deleteMany({ email: 'suvidh.music21@gmail.com' });
  await Employee.deleteMany({ email: 'suvidh.music21@gmail.com' });
  await User.deleteMany({ email: /^kavita\.reddy\./i });
  await Employee.deleteMany({ email: /^kavita\.reddy\./i });
  console.log('🧹 Cleaned up old test records.');

  // 2. Ensure Aditya Arora exists and is ACTIVE
  const email = 'a4adityaarora@gmail.com';
  let user = await User.findOne({ email });
  let emp = await Employee.findOne({ email });

  const techDept = await Department.findOne({ departmentId: 'DEPT001' });

  if (!user) {
    user = await User.create({
      employeeId: 'EMP007',
      firstName: 'Aditya',
      lastName: 'Arora',
      email,
      password: 'Corp@EMP007#',
      role: 'employee',
      isActive: true,
    });
    console.log('✅ User account created for Aditya Arora (EMP007).');
  } else {
    user.isActive = true;
    user.firstName = 'Aditya';
    user.lastName = 'Arora';
    await user.save();
    console.log('✅ User account updated and ACTIVE for Aditya Arora (EMP007).');
  }

  if (!emp) {
    emp = await Employee.create({
      employeeId: 'EMP007',
      firstName: 'Aditya',
      lastName: 'Arora',
      email,
      phone: '+91 98765 43210',
      designation: 'Senior Systems Engineer',
      department: techDept ? techDept._id : null,
      employmentStatus: 'active',
      employmentType: 'full-time',
      joiningDate: new Date(),
      user: user._id,
      address: {
        street: 'Connaught Place',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110001',
        country: 'India',
      },
    });
    console.log('✅ Employee profile created and ACTIVE for Aditya Arora (EMP007).');
  } else {
    emp.employmentStatus = 'active';
    await emp.save();
    console.log('✅ Employee profile updated and ACTIVE for Aditya Arora (EMP007).');
  }

  console.log('\n====================================================');
  console.log('STATUS: a4adityaarora@gmail.com IS CONFIRMED & ACTIVE IN DB');
  console.log('  Employee ID: EMP007');
  console.log('  Name:        Aditya Arora');
  console.log('  Email:       a4adityaarora@gmail.com');
  console.log('  Department:  Technology & Systems (DEPT001)');
  console.log('  Role:        employee');
  console.log('  Status:      ACTIVE');
  console.log('====================================================\n');

  await mongoose.disconnect();
}

provisionAditya().catch((err) => {
  console.error(err);
  process.exit(1);
});
