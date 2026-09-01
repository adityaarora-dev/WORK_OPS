const dotenv = require('dotenv');
const dns = require('dns');
const path = require('path');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../models/User');
const { Employee } = require('../models/Employee');

const isBcryptHash = (str) => /^\$2[aby]\$\d{2}\$[./0-9A-Za-z]{53}$/.test(str || '');

async function seedDatabase() {
  console.log('====================================================');
  console.log('🌱 HR MANAGEMENT SYSTEM — SEED & VERIFY (STAGE 3)');
  console.log('====================================================');

  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('❌ MONGODB_URI is not set in environment.');
    process.exit(1);
  }

  await mongoose.connect(mongoURI);
  console.log('✅ Connected to MongoDB Atlas.');

  // ---------------------------------------------------------------
  // 1. INSPECT AND PRESERVE EXISTING USERS
  // ---------------------------------------------------------------
  console.log('\n🔍 Inspecting existing users in MongoDB Atlas...');
  let hrUser = await User.findOne({
    $or: [{ role: 'hr' }, { email: /hr/i }, { employeeId: /hr/i }],
  }).select('+password');

  if (hrUser) {
    console.log(`📌 Existing HR user detected: ${hrUser.email} (ID: ${hrUser.employeeId})`);
    if (!isBcryptHash(hrUser.password)) {
      const fallbackPassword = process.env.HR_PASSWORD || 'HrAdmin@1810#';
      const salt = await bcrypt.genSalt(10);
      hrUser.password = await bcrypt.hash(fallbackPassword, salt);
      hrUser.isActive = true;
      if (!hrUser.role) hrUser.role = 'hr';
      await hrUser.save();
    }
  } else {
    const hrPassword = process.env.HR_PASSWORD || 'HrAdmin@1810#';
    const salt = await bcrypt.genSalt(10);
    hrUser = await User.create({
      employeeId: 'HR001',
      firstName: 'HR',
      lastName: 'Manager',
      email: 'hr@hrms.local',
      password: await bcrypt.hash(hrPassword, salt),
      role: 'hr',
      isActive: true,
    });
  }

  let adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const salt = await bcrypt.genSalt(10);
    adminUser = await User.create({
      employeeId: 'ADM001',
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@hrms.local',
      password: await bcrypt.hash(adminPassword, salt),
      role: 'admin',
      isActive: true,
    });
  }

  let managerUser = await User.findOne({ role: 'manager' });
  if (!managerUser) {
    const mgrPassword = process.env.MANAGER_PASSWORD || 'Manager@123456';
    const salt = await bcrypt.genSalt(10);
    managerUser = await User.create({
      employeeId: 'MGR001',
      firstName: 'Department',
      lastName: 'Manager',
      email: 'manager@hrms.local',
      password: await bcrypt.hash(mgrPassword, salt),
      role: 'manager',
      isActive: true,
    });
  }

  let employeeUser = await User.findOne({ role: 'employee' });
  if (!employeeUser) {
    const empPassword = process.env.EMPLOYEE_PASSWORD || 'Employee@123456';
    const salt = await bcrypt.genSalt(10);
    employeeUser = await User.create({
      employeeId: 'EMP001',
      firstName: 'Jane',
      lastName: 'Employee',
      email: 'employee@hrms.local',
      password: await bcrypt.hash(empPassword, salt),
      role: 'employee',
      isActive: true,
    });
  }

  // ---------------------------------------------------------------
  // 2. SEED / SYNC EMPLOYEE PROFILES
  // ---------------------------------------------------------------
  console.log('\n👥 Synchronizing Employee Profiles...');

  // 1. Manager Employee Record
  let mgrEmp = await Employee.findOne({ employeeId: 'MGR001' });
  if (!mgrEmp) {
    mgrEmp = await Employee.create({
      employeeId: 'MGR001',
      firstName: 'Department',
      lastName: 'Manager',
      email: 'manager@hrms.local',
      phone: '+1 (555) 234-5678',
      department: 'Engineering',
      designation: 'Engineering Lead',
      employmentType: 'full-time',
      employmentStatus: 'active',
      joiningDate: new Date('2023-01-15'),
      user: managerUser._id,
      address: { city: 'San Francisco', state: 'CA', country: 'United States' },
    });
    console.log('✅ Created Manager employee record: MGR001');
  }

  // 2. Admin Employee Record
  let admEmp = await Employee.findOne({ employeeId: 'ADM001' });
  if (!admEmp) {
    admEmp = await Employee.create({
      employeeId: 'ADM001',
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@hrms.local',
      phone: '+1 (555) 123-4567',
      department: 'Executive',
      designation: 'VP of Technology',
      employmentType: 'full-time',
      employmentStatus: 'active',
      joiningDate: new Date('2022-03-01'),
      user: adminUser._id,
      address: { city: 'New York', state: 'NY', country: 'United States' },
    });
    console.log('✅ Created Admin employee record: ADM001');
  }

  // 3. HR Employee Record
  let hrEmp = await Employee.findOne({ employeeId: 'HR001' });
  if (!hrEmp) {
    hrEmp = await Employee.create({
      employeeId: 'HR001',
      firstName: 'HR',
      lastName: 'Manager',
      email: 'hr@hrms.local',
      phone: '+1 (555) 345-6789',
      department: 'Human Resources',
      designation: 'People Operations Manager',
      employmentType: 'full-time',
      employmentStatus: 'active',
      joiningDate: new Date('2023-06-01'),
      user: hrUser._id,
      address: { city: 'Chicago', state: 'IL', country: 'United States' },
    });
    console.log('✅ Created HR employee record: HR001');
  }

  // 4. Employee 001 (Reporting to Manager)
  let emp1 = await Employee.findOne({ employeeId: 'EMP001' });
  if (!emp1) {
    emp1 = await Employee.create({
      employeeId: 'EMP001',
      firstName: 'Jane',
      lastName: 'Employee',
      email: 'employee@hrms.local',
      phone: '+1 (555) 456-7890',
      department: 'Engineering',
      designation: 'Senior Frontend Developer',
      employmentType: 'full-time',
      employmentStatus: 'active',
      joiningDate: new Date('2024-02-10'),
      manager: mgrEmp._id,
      user: employeeUser._id,
      address: { city: 'Austin', state: 'TX', country: 'United States' },
      emergencyContact: {
        name: 'Mark Employee',
        phone: '+1 (555) 999-8877',
        relationship: 'Spouse',
      },
    });
    console.log('✅ Created Employee record: EMP001 (Reporting to MGR001)');
  }

  // 5. Additional Sample Employees for rich filtering/search
  const sampleEmployees = [
    {
      employeeId: 'EMP002',
      firstName: 'Marcus',
      lastName: 'Vance',
      email: 'marcus.vance@hrms.local',
      phone: '+1 (555) 567-8901',
      department: 'Product',
      designation: 'Senior Product Manager',
      employmentType: 'full-time',
      employmentStatus: 'active',
      joiningDate: new Date('2023-09-01'),
      address: { city: 'Seattle', state: 'WA', country: 'United States' },
    },
    {
      employeeId: 'EMP003',
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'sarah.connor@hrms.local',
      phone: '+1 (555) 678-9012',
      department: 'Finance',
      designation: 'Financial Analyst',
      employmentType: 'full-time',
      employmentStatus: 'on-leave',
      joiningDate: new Date('2024-01-20'),
      address: { city: 'Boston', state: 'MA', country: 'United States' },
    },
    {
      employeeId: 'EMP004',
      firstName: 'David',
      lastName: 'Miller',
      email: 'david.miller@hrms.local',
      phone: '+1 (555) 789-0123',
      department: 'Marketing',
      designation: 'Growth Marketing Specialist',
      employmentType: 'contract',
      employmentStatus: 'active',
      joiningDate: new Date('2024-04-15'),
      address: { city: 'Denver', state: 'CO', country: 'United States' },
    },
    {
      employeeId: 'EMP005',
      firstName: 'Elena',
      lastName: 'Rostova',
      email: 'elena.rostova@hrms.local',
      phone: '+1 (555) 890-1234',
      department: 'Engineering',
      designation: 'DevOps Engineer',
      employmentType: 'full-time',
      employmentStatus: 'active',
      joiningDate: new Date('2024-05-01'),
      manager: mgrEmp._id,
      address: { city: 'San Francisco', state: 'CA', country: 'United States' },
    },
  ];

  for (const empData of sampleEmployees) {
    const exists = await Employee.findOne({ employeeId: empData.employeeId });
    if (!exists) {
      await Employee.create(empData);
      console.log(`✅ Seeded sample employee: ${empData.employeeId} - ${empData.firstName} ${empData.lastName}`);
    }
  }

  console.log('\n====================================================');
  console.log('📊 DATABASE VERIFICATION SUMMARY');
  console.log('====================================================');
  const allUsers = await User.find({}).sort({ role: 1 });
  console.log(`Total Users: ${allUsers.length}`);
  const allEmployees = await Employee.find({}).sort({ employeeId: 1 });
  console.log(`Total Employees: ${allEmployees.length}`);
  for (const e of allEmployees) {
    console.log(`- [${e.employeeId}] ${e.firstName} ${e.lastName} | Dept: ${e.department} | Status: ${e.employmentStatus} | Email: ${e.email}`);
  }
  console.log('====================================================\n');

  await mongoose.connection.close();
  console.log('🔌 Database connection closed cleanly.');
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('❌ Error during database seeding:', err);
  process.exit(1);
});
