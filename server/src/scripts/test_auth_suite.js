const http = require('http');

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

async function runTestSuite() {
  console.log('===============================================================');
  console.log('🧪 RUNNING MANDATORY AUTHENTICATION & AUTHORIZATION TEST SUITE');
  console.log('===============================================================');

  const results = [];
  function assert(name, condition, details = '') {
    results.push({ name, passed: Boolean(condition), details });
    console.log(`${condition ? '✅ PASS' : '❌ FAIL'}: ${name} ${details ? '(' + details + ')' : ''}`);
  }

  // 1. Health check
  const health = await request({ method: 'GET', path: '/api/health' });
  assert('Health check works', health.status === 200 && health.data.database === 'connected');

  // 2. Root check
  const root = await request({ method: 'GET', path: '/' });
  assert('Root GET / works', root.status === 200 && root.data.success === true);

  // 3. Login with HR
  const hrLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'tnu23505@gmail.com', password: 'Corp@EMP023#' },
  });
  assert('HR login succeeds with correct password', hrLogin.status === 200 && hrLogin.data.data.token);
  const hrToken = hrLogin.data?.data?.token;

  // 4. Password / hash never returned
  assert('Password & hash excluded from login response', !hrLogin.data.data.user.password);

  // 5. Login with Admin
  const adminLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'a4adityaarora@gmail.com', password: 'Corp@EMP007#' },
  });
  assert('Admin login succeeds', adminLogin.status === 200 && adminLogin.data.data.token);
  const adminToken = adminLogin.data?.data?.token;

  // 6. Login with Manager
  const mgrLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'akshat.wadagbalkar@gmail.com', password: 'Corp@EMP019#' },
  });
  assert('Manager login succeeds', mgrLogin.status === 200 && mgrLogin.data.data.token);
  const mgrToken = mgrLogin.data?.data?.token;

  // 7. Login with Employee
  const empLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'abhiksinha06@gmail.com', password: 'Corp@EMP021#' },
  });
  assert('Employee login succeeds', empLogin.status === 200 && empLogin.data.data.token);
  const empToken = empLogin.data?.data?.token;

  // 8. Incorrect password fails
  const badPass = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'a4adityaarora@gmail.com', password: 'WrongPassword123' },
  });
  assert('Incorrect password returns 401 Invalid credentials', badPass.status === 401 && badPass.data.message === 'Invalid credentials');

  // 9. Nonexistent user fails with same generic message
  const noUser = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'nonexistent.user.test@gmail.com', password: 'Password123' },
  });
  assert('Nonexistent email returns 401 Invalid credentials', noUser.status === 401 && noUser.data.message === 'Invalid credentials');

  // 10. Missing email
  const noEmail = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { password: 'Password123' },
  });
  assert('Missing email returns 400', noEmail.status === 400);

  // 11. Missing password
  const noPw = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'a4adityaarora@gmail.com' },
  });
  assert('Missing password returns 400', noPw.status === 400);

  // 12. GET /api/auth/me with valid JWT
  const me = await request({
    method: 'GET',
    path: '/api/auth/me',
    headers: { Authorization: `Bearer ${hrToken}` },
  });
  assert('GET /api/auth/me succeeds with valid token', me.status === 200 && me.data.data.user.role === 'hr');

  // 13. GET /api/auth/me without JWT
  const meNoAuth = await request({ method: 'GET', path: '/api/auth/me' });
  assert('GET /api/auth/me without token returns 401', meNoAuth.status === 401);

  // 14. GET /api/auth/me with invalid JWT
  const meBadToken = await request({
    method: 'GET',
    path: '/api/auth/me',
    headers: { Authorization: 'Bearer invalid.token.value' },
  });
  assert('GET /api/auth/me with invalid token returns 401', meBadToken.status === 401);

  // 15. Authorization: Admin accesses /api/test/admin
  const adminOnAdmin = await request({
    method: 'GET',
    path: '/api/test/admin',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('Admin can access /api/test/admin', adminOnAdmin.status === 200);

  // 16. Authorization: HR cannot access /api/test/admin (403)
  const hrOnAdmin = await request({
    method: 'GET',
    path: '/api/test/admin',
    headers: { Authorization: `Bearer ${hrToken}` },
  });
  assert('HR cannot access /api/test/admin (403 Forbidden)', hrOnAdmin.status === 403);

  // 17. Authorization: HR accesses /api/test/hr
  const hrOnHr = await request({
    method: 'GET',
    path: '/api/test/hr',
    headers: { Authorization: `Bearer ${hrToken}` },
  });
  assert('HR can access /api/test/hr', hrOnHr.status === 200);

  // 18. Authorization: Manager cannot access /api/test/admin (403)
  const mgrOnAdmin = await request({
    method: 'GET',
    path: '/api/test/admin',
    headers: { Authorization: `Bearer ${mgrToken}` },
  });
  assert('Manager cannot access /api/test/admin (403 Forbidden)', mgrOnAdmin.status === 403);

  // 19. Authorization: Manager cannot access /api/test/hr (403)
  const mgrOnHr = await request({
    method: 'GET',
    path: '/api/test/hr',
    headers: { Authorization: `Bearer ${mgrToken}` },
  });
  assert('Manager cannot access /api/test/hr (403 Forbidden)', mgrOnHr.status === 403);

  // 20. Authorization: Manager accesses /api/test/manager
  const mgrOnMgr = await request({
    method: 'GET',
    path: '/api/test/manager',
    headers: { Authorization: `Bearer ${mgrToken}` },
  });
  assert('Manager can access /api/test/manager', mgrOnMgr.status === 200);

  // 21. Authorization: Employee cannot access /api/test/admin (403)
  const empOnAdmin = await request({
    method: 'GET',
    path: '/api/test/admin',
    headers: { Authorization: `Bearer ${empToken}` },
  });
  assert('Employee cannot access /api/test/admin (403 Forbidden)', empOnAdmin.status === 403);

  // 22. Authorization: Employee cannot access /api/test/hr (403)
  const empOnHr = await request({
    method: 'GET',
    path: '/api/test/hr',
    headers: { Authorization: `Bearer ${empToken}` },
  });
  assert('Employee cannot access /api/test/hr (403 Forbidden)', empOnHr.status === 403);

  // 23. Authorization: Employee cannot access /api/test/manager (403)
  const empOnMgr = await request({
    method: 'GET',
    path: '/api/test/manager',
    headers: { Authorization: `Bearer ${empToken}` },
  });
  assert('Employee cannot access /api/test/manager (403 Forbidden)', empOnMgr.status === 403);

  // 24. Authorization: Employee accesses /api/test/employee (200)
  const empOnEmp = await request({
    method: 'GET',
    path: '/api/test/employee',
    headers: { Authorization: `Bearer ${empToken}` },
  });
  assert('Employee can access /api/test/employee', empOnEmp.status === 200);

  // 25. Public registration forces 'employee' role
  const regEmp = await request({
    method: 'POST',
    path: '/api/auth/register',
    body: {
      employeeId: 'TEST999',
      firstName: 'Hacker',
      lastName: 'Attempt',
      email: 'hacker.attempt.test@gmail.com',
      password: 'HackerPassword123',
      role: 'admin', // Malicious attempt to claim admin!
    },
  });
  if (regEmp.status === 201) {
    assert('Public registration ignores "role: admin" and forces "employee"', regEmp.data.data.user.role === 'employee');
  } else {
    assert('Public registration rejects unauthorized calls or handles duplicate', regEmp.status === 403 || regEmp.status === 201 || regEmp.status === 409);
  }

  // 26. Logout endpoint works
  const logoutRes = await request({
    method: 'POST',
    path: '/api/auth/logout',
    headers: { Authorization: `Bearer ${empToken}` },
  });
  assert('POST /api/auth/logout returns 200 OK', logoutRes.status === 200 && logoutRes.data.success === true);

  console.log('===============================================================');
  const allPassed = results.every((r) => r.passed);
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${results.filter((r) => r.passed).length} | FAILED: ${results.filter((r) => !r.passed).length}`);
  console.log(`OVERALL STATUS: ${allPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌'}`);
  console.log('===============================================================');
  process.exit(allPassed ? 0 : 1);
}

runTestSuite().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
