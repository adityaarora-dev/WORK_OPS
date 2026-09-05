const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch(e) {}
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function runCleanup() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');

  // Approved 6 verified real Gmail accounts:
  const approvedAccounts = [
    {
      employeeId: 'EMP007',
      firstName: 'Aditya',
      lastName: 'Arora',
      email: 'a4adityaarora@gmail.com',
      role: 'admin',
      password: 'Corp@EMP007#',
      designation: 'Chief Technology Officer & Director',
      deptCode: 'TECH',
    },
    {
      employeeId: 'EMP023',
      firstName: 'Tanishq',
      lastName: 'Goyal',
      email: 'tnu23505@gmail.com',
      role: 'hr',
      password: 'Corp@EMP023#',
      designation: 'Head of People Operations & HR Lead',
      deptCode: 'HR',
    },
    {
      employeeId: 'EMP019',
      firstName: 'Akshat',
      lastName: 'Wadagbalkar',
      email: 'akshat.wadagbalkar@gmail.com',
      role: 'manager',
      password: 'Corp@EMP019#',
      designation: 'Cloud & Infrastructure Engineering Manager',
      deptCode: 'TECH',
    },
    {
      employeeId: 'EMP018',
      firstName: 'Chiranthan',
      lastName: 'Suvidh',
      email: 'suvidh.vibrance@gmail.com',
      role: 'manager',
      password: 'Corp@EMP018#',
      designation: 'Software Development Engineering Manager',
      deptCode: 'ENG',
    },
    {
      employeeId: 'EMP021',
      firstName: 'Abhik',
      lastName: 'Sinha',
      email: 'abhiksinha06@gmail.com',
      role: 'employee',
      password: 'Corp@EMP021#',
      designation: 'Backend Software Engineer',
      deptCode: 'ENG',
    },
    {
      employeeId: 'EMP020',
      firstName: 'Uttkarsh',
      lastName: 'Kumar',
      email: 'u23022686@gmail.com',
      role: 'employee',
      password: 'Corp@EMP020#',
      designation: 'AI & Cloud Engineer',
      deptCode: 'TECH',
    },
  ];

  const approvedEmails = approvedAccounts.map(a => a.email);
  const approvedEmpIds = approvedAccounts.map(a => a.employeeId);

  // 1. Delete all users and employees who are NOT in approved list
  const unapprovedEmployees = await mongoose.connection.db.collection('employees').find({
    $or: [
      { email: { $nin: approvedEmails } },
      { employeeId: { $nin: approvedEmpIds } }
    ]
  }).toArray();

  const unapprovedEmpIds = unapprovedEmployees.map(e => e._id);
  console.log(`Purging ${unapprovedEmpIds.length} legacy/dummy employee records...`);

  if (unapprovedEmpIds.length > 0) {
    await mongoose.connection.db.collection('attendances').deleteMany({ employee: { $in: unapprovedEmpIds } });
    await mongoose.connection.db.collection('leaves').deleteMany({ employee: { $in: unapprovedEmpIds } });
    await mongoose.connection.db.collection('payrolls').deleteMany({ employee: { $in: unapprovedEmpIds } });
    await mongoose.connection.db.collection('employeegoals').deleteMany({ employee: { $in: unapprovedEmpIds } });
    await mongoose.connection.db.collection('performancereviews').deleteMany({ employee: { $in: unapprovedEmpIds } });
    await mongoose.connection.db.collection('employees').deleteMany({ _id: { $in: unapprovedEmpIds } });
  }

  await mongoose.connection.db.collection('users').deleteMany({
    $or: [
      { email: { $nin: approvedEmails } },
      { employeeId: { $nin: approvedEmpIds } }
    ]
  });

  // Ensure department links
  const techDept = await mongoose.connection.db.collection('departments').findOne({
    $or: [{ name: 'Technology & Systems' }, { departmentId: 'DEPT001' }]
  });
  const engDept = await mongoose.connection.db.collection('departments').findOne({
    $or: [{ name: 'Engineering' }, { departmentId: 'DEPT002' }]
  });
  const hrDept = await mongoose.connection.db.collection('departments').findOne({
    $or: [{ name: 'Human Resources' }, { departmentId: 'DEPT003' }]
  });

  // Update or create approved users and employees
  for (const acc of approvedAccounts) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(acc.password, salt);

    let user = await mongoose.connection.db.collection('users').findOne({ email: acc.email });
    if (!user) {
      const userRes = await mongoose.connection.db.collection('users').insertOne({
        employeeId: acc.employeeId,
        firstName: acc.firstName,
        lastName: acc.lastName,
        email: acc.email,
        password: hashedPassword,
        role: acc.role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      user = { _id: userRes.insertedId };
    } else {
      await mongoose.connection.db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: {
            employeeId: acc.employeeId,
            firstName: acc.firstName,
            lastName: acc.lastName,
            email: acc.email,
            password: hashedPassword,
            role: acc.role,
            isActive: true,
            updatedAt: new Date(),
          }
        }
      );
    }

    const deptDoc = acc.deptCode === 'HR' ? hrDept : (acc.deptCode === 'ENG' ? engDept : techDept);

    let emp = await mongoose.connection.db.collection('employees').findOne({ email: acc.email });
    if (!emp) {
      await mongoose.connection.db.collection('employees').insertOne({
        employeeId: acc.employeeId,
        firstName: acc.firstName,
        lastName: acc.lastName,
        email: acc.email,
        department: deptDoc ? deptDoc._id : techDept._id,
        designation: acc.designation,
        employmentType: 'full-time',
        employmentStatus: 'active',
        joiningDate: new Date('2023-01-01'),
        user: user._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      await mongoose.connection.db.collection('employees').updateOne(
        { _id: emp._id },
        {
          $set: {
            employeeId: acc.employeeId,
            firstName: acc.firstName,
            lastName: acc.lastName,
            email: acc.email,
            department: deptDoc ? deptDoc._id : techDept._id,
            designation: acc.designation,
            employmentStatus: 'active',
            user: user._id,
            updatedAt: new Date(),
          }
        }
      );
    }
  }

  // 2. CONFIGURE EXACT REPORTING HIERARCHY
  const adminEmp = await mongoose.connection.db.collection('employees').findOne({ employeeId: 'EMP007' });
  const hrEmp = await mongoose.connection.db.collection('employees').findOne({ employeeId: 'EMP023' });
  const akshatEmp = await mongoose.connection.db.collection('employees').findOne({ employeeId: 'EMP019' });
  const chiranthanEmp = await mongoose.connection.db.collection('employees').findOne({ employeeId: 'EMP018' });
  const abhikEmp = await mongoose.connection.db.collection('employees').findOne({ employeeId: 'EMP021' });
  const uttkarshEmp = await mongoose.connection.db.collection('employees').findOne({ employeeId: 'EMP020' });

  // Abhik reports to Chiranthan
  await mongoose.connection.db.collection('employees').updateOne(
    { _id: abhikEmp._id },
    { $set: { manager: chiranthanEmp._id } }
  );

  // Uttkarsh reports to Akshat
  await mongoose.connection.db.collection('employees').updateOne(
    { _id: uttkarshEmp._id },
    { $set: { manager: akshatEmp._id } }
  );

  // Akshat, Chiranthan, and Tanishq report to Aditya (Admin)
  await mongoose.connection.db.collection('employees').updateOne(
    { _id: akshatEmp._id },
    { $set: { manager: adminEmp._id } }
  );
  await mongoose.connection.db.collection('employees').updateOne(
    { _id: chiranthanEmp._id },
    { $set: { manager: adminEmp._id } }
  );
  await mongoose.connection.db.collection('employees').updateOne(
    { _id: hrEmp._id },
    { $set: { manager: adminEmp._id } }
  );
  await mongoose.connection.db.collection('employees').updateOne(
    { _id: adminEmp._id },
    { $set: { manager: null } }
  );

  console.log('\n--- VERIFIED USERS (EXACTLY 6) ---');
  const remainingUsers = await mongoose.connection.db.collection('users').find({}).sort({ employeeId: 1 }).toArray();
  remainingUsers.forEach(u => console.log(u.employeeId, `[${u.role.toUpperCase()}]`, u.firstName, u.lastName, u.email));

  console.log('\n--- VERIFIED EMPLOYEES WITH REPORTING MANAGERS ---');
  const remainingEmps = await mongoose.connection.db.collection('employees').find({}).sort({ employeeId: 1 }).toArray();
  for (const e of remainingEmps) {
    const mgr = e.manager ? await mongoose.connection.db.collection('employees').findOne({ _id: e.manager }) : null;
    const mgrStr = mgr ? `${mgr.firstName} ${mgr.lastName} (${mgr.employeeId})` : 'None (Top Level)';
    console.log(`${e.employeeId} ${e.firstName} ${e.lastName} -> Reports To: ${mgrStr}`);
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

if (require.main === module) {
  runCleanup().catch(console.error);
}

module.exports = { runCleanup };
