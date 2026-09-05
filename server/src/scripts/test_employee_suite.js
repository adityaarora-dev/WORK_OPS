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

async function runEmployeeTestSuite() {
  console.log('===============================================================');
  console.log('🧪 RUNNING EMPLOYEE MODULE AUTOMATED VERIFICATION SUITE');
  console.log('===============================================================');

  const results = [];
  function assert(name, condition, details = '') {
    results.push({ name, passed: Boolean(condition), details });
    console.log(`${condition ? '✅ PASS' : '❌ FAIL'}: ${name} ${details ? '(' + details + ')' : ''}`);
  }

  // 1. Unauthenticated request rejected
  const unauth = await request({ method: 'GET', path: '/api/employees' });
  assert('Unauthenticated access to /api/employees returns 401', unauth.status === 401);

  // Authenticate Admin (Aditya Arora)
  const adminLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'a4adityaarora@gmail.com', password: 'Corp@EMP007#' },
  });
  const adminToken = adminLogin.data?.data?.token;

  // Authenticate HR (Tanishq Goyal)
  const hrLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'tnu23505@gmail.com', password: 'Corp@EMP023#' },
  });
  const hrToken = hrLogin.data?.data?.token;

  // Authenticate Manager (Akshat Wadagbalkar)
  const mgrLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'akshat.wadagbalkar@gmail.com', password: 'Corp@EMP019#' },
  });
  const mgrToken = mgrLogin.data?.data?.token;

  // Authenticate Employee (Abhik Sinha)
  const empLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'abhiksinha06@gmail.com', password: 'Corp@EMP021#' },
  });
  const empToken = empLogin.data?.data?.token;

  // 2. Admin gets all employees (seeded employees)
  const adminList = await request({
    method: 'GET',
    path: '/api/employees?limit=20',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('Admin can view all employees', adminList.status === 200 && adminList.data.data.length >= 6);

  // 3. HR gets all employees
  const hrList = await request({
    method: 'GET',
    path: '/api/employees?limit=20',
    headers: { Authorization: `Bearer ${hrToken}` },
  });
  assert('HR can view all employees', hrList.status === 200 && hrList.data.data.length >= 6);

  // 4. Manager gets only team members + self (Akshat Wadagbalkar - EMP019 manages Uttkarsh Kumar - EMP020)
  const mgrList = await request({
    method: 'GET',
    path: '/api/employees',
    headers: { Authorization: `Bearer ${mgrToken}` },
  });
  const mgrEmpIds = (mgrList.data?.data || []).map((e) => e.employeeId);
  const onlyTeam = mgrEmpIds.includes('EMP020') && mgrEmpIds.includes('EMP019') && !mgrEmpIds.includes('EMP021');
  assert('Manager scoped to team members and self', mgrList.status === 200 && onlyTeam, `IDs: ${mgrEmpIds.join(', ')}`);

  // 5. Employee scoped only to self (Abhik Sinha - EMP021)
  const empList = await request({
    method: 'GET',
    path: '/api/employees',
    headers: { Authorization: `Bearer ${empToken}` },
  });
  const empIds = (empList.data?.data || []).map((e) => e.employeeId);
  assert('Employee scoped only to self', empList.status === 200 && empIds.length === 1 && empIds[0] === 'EMP021');

  // 6. Resource-level auth: Employee attempts to view Admin details -> 403
  const adminEmpRecord = adminList.data.data.find((e) => e.employeeId === 'EMP007');
  const empOnAdmin = await request({
    method: 'GET',
    path: `/api/employees/${adminEmpRecord._id}`,
    headers: { Authorization: `Bearer ${empToken}` },
  });
  assert('Employee viewing another employee returns 403 Forbidden', empOnAdmin.status === 403);

  // 7. Employee viewing own profile -> 200
  const ownEmpRecord = adminList.data.data.find((e) => e.employeeId === 'EMP021');
  const empOnSelf = await request({
    method: 'GET',
    path: `/api/employees/${ownEmpRecord._id}`,
    headers: { Authorization: `Bearer ${empToken}` },
  });
  assert('Employee viewing own profile succeeds (200 OK)', empOnSelf.status === 200 && empOnSelf.data.data.employeeId === 'EMP021');

  // 8. Manager viewing non-team employee -> 403 (Abhik Sinha reports to Chiranthan, not Akshat)
  const nonTeamRecord = adminList.data.data.find((e) => e.employeeId === 'EMP021');
  const mgrOnNonTeam = await request({
    method: 'GET',
    path: `/api/employees/${nonTeamRecord._id}`,
    headers: { Authorization: `Bearer ${mgrToken}` },
  });
  assert('Manager viewing non-team employee returns 403 Forbidden', mgrOnNonTeam.status === 403);

  // 9. Manager viewing assigned team member -> 200 (Uttkarsh reports to Akshat)
  const teamMemberRecord = adminList.data.data.find((e) => e.employeeId === 'EMP020');
  const mgrOnTeam = await request({
    method: 'GET',
    path: `/api/employees/${teamMemberRecord._id}`,
    headers: { Authorization: `Bearer ${mgrToken}` },
  });
  assert('Manager viewing assigned team member succeeds (200 OK)', mgrOnTeam.status === 200);

  // 10. Admin can create employee
  const testNewEmpId = `EMPTEST${Date.now().toString().slice(-4)}`;
  const createRes = await request({
    method: 'POST',
    path: '/api/employees',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      firstName: 'Alok',
      lastName: 'Mishra',
      email: `alok.mishra.${Date.now()}@gmail.com`,
      department: adminEmpRecord.department?._id || adminEmpRecord.department,
      designation: 'Staff Security Engineer',
      employeeId: testNewEmpId,
    },
  });
  assert('Admin can create new employee', createRes.status === 201 && createRes.data.data.employeeId === testNewEmpId);
  const createdId = createRes.data?.data?._id;

  // 11. Employee cannot create employee -> 403
  const empCreate = await request({
    method: 'POST',
    path: '/api/employees',
    headers: { Authorization: `Bearer ${empToken}` },
    body: { firstName: 'Hacker', lastName: 'Test', email: 'hacker.test@gmail.com', department: 'Engineering', designation: 'Dev' },
  });
  assert('Employee attempting to create employee returns 403 Forbidden', empCreate.status === 403);

  // 12. HR can update employee
  const updateRes = await request({
    method: 'PUT',
    path: `/api/employees/${createdId}`,
    headers: { Authorization: `Bearer ${hrToken}` },
    body: { designation: 'Principal Security Engineer' },
  });
  assert('HR can update employee', updateRes.status === 200 && updateRes.data.data.designation === 'Principal Security Engineer');

  // 13. Employee cannot update employee -> 403
  const empUpdate = await request({
    method: 'PUT',
    path: `/api/employees/${createdId}`,
    headers: { Authorization: `Bearer ${empToken}` },
    body: { designation: 'CEO' },
  });
  assert('Employee attempting to update employee returns 403 Forbidden', empUpdate.status === 403);

  // 14. HR can deactivate employee (soft delete)
  const deactRes = await request({
    method: 'DELETE',
    path: `/api/employees/${createdId}`,
    headers: { Authorization: `Bearer ${hrToken}` },
  });
  assert('HR can soft-deactivate employee (sets status to inactive)', deactRes.status === 200 && deactRes.data.data.employmentStatus === 'inactive');

  // 15. Employee cannot deactivate employee -> 403
  const empDeact = await request({
    method: 'DELETE',
    path: `/api/employees/${createdId}`,
    headers: { Authorization: `Bearer ${empToken}` },
  });
  assert('Employee attempting to deactivate employee returns 403 Forbidden', empDeact.status === 403);

  // 16. Search filter works
  const searchRes = await request({
    method: 'GET',
    path: '/api/employees?search=Akshat',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('Search filter by name works', searchRes.status === 200 && searchRes.data.data.some((e) => e.firstName === 'Akshat'));

  // 17. Department filter works
  const deptRes = await request({
    method: 'GET',
    path: `/api/employees?department=${adminEmpRecord.department?._id || adminEmpRecord.department}`,
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('Department filter works', deptRes.status === 200 && deptRes.data.data.length >= 1);

  // 18. Distinct departments meta endpoint works
  const distinctRes = await request({
    method: 'GET',
    path: '/api/employees/meta/departments',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('Distinct departments meta endpoint works', distinctRes.status === 200 && Array.isArray(distinctRes.data.data) && distinctRes.data.data.length >= 2);

  console.log('===============================================================');
  const allPassed = results.every((r) => r.passed);
  console.log(`EMPLOYEE SUITE: ${results.length} TESTS | PASSED: ${results.filter((r) => r.passed).length} | FAILED: ${results.filter((r) => !r.passed).length}`);
  console.log(`STATUS: ${allPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌'}`);
  console.log('===============================================================');

  if (!allPassed) process.exit(1);
}

runEmployeeTestSuite().catch(console.error);
