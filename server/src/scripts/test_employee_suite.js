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
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runEmployeeTests() {
  console.log('===============================================================');
  console.log('🧪 RUNNING EMPLOYEE MODULE AUTOMATED VERIFICATION SUITE');
  console.log('===============================================================');

  const results = [];
  function assert(name, condition, details = '') {
    results.push({ name, passed: Boolean(condition), details });
    console.log(`${condition ? '✅ PASS' : '❌ FAIL'}: ${name} ${details ? '(' + details + ')' : ''}`);
  }

  // 1. Unauthenticated access rejected
  const unauth = await request({ method: 'GET', path: '/api/employees' });
  assert('Unauthenticated access to /api/employees returns 401', unauth.status === 401);

  // Authenticate Admin
  const adminLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'admin@hrms.local', password: 'Admin@123456' },
  });
  const adminToken = adminLogin.data?.data?.token;

  // Authenticate HR
  const hrLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'hr@hrms.local', password: 'HrAdmin@1810#' },
  });
  const hrToken = hrLogin.data?.data?.token;

  // Authenticate Manager
  const mgrLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'manager@hrms.local', password: 'Manager@123456' },
  });
  const mgrToken = mgrLogin.data?.data?.token;

  // Authenticate Employee
  const empLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'employee@hrms.local', password: 'Employee@123456' },
  });
  const empToken = empLogin.data?.data?.token;

  // 2. Admin gets all employees
  const adminList = await request({
    method: 'GET',
    path: '/api/employees?limit=20',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('Admin can view all employees', adminList.status === 200 && adminList.data.data.length >= 8);

  // 3. HR gets all employees
  const hrList = await request({
    method: 'GET',
    path: '/api/employees?limit=20',
    headers: { Authorization: `Bearer ${hrToken}` },
  });
  assert('HR can view all employees', hrList.status === 200 && hrList.data.data.length >= 8);

  // 4. Manager gets only team members + self
  const mgrList = await request({
    method: 'GET',
    path: '/api/employees',
    headers: { Authorization: `Bearer ${mgrToken}` },
  });
  const mgrEmpIds = (mgrList.data?.data || []).map((e) => e.employeeId);
  const onlyTeam = mgrEmpIds.includes('EMP001') && mgrEmpIds.includes('MGR001') && !mgrEmpIds.includes('EMP003');
  assert('Manager scoped to team members and self', mgrList.status === 200 && onlyTeam, `IDs: ${mgrEmpIds.join(', ')}`);

  // 5. Employee scoped only to self
  const empList = await request({
    method: 'GET',
    path: '/api/employees',
    headers: { Authorization: `Bearer ${empToken}` },
  });
  const empIds = (empList.data?.data || []).map((e) => e.employeeId);
  assert('Employee scoped only to self', empList.status === 200 && empIds.length === 1 && empIds[0] === 'EMP001');

  // 6. Resource-level auth: Employee attempts to view Admin details -> 403
  const empOnAdmin = await request({
    method: 'GET',
    path: '/api/employees/ADM001',
    headers: { Authorization: `Bearer ${empToken}` },
  });
  assert('Employee viewing another employee returns 403 Forbidden', empOnAdmin.status === 403);

  // 7. Resource-level auth: Employee views own profile -> 200
  const empOnSelf = await request({
    method: 'GET',
    path: '/api/employees/EMP001',
    headers: { Authorization: `Bearer ${empToken}` },
  });
  assert('Employee viewing own profile succeeds (200 OK)', empOnSelf.status === 200 && empOnSelf.data.data.employeeId === 'EMP001');

  // 8. Resource-level auth: Manager views non-team employee -> 403
  const mgrOnFinance = await request({
    method: 'GET',
    path: '/api/employees/EMP003',
    headers: { Authorization: `Bearer ${mgrToken}` },
  });
  assert('Manager viewing non-team employee returns 403 Forbidden', mgrOnFinance.status === 403);

  // 9. Resource-level auth: Manager views team member -> 200
  const mgrOnTeam = await request({
    method: 'GET',
    path: '/api/employees/EMP001',
    headers: { Authorization: `Bearer ${mgrToken}` },
  });
  assert('Manager viewing assigned team member succeeds (200 OK)', mgrOnTeam.status === 200);

  // 10. Admin creates new employee
  const testEmpEmail = `test.dev.${Date.now()}@hrms.local`;
  const createRes = await request({
    method: 'POST',
    path: '/api/employees',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      firstName: 'Automated',
      lastName: 'Tester',
      email: testEmpEmail,
      department: 'Quality Assurance',
      designation: 'QA Automation Engineer',
      employmentType: 'full-time',
    },
  });
  assert('Admin can create new employee', createRes.status === 201 && createRes.data.data.employeeId.startsWith('EMP'));
  const newEmpId = createRes.data?.data?._id;

  // 11. Employee attempting to create employee -> 403
  const empCreate = await request({
    method: 'POST',
    path: '/api/employees',
    headers: { Authorization: `Bearer ${empToken}` },
    body: {
      firstName: 'Unauthorized',
      lastName: 'User',
      email: 'unauth@hrms.local',
      department: 'Engineering',
      designation: 'Hacker',
    },
  });
  assert('Employee attempting to create employee returns 403 Forbidden', empCreate.status === 403);

  // 12. HR updates employee
  const updateRes = await request({
    method: 'PATCH',
    path: `/api/employees/${newEmpId}`,
    headers: { Authorization: `Bearer ${hrToken}` },
    body: {
      designation: 'Lead QA Engineer',
      phone: '+1 (555) 000-1122',
    },
  });
  assert('HR can update employee', updateRes.status === 200 && updateRes.data.data.designation === 'Lead QA Engineer');

  // 13. Employee attempting to update employee -> 403
  const empUpdate = await request({
    method: 'PATCH',
    path: `/api/employees/${newEmpId}`,
    headers: { Authorization: `Bearer ${empToken}` },
    body: { designation: 'CEO' },
  });
  assert('Employee attempting to update employee returns 403 Forbidden', empUpdate.status === 403);

  // 14. HR deactivates employee (soft delete)
  const deactivateRes = await request({
    method: 'DELETE',
    path: `/api/employees/${newEmpId}`,
    headers: { Authorization: `Bearer ${hrToken}` },
  });
  assert('HR can soft-deactivate employee (sets status to inactive)', deactivateRes.status === 200 && deactivateRes.data.data.employmentStatus === 'inactive');

  // 15. Employee attempting to deactivate employee -> 403
  const empDeactivate = await request({
    method: 'DELETE',
    path: `/api/employees/${newEmpId}`,
    headers: { Authorization: `Bearer ${empToken}` },
  });
  assert('Employee attempting to deactivate employee returns 403 Forbidden', empDeactivate.status === 403);

  // 16. Search filter
  const searchRes = await request({
    method: 'GET',
    path: '/api/employees?search=Jane',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('Search filter by name works', searchRes.status === 200 && searchRes.data.data.some((e) => e.firstName === 'Jane'));

  // 17. Department filter
  const deptRes = await request({
    method: 'GET',
    path: '/api/employees?department=Engineering',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('Department filter works', deptRes.status === 200 && deptRes.data.data.every((e) => e.department.toLowerCase() === 'engineering'));

  // 18. Distinct departments meta endpoint
  const metaDept = await request({
    method: 'GET',
    path: '/api/employees/meta/departments',
    headers: { Authorization: `Bearer ${empToken}` },
  });
  assert('Distinct departments meta endpoint works', metaDept.status === 200 && Array.isArray(metaDept.data.data) && metaDept.data.data.includes('Engineering'));

  console.log('===============================================================');
  const allPassed = results.every((r) => r.passed);
  console.log(`EMPLOYEE SUITE: ${results.length} TESTS | PASSED: ${results.filter((r) => r.passed).length} | FAILED: ${results.filter((r) => !r.passed).length}`);
  console.log(`STATUS: ${allPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌'}`);
  console.log('===============================================================');
  process.exit(allPassed ? 0 : 1);
}

runEmployeeTests().catch((err) => {
  console.error('Fatal error in employee tests:', err);
  process.exit(1);
});
