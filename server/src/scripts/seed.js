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

const isBcryptHash = (str) => /^\$2[aby]\$\d{2}\$[./0-9A-Za-z]{53}$/.test(str || '');

async function seedDatabase() {
  console.log('====================================================');
  console.log('🌱 HR MANAGEMENT SYSTEM — DATABASE SEED & VERIFY');
  console.log('====================================================');

  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('❌ MONGODB_URI is not set in environment.');
    process.exit(1);
  }

  await mongoose.connect(mongoURI);
  console.log('✅ Connected to MongoDB Atlas.');

  // ---------------------------------------------------------------
  // 1. INSPECT AND PRESERVE EXISTING HR USER
  // ---------------------------------------------------------------
  console.log('\n🔍 Inspecting existing users in MongoDB Atlas...');
  const existingUsers = await User.find({}).select('+password');
  console.log(`Found ${existingUsers.length} total user document(s) in database.`);

  let hrUser = await User.findOne({
    $or: [{ role: 'hr' }, { email: /hr/i }, { employeeId: /hr/i }],
  }).select('+password');

  if (hrUser) {
    console.log(`\n📌 Existing HR user detected:`);
    console.log(`   - ID: ${hrUser._id}`);
    console.log(`   - Employee ID: ${hrUser.employeeId}`);
    console.log(`   - Email: ${hrUser.email}`);
    console.log(`   - Role: ${hrUser.role}`);
    console.log(`   - Active: ${hrUser.isActive}`);

    const hasValidHash = isBcryptHash(hrUser.password);
    console.log(`   - Password Hash Valid: ${hasValidHash}`);

    if (!hasValidHash) {
      console.log('⚠️  Existing HR user password is not a valid bcrypt hash.');
      console.log('🔒 Migrating password to secure bcrypt hash...');
      const fallbackPassword = process.env.HR_PASSWORD || 'HrAdmin@1810#';
      const salt = await bcrypt.genSalt(10);
      hrUser.password = await bcrypt.hash(fallbackPassword, salt);
      hrUser.isActive = true;
      if (!hrUser.role) hrUser.role = 'hr';
      await hrUser.save();
      console.log('✅ Existing HR user password migrated safely without losing user info.');
    } else {
      console.log('✅ Existing HR user is fully intact with valid bcrypt hash.');
    }
  } else {
    console.log('\n➕ No existing HR user document found. Creating initial HR user...');
    const hrPassword = process.env.HR_PASSWORD || 'HrAdmin@1810#';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(hrPassword, salt);

    hrUser = await User.create({
      employeeId: 'HR001',
      firstName: 'HR',
      lastName: 'Manager',
      email: 'hr@hrms.local',
      password: hashedPassword,
      role: 'hr',
      isActive: true,
    });
    console.log(`✅ Initial HR user created: ${hrUser.email} (Role: ${hrUser.role})`);
  }

  // ---------------------------------------------------------------
  // 2. INSPECT AND ENSURE INITIAL ADMIN
  // ---------------------------------------------------------------
  let adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    console.log('\n➕ No Admin user found. Creating initial Admin user...');
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    adminUser = await User.create({
      employeeId: 'ADM001',
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@hrms.local',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    });
    console.log(`✅ Initial Admin user created: ${adminUser.email} (Role: ${adminUser.role})`);
  } else {
    console.log(`\n✅ Admin user already exists: ${adminUser.email} (Role: ${adminUser.role})`);
  }

  // ---------------------------------------------------------------
  // 3. SEED DEMO MANAGER AND EMPLOYEE (FOR ROLE VERIFICATION)
  // ---------------------------------------------------------------
  let managerUser = await User.findOne({ role: 'manager' });
  if (!managerUser) {
    console.log('\n➕ Creating demo Manager user for authorization testing...');
    const mgrPassword = process.env.MANAGER_PASSWORD || 'Manager@123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(mgrPassword, salt);

    managerUser = await User.create({
      employeeId: 'MGR001',
      firstName: 'Department',
      lastName: 'Manager',
      email: 'manager@hrms.local',
      password: hashedPassword,
      role: 'manager',
      isActive: true,
    });
    console.log(`✅ Demo Manager created: ${managerUser.email} (Role: ${managerUser.role})`);
  }

  let employeeUser = await User.findOne({ role: 'employee' });
  if (!employeeUser) {
    console.log('\n➕ Creating demo Employee user for authorization testing...');
    const empPassword = process.env.EMPLOYEE_PASSWORD || 'Employee@123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(empPassword, salt);

    employeeUser = await User.create({
      employeeId: 'EMP001',
      firstName: 'Jane',
      lastName: 'Employee',
      email: 'employee@hrms.local',
      password: hashedPassword,
      role: 'employee',
      isActive: true,
    });
    console.log(`✅ Demo Employee created: ${employeeUser.email} (Role: ${employeeUser.role})`);
  }

  console.log('\n====================================================');
  console.log('📊 DATABASE VERIFICATION SUMMARY');
  console.log('====================================================');
  const allUsers = await User.find({}).sort({ role: 1 });
  for (const u of allUsers) {
    console.log(`- [${u.role.toUpperCase()}] ${u.firstName} ${u.lastName} | Email: ${u.email} | ID: ${u.employeeId} | Active: ${u.isActive}`);
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
