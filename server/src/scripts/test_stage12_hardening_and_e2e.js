const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');

dotenv.config({ path: path.join(__dirname, '../../.env') });
const { connectDB } = require('../config/db');

const app = require('../../app');
const { User } = require('../models/User');
const { Employee } = require('../models/Employee');
const { Leave } = require('../models/Leave');
const { Payroll } = require('../models/Payroll');
const { EmployeeDocument } = require('../models/EmployeeDocument');
const { generateToken } = require('../utils/jwt');

let passedTests = 0;
let failedTests = 0;

const assert = (condition, message) => {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failedTests++;
  }
};

/**
 * Helper to make local HTTP requests to Express server.
 */
const request = (server, method, path, headers = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const options = {
      hostname: '127.0.0.1',
      port: addr.port,
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
        } catch (_) {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
};

const runStage12Tests = async () => {
  console.log('===============================================================');
  console.log('🛡️ RUNNING STAGE 12: FINAL HARDENING, SECURITY & E2E SUITE');
  console.log('===============================================================');

  let server;

  try {
    await connectDB();
    console.log(' Connected to MongoDB Atlas\n');

    // Start local ephemeral HTTP server
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    console.log(` Ephemeral test server running on port ${port}\n`);

    // 1. HEALTH CHECK TEST
    console.log('--- 1. HEALTH CHECK & CREDENTIAL DISCLOSURE AUDIT ---');
    const healthRes = await request(server, 'GET', '/api/health');
    assert(healthRes.status === 200, 'GET /api/health responds with 200 OK');
    assert(healthRes.data.success === true, 'Health check indicates running database and server');
    assert(healthRes.data.timestamp !== undefined, 'Health check contains current timestamp');
    assert(!JSON.stringify(healthRes.data).includes('mongodb+srv'), 'Database connection string/credentials NEVER exposed in health check');
    assert(!JSON.stringify(healthRes.data).includes(process.env.JWT_SECRET || 'secret'), 'JWT secret NEVER exposed in health check');

    // 2. SECURITY HEADERS (HELMET) & CORS
    console.log('\n--- 2. SECURITY HEADERS & CORS HARDENING ---');
    assert(healthRes.headers['x-dns-prefetch-control'] !== undefined, 'Helmet DNS prefetch control header active');
    assert(healthRes.headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options nosniff header enforced');
    assert(healthRes.headers['x-frame-options'] !== undefined, 'Clickjacking protection (X-Frame-Options) active');

    // 3. AUTHENTICATION SECURITY & PASSWORD HASHING
    console.log('\n--- 3. AUTHENTICATION SECURITY & CREDENTIAL HYGIENE ---');
    const [adminUser, hrUser, mgrUser, empUser] = await Promise.all([
      User.findOne({ role: 'admin' }),
      User.findOne({ role: 'hr' }),
      User.findOne({ role: 'manager' }),
      User.findOne({ role: 'employee' }),
    ]);

    assert(adminUser && hrUser && mgrUser && empUser, 'Core test users loaded');

    // Verify Password select: false
    const rawUser = await User.findById(empUser._id);
    assert(rawUser.password === undefined, 'Password field has select:false and is hidden by default query');

    // Verify password is never returned in /api/auth/me
    const empToken = generateToken(empUser);
    const meRes = await request(server, 'GET', '/api/auth/me', {
      Authorization: `Bearer ${empToken}`,
    });
    assert(meRes.status === 200, 'GET /api/auth/me succeeds with valid JWT');
    assert(meRes.data.data.user.password === undefined, 'Password is NEVER returned in /api/auth/me response');

    // Verify invalid credentials rejection
    const badLoginRes = await request(server, 'POST', '/api/auth/login', {}, {
      email: empUser.email,
      password: 'DefinitivelyWrongPassword123!',
    });
    assert(badLoginRes.status === 401, 'Invalid password rejected with 401 Unauthorized');

    // 4. RESOURCE-LEVEL AUTHORIZATION & ID MANIPULATION ATTACK TESTS
    console.log('\n--- 4. RESOURCE-LEVEL AUTHORIZATION & ID MANIPULATION AUDIT ---');
    // Resolve employee records
    const otherEmployee = await Employee.findOne({
      email: { $ne: empUser.email },
    });

    assert(otherEmployee !== null, 'Target non-owned employee resolved for ID manipulation test');

    // ID Manipulation Test A: Employee accesses another employee profile directly
    const spoofEmpRes = await request(
      server,
      'GET',
      `/api/employees/${otherEmployee._id}`,
      { Authorization: `Bearer ${empToken}` }
    );
    assert(
      spoofEmpRes.status === 403 || spoofEmpRes.status === 404,
      `ID Manipulation Attack /api/employees/:id rejected with ${spoofEmpRes.status} (Unauthorized access denied)`
    );

    const myEmp = await Employee.findOne({ $or: [{ user: empUser._id }, { email: empUser.email }] });

    // ID Manipulation Test B: Employee accesses another employee payroll directly
    const otherPayroll = await Payroll.findOne({
      employee: { $ne: myEmp._id },
    });
    if (otherPayroll) {
      const spoofPayrollRes = await request(
        server,
        'GET',
        `/api/payroll/${otherPayroll._id}`,
        { Authorization: `Bearer ${empToken}` }
      );
      assert(
        spoofPayrollRes.status === 403 || spoofPayrollRes.status === 404,
        `ID Manipulation Attack /api/payroll/:id rejected with ${spoofPayrollRes.status} (Unauthorized payroll protected)`
      );
    }

    // ID Manipulation Test C: Employee attempts to view another employee leave details
    const otherLeave = await Leave.findOne({
      employee: { $ne: myEmp._id },
    });
    if (otherLeave) {
      const spoofLeaveRes = await request(
        server,
        'GET',
        `/api/leaves/${otherLeave._id}`,
        { Authorization: `Bearer ${empToken}` }
      );
      assert(
        spoofLeaveRes.status === 403 || spoofLeaveRes.status === 404,
        `ID Manipulation Attack /api/leaves/:id rejected with ${spoofLeaveRes.status} (Unauthorized leave protected)`
      );
    }

    // 5. MANAGER SCOPE INTEGRITY TEST
    console.log('\n--- 5. MANAGER TEAM SCOPE INTEGRITY ---');
    const mgrToken = generateToken(mgrUser);

    // Manager should not access audit logs
    const mgrAuditRes = await request(server, 'GET', '/api/audit-logs', {
      Authorization: `Bearer ${mgrToken}`,
    });
    assert(mgrAuditRes.status === 403, 'Manager forbidden from accessing system audit logs (403)');

    // Manager should not access organizational payroll reports
    const mgrPayrollReportRes = await request(server, 'GET', '/api/reports/payroll', {
      Authorization: `Bearer ${mgrToken}`,
    });
    assert(mgrPayrollReportRes.status === 403, 'Manager forbidden from accessing organizational payroll reports (403)');

    // 6. ADMIN & HR FULL-STACK AUDIT CAPABILITY
    console.log('\n--- 6. ADMIN & HR PRIVILEGES AUDIT ---');
    const adminToken = generateToken(adminUser);
    const hrToken = generateToken(hrUser);

    const adminAuditRes = await request(server, 'GET', '/api/audit-logs', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(adminAuditRes.status === 200, 'Admin has authorized access to full audit logs');

    const hrAuditRes = await request(server, 'GET', '/api/audit-logs', {
      Authorization: `Bearer ${hrToken}`,
    });
    assert(hrAuditRes.status === 200, 'HR has authorized access to operational audit logs');

    console.log('\n===============================================================');
    console.log(`📊 STAGE 12 SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('===============================================================');
  } catch (err) {
    console.error('Stage 12 test error:', err);
    failedTests++;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
    process.exit(failedTests > 0 ? 1 : 0);
  }
};

runStage12Tests();
