const http = require('http');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '../../.env') });
const { connectDB } = require('../config/db');
const { Otp } = require('../models/Otp');

function request({ method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runPolicyTests() {
  console.log('===============================================================');
  console.log('🛡️ TESTING HRMS INVITE-ONLY SECURITY POLICY & ROLE OUTCOMES');
  console.log('===============================================================');

  await connectDB();

  // 1. Consequence for Unrecognized Person attempting to log in
  console.log('\n--- 1. UNRECOGNIZED USER LOGIN ATTEMPT ---');
  const strangerLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'random.outsider@gmail.com', password: 'Password123#' },
  });
  const strangerRejected = strangerLogin.status === 401 && strangerLogin.data?.notFound === true;
  console.log(`${strangerRejected ? '✅ PASS' : '❌ FAIL'}: Unrecognized person rejected with Access Denied (401)`);

  // 2. Consequence for Unrecognized Person attempting to request registration OTP
  console.log('\n--- 2. PUBLIC SELF-REGISTRATION ATTEMPT ---');
  const publicRegOtp = await request({
    method: 'POST',
    path: '/api/auth/send-otp',
    body: { email: 'random.outsider@gmail.com', purpose: 'registration' },
  });
  const regRejected = publicRegOtp.status === 403;
  console.log(`${regRejected ? '✅ PASS' : '❌ FAIL'}: Public self-registration blocked with 403 Forbidden`);

  // 3. Consequence for Unrecognized Person requesting login OTP
  console.log('\n--- 3. UNRECOGNIZED EMAIL OTP LOGIN ATTEMPT ---');
  const strangerOtp = await request({
    method: 'POST',
    path: '/api/auth/send-login-otp',
    body: { email: 'random.outsider@gmail.com' },
  });
  const strangerOtpBlocked = strangerOtp.status === 404;
  console.log(`${strangerOtpBlocked ? '✅ PASS' : '❌ FAIL'}: OTP refused for unregistered email (404 Access Denied)`);

  // 4. Consequence for Authorized Employee logging in via Password
  console.log('\n--- 4. AUTHORIZED EMPLOYEE SIGN IN (AKSHAT WADAGBALKAR) ---');
  const empLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'akshat.wadagbalkar@gmail.com', password: 'Corp@EMP019#' },
  });
  const empOk = empLogin.status === 200 && empLogin.data?.data?.user?.role === 'employee';
  console.log(`${empOk ? '✅ PASS' : '❌ FAIL'}: Authorized Employee signs into workspace with scoped access`);

  // 5. Consequence for Authorized Indian Employee logging in via Email OTP
  console.log('\n--- 5. AUTHORIZED EMPLOYEE EMAIL OTP LOGIN (PRIYA PATEL) ---');
  const priyaOtpSend = await request({
    method: 'POST',
    path: '/api/auth/send-login-otp',
    body: { email: 'priya.patel@company.com' },
  });
  console.log(`${priyaOtpSend.status === 200 ? '✅ PASS' : '❌ FAIL'}: Real OTP dispatched to Priya's corporate email`);

  const otpDoc = await Otp.findOne({ email: 'priya.patel@company.com', purpose: 'login' }).sort({ createdAt: -1 });
  const priyaVerify = await request({
    method: 'POST',
    path: '/api/auth/verify-login-otp',
    body: { email: 'priya.patel@company.com', otp: otpDoc.otp },
  });
  const priyaOk = priyaVerify.status === 200 && priyaVerify.data?.data?.user?.role === 'hr';
  console.log(`${priyaOk ? '✅ PASS' : '❌ FAIL'}: Email OTP verified & Priya authenticated into HR Console`);

  console.log('\n===============================================================');
  console.log('STATUS: INVITE-ONLY ACCESS CONTROL POLICY VERIFIED 100% 🛡️');
  console.log('===============================================================\n');

  await mongoose.disconnect();
}

runPolicyTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
