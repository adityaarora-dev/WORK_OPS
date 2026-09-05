const path = require('path');
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch(e) {}
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../../server/.env') });

const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const app = require('../../app');
const http = require('http');
const { User } = require('../models/User');
const { Otp } = require('../models/Otp');

let server;
let BASE_URL;

async function setup() {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
    family: 4,
  });

  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      BASE_URL = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
}

async function teardown() {
  if (server) {
    await new Promise((r) => server.close(r));
  }
  await mongoose.disconnect();
}

async function request(method, path, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runTests() {
  console.log('===============================================================');
  console.log('🔒 RUNNING OTP-BASED FORGOT PASSWORD & RESET VERIFICATION SUITE');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    await setup();

    const testEmail = 'akshat.wadagbalkar@gmail.com';
    const originalPassword = 'Corp@EMP019#';
    const newPassword = 'NewSecret@2026#';

    // 1. Unregistered Email Does Not Leak Existence
    console.log('\n--- 1. EMAIL ENUMERATION PREVENTION ---');
    const unknownRes = await request('POST', '/api/auth/forgot-password', {
      email: 'nonexistent.user999@gmail.com',
    });
    assert(unknownRes.status === 200, 'Unregistered email returns HTTP 200 OK');
    assert(
      unknownRes.data.message && unknownRes.data.message.includes('If an account with that email exists'),
      'Returns generic security message without revealing if email exists'
    );

    // 2. Missing Email Validation
    console.log('\n--- 2. INPUT VALIDATION ---');
    const emptyEmailRes = await request('POST', '/api/auth/forgot-password', { email: '' });
    assert(emptyEmailRes.status === 400, 'Empty email rejected with HTTP 400');

    // 3. Valid User Requests Password Reset OTP
    console.log('\n--- 3. 6-DIGIT OTP GENERATION & SECURE HASHED PERSISTENCE ---');
    const validReq = await request('POST', '/api/auth/forgot-password', { email: testEmail });
    assert(validReq.status === 200, 'Valid user forgot-password returns HTTP 200 OK');

    // Inspect Otp collection to verify OTP was hashed with SHA-256 and NOT stored plain text
    const otpDoc = await Otp.findOne({ email: testEmail, purpose: 'password_reset' });
    assert(!!otpDoc, 'Active password_reset Otp document created in database');
    assert(otpDoc.otp.length === 64, 'OTP is stored as a 64-char SHA-256 hex hash (never plain text)');
    assert(otpDoc.attempts === 0, 'Failed attempts counter initialized to 0');

    // 4. OTP Verification - Failed Attempts & Rate Limiting
    console.log('\n--- 4. OTP VERIFICATION - INVALID CODES & ATTEMPTS LIMIT ---');
    // Prepare known test OTP
    const knownOtp = '654321';
    const hashedKnownOtp = crypto.createHash('sha256').update(knownOtp).digest('hex');
    otpDoc.otp = hashedKnownOtp;
    otpDoc.attempts = 0;
    await otpDoc.save();

    // Invalid length OTP
    const invalidLenRes = await request('POST', '/api/auth/verify-otp', {
      email: testEmail,
      otp: '123',
    });
    assert(invalidLenRes.status === 400, 'Non-6-digit OTP rejected with HTTP 400');

    // Incorrect OTP increments attempt count
    const wrongOtpRes = await request('POST', '/api/auth/verify-otp', {
      email: testEmail,
      otp: '999999',
    });
    assert(wrongOtpRes.status === 400, 'Incorrect OTP code rejected with HTTP 400');
    assert(wrongOtpRes.data.message.includes('remaining'), 'Remaining attempts reported in response');

    // Exceed maximum attempts (set attempts to 5)
    otpDoc.attempts = 5;
    await otpDoc.save();

    const maxAttemptsRes = await request('POST', '/api/auth/verify-otp', {
      email: testEmail,
      otp: knownOtp,
    });
    assert(maxAttemptsRes.status === 429, 'Exceeded attempts rejected with HTTP 429');

    // Verify exhausted OTP was deleted
    const exhaustedDoc = await Otp.findOne({ email: testEmail, purpose: 'password_reset' });
    assert(!exhaustedDoc, 'Exhausted OTP record automatically deleted from database');

    // 5. Successful OTP Verification
    console.log('\n--- 5. SUCCESSFUL OTP VERIFICATION & TOKEN ISSUANCE ---');
    // Create fresh test OTP
    const validOtp = '123456';
    const validHashed = crypto.createHash('sha256').update(validOtp).digest('hex');
    await Otp.create({
      email: testEmail,
      otp: validHashed,
      purpose: 'password_reset',
      attempts: 0,
      verified: false,
    });

    const verifyRes = await request('POST', '/api/auth/verify-otp', {
      email: testEmail,
      otp: validOtp,
    });
    assert(verifyRes.status === 200, 'Correct OTP verified successfully with HTTP 200 OK');
    assert(!!verifyRes.data.token, 'Returns short-lived reset token');
    assert(!!verifyRes.data.resetUrl, 'Returns dynamic resetUrl for new tab opening');
    assert(
      verifyRes.data.resetUrl.includes('/reset-password?token='),
      'resetUrl contains /reset-password?token= query param'
    );

    // Verify OTP document deleted immediately after verification
    const deletedOtp = await Otp.findOne({ email: testEmail, purpose: 'password_reset' });
    assert(!deletedOtp, 'OTP record deleted immediately after successful verification');

    // Verify User in DB has hashed resetToken and 10-minute expiry
    const userWithToken = await User.findOne({ email: testEmail }).select('+resetToken +resetTokenExpiry');
    assert(!!userWithToken.resetToken, 'Hashed reset token persisted to User document');
    assert(userWithToken.resetTokenExpiry > new Date(), 'Reset token expiry set in future (10 minutes)');

    const issuedToken = verifyRes.data.token;

    // 6. Token Validation Endpoint (GET /api/auth/reset-password/:token & GET /api/auth/reset-password?token=)
    console.log('\n--- 6. TOKEN VALIDATION (PATH & QUERY FORMATS) ---');
    const pathValidateRes = await request('GET', `/api/auth/reset-password/${encodeURIComponent(issuedToken)}`);
    assert(pathValidateRes.status === 200, 'Valid token via path param returns HTTP 200 OK');
    assert(pathValidateRes.data.email === testEmail, 'Returns associated user email');

    const queryValidateRes = await request('GET', `/api/auth/reset-password?token=${encodeURIComponent(issuedToken)}`);
    assert(queryValidateRes.status === 200, 'Valid token via query param (?token=) returns HTTP 200 OK');

    const bogusValidateRes = await request('GET', '/api/auth/reset-password/completely_invalid_token');
    assert(bogusValidateRes.status === 400, 'Invalid token rejected with HTTP 400');

    // 7. Expired Token Rejection
    console.log('\n--- 7. EXPIRED TOKEN REJECTION ---');
    userWithToken.resetTokenExpiry = new Date(Date.now() - 5000); // 5 sec in past
    await userWithToken.save({ validateBeforeSave: false });

    const expiredCheck = await request('GET', `/api/auth/reset-password/${encodeURIComponent(issuedToken)}`);
    assert(expiredCheck.status === 400, 'Expired token rejected with HTTP 400');

    // Restore token validity for submission tests
    userWithToken.resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await userWithToken.save({ validateBeforeSave: false });

    // 8. Password Reset Submission Validations
    console.log('\n--- 8. PASSWORD RESET SUBMISSION VALIDATIONS ---');
    const mismatchRes = await request('POST', `/api/auth/reset-password/${encodeURIComponent(issuedToken)}`, {
      password: newPassword,
      confirmPassword: 'MismatchPassword123!',
    });
    assert(mismatchRes.status === 400, 'Mismatched passwords rejected with HTTP 400');

    const shortPassRes = await request('POST', `/api/auth/reset-password/${encodeURIComponent(issuedToken)}`, {
      password: '123',
      confirmPassword: '123',
    });
    assert(shortPassRes.status === 400, 'Short password (<6 chars) rejected with HTTP 400');

    // 9. Successful Password Reset & Token Invalidation
    console.log('\n--- 9. SUCCESSFUL PASSWORD UPDATE & SINGLE-USE TOKEN INVALIDATION ---');
    const successResetRes = await request('POST', `/api/auth/reset-password/${encodeURIComponent(issuedToken)}`, {
      password: newPassword,
      confirmPassword: newPassword,
    });
    assert(successResetRes.status === 200, 'Password reset succeeded with HTTP 200 OK');

    // Verify token invalidated in database
    const userAfterReset = await User.findOne({ email: testEmail }).select('+password +resetToken +resetTokenExpiry');
    assert(userAfterReset.resetToken === undefined, 'Reset token invalidated immediately after use');
    assert(userAfterReset.resetTokenExpiry === undefined, 'Reset token expiry cleared');

    // 10. Replay Attack Prevention
    console.log('\n--- 10. TOKEN REPLAY ATTACK PREVENTION ---');
    const replayRes = await request('POST', `/api/auth/reset-password/${encodeURIComponent(issuedToken)}`, {
      password: 'AnotherPassword@123',
      confirmPassword: 'AnotherPassword@123',
    });
    assert(replayRes.status === 400, 'Reusing consumed reset token rejected with HTTP 400');

    // 11. Authenticate with New Password
    console.log('\n--- 11. AUTHENTICATING WITH NEW PASSWORD ---');
    const oldLoginRes = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: originalPassword,
    });
    assert(oldLoginRes.status === 401, 'Old password rejected with HTTP 401');

    const newLoginRes = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: newPassword,
    });
    assert(newLoginRes.status === 200, 'New password successfully authenticates user');
    assert(!!newLoginRes.data.data?.token, 'Returns valid JWT token');

    // 12. Parameterless POST /api/auth/reset-password with token in body
    console.log('\n--- 12. PARAMETERLESS POST /api/auth/reset-password SUPPORT ---');
    // Generate token pair to test body submission
    const rawBodyToken = crypto.randomBytes(32).toString('hex');
    const hashedBodyToken = crypto.createHash('sha256').update(rawBodyToken).digest('hex');
    userAfterReset.resetToken = hashedBodyToken;
    userAfterReset.resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await userAfterReset.save({ validateBeforeSave: false });

    const bodyResetRes = await request('POST', '/api/auth/reset-password', {
      token: rawBodyToken,
      password: originalPassword,
      confirmPassword: originalPassword,
    });
    assert(bodyResetRes.status === 200, 'Parameterless POST /api/auth/reset-password with token in body succeeds');

    // 13. Direct /auth/* Aliases
    console.log('\n--- 13. DIRECT /auth/* ALIAS VERIFICATION ---');
    const aliasForgotRes = await request('POST', '/auth/forgot-password', { email: testEmail });
    assert(aliasForgotRes.status === 200, 'Direct POST /auth/forgot-password alias succeeds');

    // 14. Verify Login with Restored Original Password
    console.log('\n--- 14. VERIFYING LOGIN WITH RESTORED PASSWORD ---');
    const restoredLoginRes = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: originalPassword,
    });
    assert(restoredLoginRes.status === 200, 'Original password login succeeds 100%');

    // 15. Verify Passwordless OTP Login Unaffected
    console.log('\n--- 15. VERIFYING PASSWORDLESS OTP LOGIN UNAFFECTED ---');
    const otpSendRes = await request('POST', '/api/auth/send-login-otp', { email: testEmail });
    assert(otpSendRes.status === 200, 'Passwordless login OTP dispatch still works 100%');

    // Clean up test Otp records
    await Otp.deleteMany({ email: testEmail });

  } catch (err) {
    console.error('Unhandled error during test run:', err);
    failed++;
  } finally {
    await teardown();
  }

  console.log('\n===============================================================');
  console.log(`FORGOT PASSWORD SUITE: ${passed + failed} TESTS | PASSED: ${passed} | FAILED: ${failed}`);
  console.log(`STATUS: ${failed === 0 ? 'ALL TESTS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
  console.log('===============================================================');

  process.exit(failed === 0 ? 0 : 1);
}

runTests();
