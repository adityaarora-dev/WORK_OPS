const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch(e) {}
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');

async function runCleanup() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');

  const emailsToDelete = [
    'rohan.gupta@company.com',
    'ananya.verma@company.com',
    'sneha.kulkarni@company.com',
    'hacker@hrms.local',
    'chiru.pilot21@gmail.com',
    'tanishq23@gmail.com'
  ];

  const dummyEmployees = await mongoose.connection.db.collection('employees').find({
    $or: [
      { email: { $in: emailsToDelete } },
      { email: /^test\.dev\./i },
      { email: /^alok\.mishra\./i },
      { email: /^candidate\./i },
      { employeeId: { $in: ['TEST999', 'EMP004', 'EMP005', 'EMP006', 'EMP008', 'EMP011', 'EMP012', 'EMP013', 'EMP014', 'EMP015', 'EMP016', 'EMP022', 'EMPTEST9257', 'EMPTEST3460'] } }
    ]
  }).toArray();

  const dummyEmpIds = dummyEmployees.map(e => e._id);
  console.log('Dummy employee count:', dummyEmpIds.length);

  await mongoose.connection.db.collection('attendances').deleteMany({ employee: { $in: dummyEmpIds } });
  await mongoose.connection.db.collection('leaves').deleteMany({ employee: { $in: dummyEmpIds } });
  await mongoose.connection.db.collection('payrolls').deleteMany({ employee: { $in: dummyEmpIds } });
  await mongoose.connection.db.collection('employeegoals').deleteMany({
    $or: [
      { employee: { $in: dummyEmpIds } },
      { title: /Optimize API Response Times/i }
    ]
  });
  await mongoose.connection.db.collection('performancereviews').deleteMany({ employee: { $in: dummyEmpIds } });
  await mongoose.connection.db.collection('employees').deleteMany({ _id: { $in: dummyEmpIds } });
  await mongoose.connection.db.collection('users').deleteMany({
    $or: [
      { email: { $in: emailsToDelete } },
      { email: /^test\.dev\./i },
      { email: /^alok\.mishra\./i },
      { email: /^candidate\./i },
      { employeeId: { $in: ['TEST999', 'EMP004', 'EMP005', 'EMP006', 'EMP008', 'EMP011', 'EMP012', 'EMP013', 'EMP014', 'EMP015', 'EMP016', 'EMP022', 'EMPTEST9257', 'EMPTEST3460'] } }
    ]
  });
  await mongoose.connection.db.collection('departments').deleteMany({ name: /^Test Unit/i });
  await mongoose.connection.db.collection('notifications').deleteMany({
    $or: [
      { recipient: { $in: dummyEmpIds } },
      { title: /Test/i }
    ]
  });

  const manager = await mongoose.connection.db.collection('employees').findOne({ employeeId: 'EMP003' });
  const engDept = await mongoose.connection.db.collection('departments').findOne({ departmentId: 'DEPT002' });
  const techDept = await mongoose.connection.db.collection('departments').findOne({ departmentId: 'DEPT001' });

  // Update approved employees:
  const approvedIds = ['EMP007', 'EMP017', 'EMP018', 'EMP019', 'EMP020', 'EMP021', 'EMP023'];
  for (const empId of approvedIds) {
    const emp = await mongoose.connection.db.collection('employees').findOne({ employeeId: empId });
    if (emp) {
      const deptId = (emp.designation && (emp.designation.includes('Cloud') || emp.designation.includes('Systems')))
        ? techDept._id
        : engDept._id;
      await mongoose.connection.db.collection('employees').updateOne(
        { _id: emp._id },
        { $set: { manager: manager._id, department: deptId, employmentStatus: 'active' } }
      );
    }
  }

  console.log('\n--- REMAINING USERS ---');
  const remainingUsers = await mongoose.connection.db.collection('users').find({}).sort({ employeeId: 1 }).toArray();
  remainingUsers.forEach(u => console.log(u.employeeId, u.firstName, u.lastName, u.email, u.role));

  console.log('\n--- REMAINING EMPLOYEES ---');
  const remainingEmps = await mongoose.connection.db.collection('employees').find({}).sort({ employeeId: 1 }).toArray();
  remainingEmps.forEach(e => console.log(e.employeeId, e.firstName, e.lastName, e.email, e.designation));

  await mongoose.disconnect();
  console.log('\nDone.');
}
runCleanup().catch(console.error);
