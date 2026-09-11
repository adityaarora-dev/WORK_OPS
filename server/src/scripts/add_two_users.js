const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch(e) {}
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { User } = require('../models/User');
const { Employee } = require('../models/Employee');
const { Department } = require('../models/Department');

async function addUsers() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');

  // Find departments
  const hrDept = await Department.findOne({ name: 'Human Resources' });
  const techDept = await Department.findOne({ name: 'Technology & Systems' }) || await Department.findOne({ name: 'Engineering' });
  
  if (!hrDept || !techDept) {
    console.error('Departments not found!', { hrDept, techDept });
    process.exit(1);
  }

  // Find Akshat Wadagbalkar (manager)
  const akshatEmp = await Employee.findOne({ email: 'akshat.wadagbalkar@gmail.com' });
  if (!akshatEmp) {
    console.error('Akshat Wadagbalkar employee record not found!');
  } else {
    console.log(`Found manager Akshat Wadagbalkar: ID ${akshatEmp._id}, EmpID ${akshatEmp.employeeId}`);
  }

  // 1. HR: kakkar.ashu1982@gmail.com
  const hrEmail = 'kakkar.ashu1982@gmail.com';
  let hrUser = await User.findOne({ email: hrEmail });
  if (!hrUser) {
    hrUser = new User({
      employeeId: 'EMP024',
      firstName: 'Ashu',
      lastName: 'Kakkar',
      email: hrEmail,
      password: 'Corp@EMP024#',
      role: 'hr',
      isActive: true,
    });
    await hrUser.save();
    console.log('✅ Created User for Ashu Kakkar (HR)');
  } else {
    hrUser.role = 'hr';
    hrUser.password = 'Corp@EMP024#';
    hrUser.isActive = true;
    await hrUser.save();
    console.log('✅ Updated User for Ashu Kakkar (HR)');
  }

  let hrEmp = await Employee.findOne({ email: hrEmail });
  if (!hrEmp) {
    hrEmp = new Employee({
      employeeId: 'EMP024',
      firstName: 'Ashu',
      lastName: 'Kakkar',
      email: hrEmail,
      phone: '+91 98111 22233',
      department: hrDept._id,
      designation: 'Senior HR Business Partner',
      employmentType: 'full-time',
      employmentStatus: 'active',
      joiningDate: new Date('2023-01-15'),
      user: hrUser._id,
      address: {
        street: '45 Connaught Place',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110001',
        country: 'India',
      },
    });
    await hrEmp.save();
    console.log('✅ Created Employee for Ashu Kakkar (HR)');
  } else {
    hrEmp.department = hrDept._id;
    hrEmp.designation = 'Senior HR Business Partner';
    hrEmp.user = hrUser._id;
    await hrEmp.save();
    console.log('✅ Updated Employee for Ashu Kakkar (HR)');
  }

  // 2. Employee: singlaanmol101@gmail.com (reporting to Akshat Wadagbalkar)
  const empEmail = 'singlaanmol101@gmail.com';
  let empUser = await User.findOne({ email: empEmail });
  if (!empUser) {
    empUser = new User({
      employeeId: 'EMP025',
      firstName: 'Anmol',
      lastName: 'Singla',
      email: empEmail,
      password: 'Corp@EMP025#',
      role: 'employee',
      isActive: true,
    });
    await empUser.save();
    console.log('✅ Created User for Anmol Singla (Employee)');
  } else {
    empUser.role = 'employee';
    empUser.password = 'Corp@EMP025#';
    empUser.isActive = true;
    await empUser.save();
    console.log('✅ Updated User for Anmol Singla (Employee)');
  }

  let empEmp = await Employee.findOne({ email: empEmail });
  if (!empEmp) {
    empEmp = new Employee({
      employeeId: 'EMP025',
      firstName: 'Anmol',
      lastName: 'Singla',
      email: empEmail,
      phone: '+91 98444 55566',
      department: techDept._id,
      designation: 'Software Development Engineer',
      employmentType: 'full-time',
      employmentStatus: 'active',
      joiningDate: new Date('2024-02-01'),
      user: empUser._id,
      manager: akshatEmp ? akshatEmp._id : undefined,
      address: {
        street: '12 Sector 17',
        city: 'Chandigarh',
        state: 'Punjab',
        postalCode: '160017',
        country: 'India',
      },
    });
    await empEmp.save();
    console.log('✅ Created Employee for Anmol Singla (Reports to Akshat Wadagbalkar)');
  } else {
    empEmp.department = techDept._id;
    empEmp.manager = akshatEmp ? akshatEmp._id : empEmp.manager;
    empEmp.user = empUser._id;
    await empEmp.save();
    console.log('✅ Updated Employee for Anmol Singla (Reports to Akshat Wadagbalkar)');
  }

  console.log('\n--- VERIFICATION SUMMARY ---');
  console.log('1. Ashu Kakkar (HR):', { email: hrUser.email, role: hrUser.role, empId: hrUser.employeeId, pass: 'Corp@EMP024#' });
  console.log('2. Anmol Singla (Employee):', { 
    email: empUser.email, 
    role: empUser.role, 
    empId: empUser.employeeId, 
    pass: 'Corp@EMP025#',
    manager: akshatEmp ? `${akshatEmp.firstName} ${akshatEmp.lastName} (${akshatEmp.employeeId})` : 'None'
  });

  await mongoose.disconnect();
  console.log('Disconnected.');
}

addUsers().catch(err => {
  console.error('Error adding users:', err);
  process.exit(1);
});
