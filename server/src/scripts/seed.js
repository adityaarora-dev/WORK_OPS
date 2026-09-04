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
const { Department } = require('../models/Department');
const { Attendance } = require('../models/Attendance');
const { Leave } = require('../models/Leave');
const { Payroll } = require('../models/Payroll');
const { EmployeeDocument } = require('../models/EmployeeDocument');
const { Otp } = require('../models/Otp');

async function seedDatabase() {
  console.log('================================================================');
  console.log('🌱 HRMS MASTER PURGE & SEED — 6 REALISTIC INDIAN EMPLOYEE PROFILES');
  console.log('================================================================');

  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('❌ MONGODB_URI is not configured.');
    process.exit(1);
  }

  await mongoose.connect(mongoURI);
  console.log('✅ Connected to MongoDB Atlas.');

  // ------------------------------------------------------------------
  // 1. PURGE ALL OLD DUMMY DATA FROM THE ENTIRE DATABASE
  // ------------------------------------------------------------------
  console.log('\n🧹 Purging all legacy dummy records across all collections...');
  await Promise.all([
    User.deleteMany({}),
    Employee.deleteMany({}),
    Department.deleteMany({}),
    Attendance.deleteMany({}),
    Leave.deleteMany({}),
    Payroll.deleteMany({}),
    EmployeeDocument.deleteMany({}),
    Otp.deleteMany({}),
  ]);
  console.log('✅ Database completely wiped clean of dummy data.');

  // ------------------------------------------------------------------
  // 2. SEED REALISTIC ORGANIZATIONAL DEPARTMENTS
  // ------------------------------------------------------------------
  console.log('\n🏢 Creating core organizational departments...');
  const departmentsData = [
    {
      departmentId: 'DEPT001',
      name: 'Technology & Systems',
      code: 'TECH',
      description: 'Cloud Infrastructure, Cybersecurity & Systems Architecture',
      location: 'Bengaluru HQ, Karnataka',
      status: 'active',
    },
    {
      departmentId: 'DEPT002',
      name: 'Engineering',
      code: 'ENG',
      description: 'Core Product Engineering, Backend Services & APIs',
      location: 'Bengaluru Tech Park, Karnataka',
      status: 'active',
    },
    {
      departmentId: 'DEPT003',
      name: 'Human Resources',
      code: 'HR',
      description: 'Talent Acquisition, People Operations & Total Rewards',
      location: 'Mumbai Corporate Office, Maharashtra',
      status: 'active',
    },
    {
      departmentId: 'DEPT004',
      name: 'Product & Design',
      code: 'PROD',
      description: 'Product Lifecycle, UI/UX Research & System Experience',
      location: 'Pune Design Studio, Maharashtra',
      status: 'active',
    },
  ];

  const deptMap = {};
  for (const d of departmentsData) {
    const doc = await Department.create(d);
    deptMap[d.name] = doc;
    console.log(`  📁 Department established: ${d.name} (${d.code})`);
  }

  // ------------------------------------------------------------------
  // 3. SEED EXACTLY 6 REALISTIC INDIAN EMPLOYEES WITH DISTINCT CREDENTIALS
  // ------------------------------------------------------------------
  console.log('\n👥 Seeding 6 verified Indian employee profiles with distinct credentials...');

  const indianProfiles = [
    {
      employeeId: 'EMP001',
      firstName: 'Aarav',
      lastName: 'Sharma',
      email: 'aarav.sharma@company.com',
      phone: '+91 98765 43210',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
      designation: 'Chief Technology Officer & Director',
      deptName: 'Technology & Systems',
      joiningDate: new Date('2022-01-10'),
      address: {
        street: '14 Indiranagar 100ft Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
        country: 'India',
      },
    },
    {
      employeeId: 'EMP002',
      firstName: 'Priya',
      lastName: 'Patel',
      email: 'priya.patel@company.com',
      phone: '+91 98234 56781',
      password: process.env.HR_PASSWORD || 'HrAdmin@1810#',
      role: 'hr',
      designation: 'Head of People Operations & HR Lead',
      deptName: 'Human Resources',
      joiningDate: new Date('2022-06-15'),
      address: {
        street: '402 Bandra Kurla Complex',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400051',
        country: 'India',
      },
    },
    {
      employeeId: 'EMP003',
      firstName: 'Rajesh',
      lastName: 'Iyer',
      email: 'rajesh.iyer@company.com',
      phone: '+91 97123 45672',
      password: process.env.MANAGER_PASSWORD || 'Manager@123456',
      role: 'manager',
      designation: 'Engineering Director & Team Lead',
      deptName: 'Engineering',
      joiningDate: new Date('2023-02-01'),
      address: {
        street: '88 Whitefield Main Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560066',
        country: 'India',
      },
    },
    {
      employeeId: 'EMP004',
      firstName: 'Rohan',
      lastName: 'Gupta',
      email: 'rohan.gupta@company.com',
      phone: '+91 95456 78904',
      password: process.env.EMPLOYEE_PASSWORD || 'Employee@123456',
      role: 'employee',
      designation: 'Senior Full-Stack Engineer',
      deptName: 'Engineering',
      joiningDate: new Date('2023-08-15'),
      address: {
        street: '22 Koramangala 4th Block',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560034',
        country: 'India',
      },
    },
    {
      employeeId: 'EMP005',
      firstName: 'Ananya',
      lastName: 'Verma',
      email: 'ananya.verma@company.com',
      phone: '+91 96345 67893',
      password: 'Ananya@123456',
      role: 'employee',
      designation: 'Lead UI/UX Product Designer',
      deptName: 'Product & Design',
      joiningDate: new Date('2024-01-10'),
      address: {
        street: '15 Koregaon Park Road',
        city: 'Pune',
        state: 'Maharashtra',
        postalCode: '411001',
        country: 'India',
      },
    },
    {
      employeeId: 'EMP006',
      firstName: 'Sneha',
      lastName: 'Kulkarni',
      email: 'sneha.kulkarni@company.com',
      phone: '+91 94567 89015',
      password: 'Sneha@123456',
      role: 'employee',
      designation: 'QA Automation & Security Specialist',
      deptName: 'Engineering',
      joiningDate: new Date('2024-04-01'),
      address: {
        street: '72 HITEC City Phase 2',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500081',
        country: 'India',
      },
    },
  ];

  const userDocs = {};
  const empDocs = {};

  for (const p of indianProfiles) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(p.password, salt);

    const user = await User.create({
      employeeId: p.employeeId,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      password: hashedPassword,
      role: p.role,
      isActive: true,
    });
    userDocs[p.employeeId] = user;

    const dept = deptMap[p.deptName];

    const emp = await Employee.create({
      employeeId: p.employeeId,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      phone: p.phone,
      department: dept._id,
      designation: p.designation,
      employmentType: 'full-time',
      employmentStatus: 'active',
      joiningDate: p.joiningDate,
      user: user._id,
      address: p.address,
    });
    empDocs[p.employeeId] = emp;

    console.log(
      `  👤 [${p.role.toUpperCase()}] ${p.firstName} ${p.lastName} (${p.employeeId})` +
      ` | Email: ${p.email} | Pass: ${p.password}`
    );
  }

  // Set Manager relations (Rohan, Ananya, Sneha report to Rajesh Iyer - EMP003)
  const managerEmp = empDocs['EMP003'];
  await Employee.findByIdAndUpdate(empDocs['EMP004']._id, { manager: managerEmp._id });
  await Employee.findByIdAndUpdate(empDocs['EMP005']._id, { manager: managerEmp._id });
  await Employee.findByIdAndUpdate(empDocs['EMP006']._id, { manager: managerEmp._id });

  // Assign Department Heads
  await Department.findByIdAndUpdate(deptMap['Technology & Systems']._id, { departmentHead: empDocs['EMP001']._id });
  await Department.findByIdAndUpdate(deptMap['Engineering']._id, { departmentHead: empDocs['EMP003']._id });
  await Department.findByIdAndUpdate(deptMap['Human Resources']._id, { departmentHead: empDocs['EMP002']._id });
  await Department.findByIdAndUpdate(deptMap['Product & Design']._id, { departmentHead: empDocs['EMP005']._id });

  // ------------------------------------------------------------------
  // 4. SEED REALISTIC ATTENDANCE RECORDS (STAGE 5)
  // ------------------------------------------------------------------
  console.log('\n⏱️ Seeding realistic attendance records for today...');
  const today = new Date().toISOString().split('T')[0];

  for (const empId of ['EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005', 'EMP006']) {
    const checkInTime = new Date(`${today}T09:05:00.000Z`);
    const checkOutTime = new Date(`${today}T18:15:00.000Z`);

    await Attendance.create({
      employee: empDocs[empId]._id,
      date: new Date(`${today}T00:00:00.000Z`),
      checkIn: checkInTime,
      checkOut: checkOutTime,
      workHours: 8.5,
      status: 'present',
      remarks: 'Standard shift logged on-time',
    });
  }
  console.log('✅ Daily attendance logged for all 6 employees.');

  // ------------------------------------------------------------------
  // 5. SEED REALISTIC LEAVE REQUESTS (STAGE 6)
  // ------------------------------------------------------------------
  console.log('\n📅 Seeding realistic leave applications...');
  await Leave.create({
    employee: empDocs['EMP004']._id, // Rohan Gupta
    leaveType: 'casual',
    startDate: new Date('2026-09-10'),
    endDate: new Date('2026-09-12'),
    numberOfDays: 3,
    reason: 'Family wedding ceremony in Jaipur',
    status: 'approved',
    reviewedBy: userDocs['EMP003']._id, // Rajesh Iyer
    reviewedAt: new Date(),
    reviewComment: 'Approved. Please hand over active sprint tickets before leave.',
  });

  await Leave.create({
    employee: empDocs['EMP005']._id, // Ananya Verma
    leaveType: 'sick',
    startDate: new Date('2026-09-18'),
    endDate: new Date('2026-09-19'),
    numberOfDays: 2,
    reason: 'Medical recovery and dental procedure',
    status: 'pending',
  });
  console.log('✅ 2 verified leave applications recorded.');

  // ------------------------------------------------------------------
  // 6. SEED REALISTIC PAYROLL STATEMENTS (STAGE 7)
  // ------------------------------------------------------------------
  console.log('\n💵 Seeding digital payroll vouchers (INR)...');
  for (const empId of ['EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005', 'EMP006']) {
    const baseSalaries = {
      EMP001: 220000, // Aarav Sharma (CTO)
      EMP002: 150000, // Priya Patel (HR Head)
      EMP003: 180000, // Rajesh Iyer (Eng Director)
      EMP004: 125000, // Rohan Gupta (Sr Dev)
      EMP005: 115000, // Ananya Verma (Lead Designer)
      EMP006: 100000, // Sneha Kulkarni (QA Specialist)
    };

    const basic = baseSalaries[empId];
    const allowances = Math.round(basic * 0.2);
    const bonus = 15000;
    const gross = basic + allowances + bonus;
    const tax = Math.round(gross * 0.15);
    const deductions = 3600; // PF + Professional Tax
    const net = gross - tax - deductions;

    await Payroll.create({
      employee: empDocs[empId]._id,
      payPeriod: { month: 8, year: 2026 },
      basicSalary: basic,
      allowances,
      overtime: 0,
      bonus,
      grossSalary: gross,
      deductions,
      tax,
      netSalary: net,
      paymentStatus: 'paid',
      paymentMethod: 'direct-deposit',
      paymentDate: new Date('2026-08-31'),
    });
  }
  console.log('✅ Disbursed digital salary statements created for August 2026.');

  // ------------------------------------------------------------------
  // 7. SEED REALISTIC EMPLOYEE DOCUMENTS (STAGE 8)
  // ------------------------------------------------------------------
  console.log('\n📁 Seeding verified employee documents...');
  await EmployeeDocument.create({
    employee: empDocs['EMP004']._id, // Rohan Gupta
    documentType: 'offer-letter',
    title: 'Employment Offer Letter - Rohan Gupta',
    description: 'Signed corporate offer agreement and compensation plan',
    fileName: 'Offer_Letter_Rohan_Gupta.pdf',
    storedFileName: '1725000000000_offer_rohan.pdf',
    filePath: 'server/uploads/documents/sample_offer.pdf',
    fileSize: 245760,
    mimeType: 'application/pdf',
    uploadedBy: userDocs['EMP002']._id, // Priya Patel (HR)
    status: 'active',
  });

  await EmployeeDocument.create({
    employee: empDocs['EMP005']._id, // Ananya Verma
    documentType: 'contract',
    title: 'Design Lead Master Services Contract',
    description: 'Intellectual property assignment and NDA',
    fileName: 'Contract_Ananya_Verma.pdf',
    storedFileName: '1725000000001_contract_ananya.pdf',
    filePath: 'server/uploads/documents/sample_contract.pdf',
    fileSize: 312500,
    mimeType: 'application/pdf',
    uploadedBy: userDocs['EMP002']._id,
    status: 'active',
  });
  console.log('✅ Official documents indexed.');

  console.log('\n================================================================');
  console.log('✨ SEEDING COMPLETE: DATABASE INITIALIZED WITH 6 INDIAN EMPLOYEES');
  console.log('================================================================');
  console.log('Credentials Summary:');
  console.log('  1. Aarav Sharma   (Admin):   aarav.sharma@company.com   | Admin@123456');
  console.log('  2. Priya Patel    (HR):      priya.patel@company.com    | HrAdmin@1810#');
  console.log('  3. Rajesh Iyer    (Manager): rajesh.iyer@company.com    | Manager@123456');
  console.log('  4. Rohan Gupta    (Dev):     rohan.gupta@company.com    | Employee@123456');
  console.log('  5. Ananya Verma   (Design):  ananya.verma@company.com   | Ananya@123456');
  console.log('  6. Sneha Kulkarni (QA):      sneha.kulkarni@company.com | Sneha@123456');
  console.log('================================================================\n');

  await mongoose.disconnect();
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal seed failure:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
