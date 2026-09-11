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
  console.log('🌱 HRMS MASTER PURGE & SEED — 6 VERIFIED REAL GMAIL CORPORATE ACCOUNTS');
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
  console.log('\n🧹 Purging all legacy records across all collections...');
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
  console.log('✅ Database completely wiped clean.');

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
  // 3. SEED EXACTLY 6 REAL GMAIL ACCOUNTS WITH VERIFIED PASSWORDS
  // ------------------------------------------------------------------
  console.log('\n👥 Seeding exactly 6 verified accounts with real Gmail addresses...');

  const realProfiles = [
    {
      employeeId: 'EMP007',
      firstName: 'Aditya',
      lastName: 'Arora',
      email: 'a4adityaarora@gmail.com',
      phone: '+91 98765 43210',
      password: 'Corp@EMP007#',
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
      employeeId: 'EMP023',
      firstName: 'Tanishq',
      lastName: 'Goyal',
      email: 'tnu23505@gmail.com',
      phone: '+91 98234 56781',
      password: 'Corp@EMP023#',
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
      employeeId: 'EMP019',
      firstName: 'Akshat',
      lastName: 'Wadagbalkar',
      email: 'akshat.wadagbalkar@gmail.com',
      phone: '+91 97123 45672',
      password: 'Corp@EMP019#',
      role: 'manager',
      designation: 'Cloud & Infrastructure Engineering Manager',
      deptName: 'Technology & Systems',
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
      employeeId: 'EMP018',
      firstName: 'Chiranthan',
      lastName: 'Suvidh',
      email: 'suvidh.vibrance@gmail.com',
      phone: '+91 95456 78904',
      password: 'Corp@EMP018#',
      role: 'manager',
      designation: 'Software Development Engineering Manager',
      deptName: 'Engineering',
      joiningDate: new Date('2023-03-15'),
      address: {
        street: '22 Koramangala 4th Block',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560034',
        country: 'India',
      },
    },
    {
      employeeId: 'EMP021',
      firstName: 'Abhik',
      lastName: 'Sinha',
      email: 'abhiksinha06@gmail.com',
      phone: '+91 96345 67893',
      password: 'Corp@EMP021#',
      role: 'employee',
      designation: 'Backend Software Engineer',
      deptName: 'Engineering',
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
      employeeId: 'EMP020',
      firstName: 'Uttkarsh',
      lastName: 'Kumar',
      email: 'u23022686@gmail.com',
      phone: '+91 94567 89015',
      password: 'Corp@EMP020#',
      role: 'employee',
      designation: 'AI & Cloud Engineer',
      deptName: 'Technology & Systems',
      joiningDate: new Date('2024-04-01'),
      address: {
        street: '72 HITEC City Phase 2',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500081',
        country: 'India',
      },
    },
    {
      employeeId: 'EMP024',
      firstName: 'Ashu',
      lastName: 'Kakkar',
      email: 'kakkar.ashu1982@gmail.com',
      phone: '+91 98111 22233',
      password: 'Corp@EMP024#',
      role: 'hr',
      designation: 'Senior HR Business Partner',
      deptName: 'Human Resources',
      joiningDate: new Date('2023-01-15'),
      address: {
        street: '45 Connaught Place',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110001',
        country: 'India',
      },
    },
    {
      employeeId: 'EMP025',
      firstName: 'Anmol',
      lastName: 'Singla',
      email: 'singlaanmol101@gmail.com',
      phone: '+91 98444 55566',
      password: 'Corp@EMP025#',
      role: 'employee',
      designation: 'Software Development Engineer',
      deptName: 'Technology & Systems',
      joiningDate: new Date('2024-02-01'),
      address: {
        street: '12 Sector 17',
        city: 'Chandigarh',
        state: 'Punjab',
        postalCode: '160017',
        country: 'India',
      },
    },
  ];

  const userDocs = {};
  const empDocs = {};

  for (const p of realProfiles) {
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

  // ------------------------------------------------------------------
  // 4. ESTABLISH EXACT REPORTING HIERARCHY
  // ------------------------------------------------------------------
  // Required:
  // - Abhik Sinha (EMP021) reports to Chiranthan Suvidh (EMP018)
  // - Uttkarsh Kumar (EMP020) reports to Akshat Wadagbalkar (EMP019)
  // - Managers and HR report to Admin Aditya Arora (EMP007)
  console.log('\n🔗 Configuring strict employee reporting hierarchy...');
  await Employee.findByIdAndUpdate(empDocs['EMP021']._id, { manager: empDocs['EMP018']._id });
  await Employee.findByIdAndUpdate(empDocs['EMP020']._id, { manager: empDocs['EMP019']._id });
  await Employee.findByIdAndUpdate(empDocs['EMP025']._id, { manager: empDocs['EMP019']._id });
  await Employee.findByIdAndUpdate(empDocs['EMP018']._id, { manager: empDocs['EMP007']._id });
  await Employee.findByIdAndUpdate(empDocs['EMP019']._id, { manager: empDocs['EMP007']._id });
  await Employee.findByIdAndUpdate(empDocs['EMP023']._id, { manager: empDocs['EMP007']._id });
  await Employee.findByIdAndUpdate(empDocs['EMP024']._id, { manager: empDocs['EMP007']._id });

  console.log('  ✅ Abhik Sinha (EMP021) -> Reports to Chiranthan Suvidh (EMP018)');
  console.log('  ✅ Uttkarsh Kumar (EMP020) & Anmol Singla (EMP025) -> Report to Akshat Wadagbalkar (EMP019)');
  console.log('  ✅ Managers & HR (Tanishq Goyal, Ashu Kakkar) -> Report to Aditya Arora (EMP007)');

  // Assign Department Heads
  await Department.findByIdAndUpdate(deptMap['Technology & Systems']._id, { departmentHead: empDocs['EMP007']._id });
  await Department.findByIdAndUpdate(deptMap['Engineering']._id, { departmentHead: empDocs['EMP018']._id });
  await Department.findByIdAndUpdate(deptMap['Human Resources']._id, { departmentHead: empDocs['EMP023']._id });
  await Department.findByIdAndUpdate(deptMap['Product & Design']._id, { departmentHead: empDocs['EMP019']._id });

  // ------------------------------------------------------------------
  // 5. SEED REALISTIC ATTENDANCE RECORDS
  // ------------------------------------------------------------------
  console.log('\n⏱️ Seeding realistic attendance records for today...');
  const today = new Date().toISOString().split('T')[0];

  for (const empId of ['EMP007', 'EMP023', 'EMP019', 'EMP018', 'EMP021', 'EMP020']) {
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
  console.log('✅ Daily attendance logged for all 6 verified users.');

  // ------------------------------------------------------------------
  // 6. SEED REALISTIC LEAVE REQUESTS WITH CORRECT REPORTING CHAINS
  // ------------------------------------------------------------------
  console.log('\n📅 Seeding realistic leave applications matching reporting structure...');
  // Uttkarsh Kumar (EMP020) leave reviewed by his manager Akshat Wadagbalkar (EMP019)
  await Leave.create({
    employee: empDocs['EMP020']._id,
    leaveType: 'casual',
    startDate: new Date('2026-09-10'),
    endDate: new Date('2026-09-12'),
    numberOfDays: 3,
    reason: 'Family wedding ceremony',
    status: 'approved',
    reviewedBy: userDocs['EMP019']._id,
    reviewedAt: new Date(),
    reviewComment: 'Approved. Please coordinate active deliverables with team before leave.',
  });

  // Abhik Sinha (EMP021) leave pending review by his manager Chiranthan Suvidh (EMP018)
  await Leave.create({
    employee: empDocs['EMP021']._id,
    leaveType: 'sick',
    startDate: new Date('2026-09-18'),
    endDate: new Date('2026-09-19'),
    numberOfDays: 2,
    reason: 'Medical recovery and dental procedure',
    status: 'pending',
  });
  console.log('✅ Leave applications recorded with exact manager reporting chains.');

  // ------------------------------------------------------------------
  // 7. SEED REALISTIC PAYROLL STATEMENTS
  // ------------------------------------------------------------------
  console.log('\n💵 Seeding digital payroll vouchers (INR)...');
  const baseSalaries = {
    EMP007: 240000, // Aditya Arora (Admin)
    EMP023: 160000, // Tanishq Goyal (HR)
    EMP019: 190000, // Akshat Wadagbalkar (Manager)
    EMP018: 185000, // Chiranthan Suvidh (Manager)
    EMP021: 130000, // Abhik Sinha (Employee)
    EMP020: 125000, // Uttkarsh Kumar (Employee)
  };

  for (const empId of ['EMP007', 'EMP023', 'EMP019', 'EMP018', 'EMP021', 'EMP020']) {
    const basic = baseSalaries[empId];
    const allowances = Math.round(basic * 0.2);
    const bonus = 15000;
    const gross = basic + allowances + bonus;
    const tax = Math.round(gross * 0.15);
    const deductions = 3600;
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
  console.log('✅ Disbursed digital salary statements created.');

  // ------------------------------------------------------------------
  // 8. SEED VERIFIED EMPLOYEE DOCUMENTS
  // ------------------------------------------------------------------
  console.log('\n📁 Seeding verified employee documents...');
  await EmployeeDocument.create({
    employee: empDocs['EMP021']._id,
    documentType: 'offer-letter',
    title: 'Employment Offer Letter - Abhik Sinha',
    description: 'Signed corporate offer agreement and compensation plan',
    fileName: 'Offer_Letter_Abhik_Sinha.pdf',
    storedFileName: '1725000000000_offer_abhik.pdf',
    filePath: 'server/uploads/documents/sample_offer.pdf',
    fileSize: 245760,
    mimeType: 'application/pdf',
    uploadedBy: userDocs['EMP023']._id, // Tanishq Goyal (HR)
    status: 'active',
  });

  await EmployeeDocument.create({
    employee: empDocs['EMP020']._id,
    documentType: 'contract',
    title: 'AI Engineer Services Contract - Uttkarsh Kumar',
    description: 'Intellectual property assignment and NDA',
    fileName: 'Contract_Uttkarsh_Kumar.pdf',
    storedFileName: '1725000000001_contract_uttkarsh.pdf',
    filePath: 'server/uploads/documents/sample_contract.pdf',
    fileSize: 312500,
    mimeType: 'application/pdf',
    uploadedBy: userDocs['EMP023']._id, // Tanishq Goyal (HR)
    status: 'active',
  });
  console.log('✅ Official documents indexed.');

  console.log('\n================================================================');
  console.log('✨ SEEDING COMPLETE: DATABASE INITIALIZED WITH 6 REAL GMAIL ACCOUNTS');
  console.log('================================================================');
  console.log('Credentials Summary:');
  console.log('  1. ADMIN:    Aditya Arora        | a4adityaarora@gmail.com      | Corp@EMP007#');
  console.log('  2. HR:       Tanishq Goyal       | tnu23505@gmail.com           | Corp@EMP023#');
  console.log('  3. MANAGER:  Akshat Wadagbalkar  | akshat.wadagbalkar@gmail.com | Corp@EMP019#');
  console.log('  4. MANAGER:  Chiranthan Suvidh   | suvidh.vibrance@gmail.com    | Corp@EMP018#');
  console.log('  5. EMPLOYEE: Abhik Sinha         | abhiksinha06@gmail.com       | Corp@EMP021# (Reports to Chiranthan)');
  console.log('  6. EMPLOYEE: Uttkarsh Kumar      | u23022686@gmail.com          | Corp@EMP020# (Reports to Akshat)');
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
