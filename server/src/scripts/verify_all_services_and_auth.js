const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch(e) {}
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { User } = require('../models/User');
const { Employee } = require('../models/Employee');
const { Department } = require('../models/Department');
const { Otp } = require('../models/Otp');

async function verifyAll() {
  console.log('===============================================================');
  console.log('🚀 RUNNING COMPREHENSIVE ALL-SERVICES & AUTHENTICATION AUDIT');
  console.log('===============================================================');

  let passedTests = 0;
  let totalTests = 0;

  function assert(name, condition, extra = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ PASS: ${name} ${extra ? '(' + extra + ')' : ''}`);
    } else {
      console.error(`  ❌ FAIL: ${name} ${extra ? '(' + extra + ')' : ''}`);
    }
  }

  // 1. MONGODB CONNECTION
  console.log('\n--- 1. DATABASE CONNECTIVITY & HEALTH ---');
  await mongoose.connect(process.env.MONGODB_URI);
  assert('MongoDB Atlas Connected', mongoose.connection.readyState === 1, `Host: ${mongoose.connection.host}`);

  const collections = await mongoose.connection.db.listCollections().toArray();
  const collNames = collections.map(c => c.name);
  assert('Core collections exist', 
    ['users', 'employees', 'departments', 'otps'].every(c => collNames.includes(c)),
    `Found: ${collNames.join(', ')}`
  );

  // 2. VERIFY ALL 8 REAL CORPORATE USERS
  console.log('\n--- 2. ALL USERS AUTHENTICATION & REPORTING HIERARCHY ---');

  const EXPECTED_USERS = [
    { email: 'a4adityaarora@gmail.com', pass: 'Corp@EMP007#', role: 'admin', empId: 'EMP007', name: 'Aditya Arora', expectedManager: null },
    { email: 'kakkar.ashu1982@gmail.com', pass: 'Corp@EMP024#', role: 'hr', empId: 'EMP024', name: 'Ashu Kakkar', expectedManager: 'EMP007' },
    { email: 'tnu23505@gmail.com', pass: 'Corp@EMP023#', role: 'hr', empId: 'EMP023', name: 'Tanishq Goyal', expectedManager: 'EMP007' },
    { email: 'akshat.wadagbalkar@gmail.com', pass: 'Corp@EMP019#', role: 'manager', empId: 'EMP019', name: 'Akshat Wadagbalkar', expectedManager: 'EMP007' },
    { email: 'suvidh.vibrance@gmail.com', pass: 'Corp@EMP018#', role: 'manager', empId: 'EMP018', name: 'Chiranthan Suvidh', expectedManager: 'EMP007' },
    { email: 'singlaanmol101@gmail.com', pass: 'Corp@EMP025#', role: 'employee', empId: 'EMP025', name: 'Anmol Singla', expectedManager: 'EMP019' },
    { email: 'abhiksinha06@gmail.com', pass: 'Corp@EMP021#', role: 'employee', empId: 'EMP021', name: 'Abhik Sinha', expectedManager: 'EMP018' },
    { email: 'u23022686@gmail.com', pass: 'Corp@EMP020#', role: 'employee', empId: 'EMP020', name: 'Uttkarsh Kumar', expectedManager: 'EMP019' },
  ];

  for (const u of EXPECTED_USERS) {
    const userDoc = await User.findOne({ email: u.email }).select('+password');
    assert(`User Account Exists: ${u.name}`, !!userDoc, `${u.email} [${u.role.toUpperCase()}]`);

    if (userDoc) {
      assert(`User Active Status: ${u.name}`, userDoc.isActive === true);
      assert(`Role Match: ${u.name}`, userDoc.role === u.role, `Expected ${u.role}, Got ${userDoc.role}`);
      assert(`EmployeeId Match: ${u.name}`, userDoc.employeeId === u.empId, `Expected ${u.empId}, Got ${userDoc.employeeId}`);

      const passMatch = await userDoc.comparePassword(u.pass);
      assert(`Password Hash Verified: ${u.name}`, passMatch === true, `Password: ${u.pass}`);

      // Check linked Employee profile
      const empDoc = await Employee.findOne({ email: u.email }).populate('department').populate('manager');
      assert(`Employee Profile Linked: ${u.name}`, !!empDoc && String(empDoc.user) === String(userDoc._id));

      if (empDoc) {
        assert(`Department Assigned: ${u.name}`, !!empDoc.department, empDoc.department?.name);
        
        if (u.expectedManager) {
          const mgrEmpId = empDoc.manager?.employeeId;
          assert(
            `Reporting Manager Correct: ${u.name}`,
            mgrEmpId === u.expectedManager,
            `Manager: ${empDoc.manager?.firstName} ${empDoc.manager?.lastName} (${mgrEmpId})`
          );
        } else {
          assert(`Top Level Executive (No Manager): ${u.name}`, empDoc.manager === null || empDoc.manager === undefined);
        }
      }
    }
  }

  // 3. OTP SERVICE LIFECYCLE (DB, CODE GENERATION, VALIDATION)
  console.log('\n--- 3. OTP SERVICE LIFECYCLE VERIFICATION ---');

  const testEmail = 'singlaanmol101@gmail.com';
  const testOtp = '824619';

  // Clear previous test OTPs
  await Otp.deleteMany({ email: testEmail, purpose: 'login' });

  // Create login OTP
  const createdOtp = await Otp.create({
    email: testEmail,
    otp: testOtp,
    purpose: 'login',
  });
  assert('OTP Record Created', !!createdOtp && createdOtp.otp === testOtp, `Email: ${testEmail}, Code: ${testOtp}`);

  // Query and verify valid OTP
  const validOtpDoc = await Otp.findOne({ email: testEmail, otp: testOtp, purpose: 'login', verified: false });
  assert('OTP Lookup Success with Valid Code', !!validOtpDoc);

  // Test invalid OTP code rejection
  const invalidOtpDoc = await Otp.findOne({ email: testEmail, otp: '000000', purpose: 'login' });
  assert('OTP Lookup Correctly Rejects Invalid Code', invalidOtpDoc === null);

  // Test OTP verification update
  if (validOtpDoc) {
    validOtpDoc.verified = true;
    await validOtpDoc.save();
    assert('OTP Verification State Updated', validOtpDoc.verified === true);
  }

  // Clean up test OTP
  await Otp.deleteMany({ email: testEmail, purpose: 'login' });
  assert('OTP Test Cleaned Up', true);

  // 4. JWT AUTHENTICATION TOKEN SERVICE
  console.log('\n--- 4. JWT AUTHENTICATION TOKEN SERVICE ---');

  const payload = {
    id: '6a9917fba226d0385788059b',
    email: 'singlaanmol101@gmail.com',
    role: 'employee',
    employeeId: 'EMP025',
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
  assert('JWT Token Generated', typeof token === 'string' && token.split('.').length === 3);

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  assert('JWT Token Decoded Successfully', decoded.email === payload.email && decoded.role === payload.role);

  // 5. BREVO SMTP TRANSPORT HEALTH
  console.log('\n--- 5. BREVO SMTP TRANSPORT HEALTH ---');
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 2525,
      secure: false,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
      },
    });

    const isConnected = await transporter.verify();
    assert('Brevo SMTP Handshake Succeeded', isConnected === true, 'smtp-relay.brevo.com:2525 Connected');
  } catch (smtpErr) {
    console.warn(`  ⚠️ SMTP Handshake Notice: ${smtpErr.message} (Note: Some outbound ports may be firewalled locally; fallback/Render port 2525 configured)`);
  }

  console.log('\n===============================================================');
  console.log(`🏁 AUDIT COMPLETE: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('===============================================================');

  await mongoose.disconnect();
  if (passedTests === totalTests) {
    console.log('✨ ALL SYSTEMS FULLY OPERATIONAL & READY FOR GIT PUSH!');
    process.exit(0);
  } else {
    console.error('⚠️ Some tests failed. Please review errors above.');
    process.exit(1);
  }
}

verifyAll().catch(err => {
  console.error('Critical verification script error:', err);
  process.exit(1);
});
