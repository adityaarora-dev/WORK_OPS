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
  console.log('🔒 RUNNING FORGOT PASSWORD & PASSWORD RESET VERIFICATION SUITE');
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
      email: 'nonexistent.user999@company.com',
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

    // 3. Valid User Requests Password Reset
    console.log('\n--- 3. RESET TOKEN GENERATION & PERSISTENCE ---');
    const validReq = await request('POST', '/api/auth/forgot-password', { email: testEmail });
    assert(validReq.status === 200, 'Valid user forgot-password returns HTTP 200 OK');

    // Inspect user in DB to verify token was hashed and has expiry
    const userInDb = await User.findOne({ email: testEmail }).select('+password +resetToken +resetTokenExpiry');
    assert(!!userInDb.resetToken, 'Hashed reset token saved to database');
    assert(
      userInDb.resetTokenExpiry && userInDb.resetTokenExpiry > new Date(),
      'Reset token expiry set in future (15 minutes)'
    );

    // For test simulation, generate our own known token pair to test endpoints
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    userInDb.resetToken = hashedToken;
    userInDb.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await userInDb.save({ validateBeforeSave: false });

    // 4. Validate Token Endpoint (GET /api/auth/reset-password/:token)
    console.log('\n--- 4. TOKEN VALIDATION (GET /api/auth/reset-password/:token) ---');
    const validTokenCheck = await request('GET', `/api/auth/reset-password/${rawToken}`);
    assert(validTokenCheck.status === 200, 'Valid token returns HTTP 200 OK');
    assert(validTokenCheck.data.email === testEmail, 'Returns associated user email');

    const invalidTokenCheck = await request('GET', '/api/auth/reset-password/totally_bogus_token_123');
    assert(invalidTokenCheck.status === 400, 'Invalid token returns HTTP 400 Bad Request');

    // 5. Expired Token Check
    console.log('\n--- 5. EXPIRED TOKEN REJECTION ---');
    const expiredRawToken = crypto.randomBytes(32).toString('hex');
    const expiredHashedToken = crypto.createHash('sha256').update(expiredRawToken).digest('hex');
    userInDb.resetToken = expiredHashedToken;
    userInDb.resetTokenExpiry = new Date(Date.now() - 1000); // 1 sec in past
    await userInDb.save({ validateBeforeSave: false });

    const expiredTokenCheck = await request('GET', `/api/auth/reset-password/${expiredRawToken}`);
    assert(expiredTokenCheck.status === 400, 'Expired token rejected with HTTP 400');

    // Reset back to active valid token for submission testing
    userInDb.resetToken = hashedToken;
    userInDb.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await userInDb.save({ validateBeforeSave: false });

    // 6. Password Reset Submission Validations (POST /api/auth/reset-password/:token)
    console.log('\n--- 6. PASSWORD RESET SUBMISSION VALIDATIONS ---');
    const mismatchRes = await request('POST', `/api/auth/reset-password/${rawToken}`, {
      password: newPassword,
      confirmPassword: 'MismatchPassword123!',
    });
    assert(mismatchRes.status === 400, 'Mismatched passwords rejected with HTTP 400');

    const shortPassRes = await request('POST', `/api/auth/reset-password/${rawToken}`, {
      password: '123',
      confirmPassword: '123',
    });
    assert(shortPassRes.status === 400, 'Short password (<6 chars) rejected with HTTP 400');

    // 7. Successful Password Reset
    console.log('\n--- 7. SUCCESSFUL PASSWORD UPDATE & TOKEN INVALIDATION ---');
    const successResetRes = await request('POST', `/api/auth/reset-password/${rawToken}`, {
      password: newPassword,
      confirmPassword: newPassword,
    });
    assert(successResetRes.status === 200, 'Password reset succeeded with HTTP 200 OK');

    // Verify token invalidated in database
    const userAfterReset = await User.findOne({ email: testEmail }).select('+password +resetToken +resetTokenExpiry');
    assert(userAfterReset.resetToken === undefined, 'Reset token invalidated immediately after use');
    assert(userAfterReset.resetTokenExpiry === undefined, 'Reset token expiry cleared');

    // 8. Token Replay Attack Prevention
    console.log('\n--- 8. TOKEN REPLAY ATTACK PREVENTION ---');
    const replayRes = await request('POST', `/api/auth/reset-password/${rawToken}`, {
      password: 'AnotherPassword@123',
      confirmPassword: 'AnotherPassword@123',
    });
    assert(replayRes.status === 400, 'Reusing consumed token rejected with HTTP 400');

    // 9. Login with New Password
    console.log('\n--- 9. AUTHENTICATING WITH NEW PASSWORD ---');
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

    // 10. Direct alias /auth/ endpoints work
    console.log('\n--- 10. DIRECT /auth/* ALIAS VERIFICATION ---');
    const aliasForgotRes = await request('POST', '/auth/forgot-password', { email: testEmail });
    assert(aliasForgotRes.status === 200, 'Direct POST /auth/forgot-password alias succeeds');

    // Restore original password
    userAfterReset.password = originalPassword;
    await userAfterReset.save();
    console.log('\n--- 11. RESTORING ORIGINAL PASSWORD ---');
    const restoredLoginRes = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: originalPassword,
    });
    assert(restoredLoginRes.status === 200, 'Original password successfully restored for testing consistency');

    // 12. Verify OTP Login Flow Unaffected
    console.log('\n--- 12. VERIFYING OTP LOGIN UNAFFECTED ---');
    const otpSendRes = await request('POST', '/api/auth/send-login-otp', { email: testEmail });
    assert(otpSendRes.status === 200, 'OTP dispatch still works 100%');

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
