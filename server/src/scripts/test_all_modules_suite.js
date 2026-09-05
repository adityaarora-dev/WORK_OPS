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

async function runAllModulesTests() {
  console.log('===============================================================');
  console.log('🧪 RUNNING HRMS STAGES 4, 5, 6, 7, 8 AUTOMATED VERIFICATION SUITE');
  console.log('===============================================================');

  const results = [];
  function assert(name, condition, details = '') {
    results.push({ name, passed: Boolean(condition), details });
    console.log(`${condition ? '✅ PASS' : '❌ FAIL'}: ${name} ${details ? '(' + details + ')' : ''}`);
  }

  // 1. Authenticate tokens
  const adminLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'a4adityaarora@gmail.com', password: 'Corp@EMP007#' },
  });
  const adminToken = adminLogin.data?.data?.token;

  const hrLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'tnu23505@gmail.com', password: 'Corp@EMP023#' },
  });
  const hrToken = hrLogin.data?.data?.token;

  const mgrLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'akshat.wadagbalkar@gmail.com', password: 'Corp@EMP019#' },
  });
  const mgrToken = mgrLogin.data?.data?.token;

  const empLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'u23022686@gmail.com', password: 'Corp@EMP020#' },
  });
  const empToken = empLogin.data?.data?.token;

  // ==============================================================
  // STAGE 4: DEPARTMENT MANAGEMENT TESTS
  // ==============================================================
  console.log('\n--- STAGE 4: DEPARTMENT TESTS ---');
  // 1. Unauthenticated rejected
  const unauthDept = await request({ method: 'GET', path: '/api/departments' });
  assert('Unauthenticated access to /api/departments returns 401', unauthDept.status === 401);

  // 2. Admin gets departments with employee counts
  const adminDepts = await request({
    method: 'GET',
    path: '/api/departments?limit=50',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('Admin can view departments', adminDepts.status === 200 && adminDepts.data.data.length >= 4);
  assert('Departments have computed employee counts', adminDepts.data.data.some((d) => d.employeeCount > 0));

  // 3. Employee can read departments
  const empDepts = await request({
    method: 'GET',
    path: '/api/departments',
    headers: { Authorization: `Bearer ${empToken}` },
  });
  assert('Employee can view departments (read-only)', empDepts.status === 200);

  // 4. Employee cannot create department
  const empCreateDept = await request({
    method: 'POST',
    path: '/api/departments',
    headers: { Authorization: `Bearer ${empToken}` },
    body: { name: 'Hacker Unit' },
  });
  assert('Employee cannot create department (403 Forbidden)', empCreateDept.status === 403);

  // 5. Manager cannot create department
  const mgrCreateDept = await request({
    method: 'POST',
    path: '/api/departments',
    headers: { Authorization: `Bearer ${mgrToken}` },
    body: { name: 'Manager Rogue Dept' },
  });
  assert('Manager cannot create department (403 Forbidden)', mgrCreateDept.status === 403);

  // 6. Admin creates new department with server-generated ID
  const testDeptName = `Test Unit ${Date.now()}`;
  const createDeptRes = await request({
    method: 'POST',
    path: '/api/departments',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { name: testDeptName, description: 'Test Department Unit', location: 'Lab 4' },
  });
  assert('Admin can create department', createDeptRes.status === 201 && createDeptRes.data.data.departmentId.startsWith('DEPT'));
  const newDeptId = createDeptRes.data?.data?._id;

  // 7. Duplicate department name returns 409
  const dupDept = await request({
    method: 'POST',
    path: '/api/departments',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { name: testDeptName },
  });
  assert('Duplicate department name returns 409 Conflict', dupDept.status === 409);

  // 8. Department with active employees cannot be deactivated (Safe Deactivation Rule)
  const deptWithEmployees = adminDepts.data.data.find((d) => d.employeeCount > 0);
  const deactEng = await request({
    method: 'DELETE',
    path: `/api/departments/${deptWithEmployees._id}`,
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('Deactivating department with active employees returns 409 Conflict', deactEng.status === 409);

  // 9. Deactivating empty department succeeds
  const deactEmpty = await request({
    method: 'DELETE',
    path: `/api/departments/${newDeptId}`,
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('Deactivating empty department succeeds (status: inactive)', deactEmpty.status === 200 && deactEmpty.data.data.status === 'inactive');

  // ==============================================================
  // STAGE 5: ATTENDANCE MANAGEMENT TESTS
  // ==============================================================
  console.log('\n--- STAGE 5: ATTENDANCE TESTS ---');
  // 10. Summary endpoint returns today stats
  const attSummary = await request({
    method: 'GET',
    path: '/api/attendance/summary',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('Attendance summary returns valid stats', attSummary.status === 200 && typeof attSummary.data.data.present === 'number');

  // 11. Manager scoped to team attendance
  const mgrAtt = await request({
    method: 'GET',
    path: '/api/attendance',
    headers: { Authorization: `Bearer ${mgrToken}` },
  });
  assert('Manager can access team attendance', mgrAtt.status === 200 && Array.isArray(mgrAtt.data.data));

  // 12. Employee scoped to own attendance
  const empAtt = await request({
    method: 'GET',
    path: '/api/attendance',
    headers: { Authorization: `Bearer ${empToken}` },
  });
  assert('Employee can access own attendance', empAtt.status === 200 && Array.isArray(empAtt.data.data));

  // ==============================================================
  // STAGE 6: LEAVE MANAGEMENT TESTS
  // ==============================================================
  console.log('\n--- STAGE 6: LEAVE TESTS ---');
  // 13. Leave summary
  const leaveSum = await request({
    method: 'GET',
    path: '/api/leaves/summary',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('Leave summary returns valid counts', leaveSum.status === 200 && typeof leaveSum.data.data.pending === 'number');

  // 14. Employee applies for leave with unique future dates
  const randomOffset = 30 + Math.floor(Math.random() * 500);
  const sDate = new Date();
  sDate.setDate(sDate.getDate() + randomOffset);
  const eDate = new Date(sDate);
  eDate.setDate(eDate.getDate() + 2);

  const applyRes = await request({
    method: 'POST',
    path: '/api/leaves',
    headers: { Authorization: `Bearer ${empToken}` },
    body: {
      leaveType: 'sick',
      startDate: sDate.toISOString().split('T')[0],
      endDate: eDate.toISOString().split('T')[0],
      reason: 'Automated test recovery period',
    },
  });
  if (applyRes.status !== 201) {
    console.error('DEBUG applyRes:', applyRes.status, applyRes.data);
  }
  assert('Employee can apply for leave (3 days calculated)', applyRes.status === 201 && applyRes.data.data.numberOfDays === 3);
  const newLeaveId = applyRes.data?.data?._id;

  // 15. Employee cannot approve their own leave
  const empApprove = await request({
    method: 'PATCH',
    path: `/api/leaves/${newLeaveId}`,
    headers: { Authorization: `Bearer ${empToken}` },
    body: { status: 'approved' },
  });
  assert('Employee cannot approve their own leave (403 Forbidden)', empApprove.status === 403);

  // 16. Manager can approve team member leave
  const mgrApprove = await request({
    method: 'PATCH',
    path: `/api/leaves/${newLeaveId}`,
    headers: { Authorization: `Bearer ${mgrToken}` },
    body: { status: 'approved', comment: 'Approved by Engineering Manager' },
  });
  assert('Manager can approve assigned team leave', mgrApprove.status === 200 && mgrApprove.data.data.status === 'approved');

  // ==============================================================
  // STAGE 7: PAYROLL MANAGEMENT TESTS
  // ==============================================================
  console.log('\n--- STAGE 7: PAYROLL TESTS ---');
  // 17. Manager restricted from organization payroll
  const mgrPay = await request({
    method: 'GET',
    path: '/api/payroll',
    headers: { Authorization: `Bearer ${mgrToken}` },
  });
  assert('Manager restricted from organization payroll records', mgrPay.status === 200 && mgrPay.data.data.length === 0);

  // 18. Employee can view only own payroll
  const empPay = await request({
    method: 'GET',
    path: '/api/payroll',
    headers: { Authorization: `Bearer ${empToken}` },
  });
  assert('Employee can view own payroll record', empPay.status === 200 && Array.isArray(empPay.data.data));

  // 19. Admin calculates and generates payroll with dynamic future period
  const testYear = 2030 + Math.floor(Math.random() * 50);
  const testMonth = Math.floor(Math.random() * 12) + 1;
  const payGenRes = await request({
    method: 'POST',
    path: '/api/payroll',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      employee: 'EMP007',
      month: testMonth,
      year: testYear,
      basicSalary: 7000,
      allowances: 1000,
      overtime: 500,
      bonus: 500,
      deductions: 400,
      tax: 1100,
    },
  });
  // Gross = 7000 + 1000 + 500 + 500 = 9000, Net = 9000 - 400 - 1100 = 7500
  assert('Admin generates payroll with exact server calculations', payGenRes.status === 201 && payGenRes.data.data.grossSalary === 9000 && payGenRes.data.data.netSalary === 7500);

  // ==============================================================
  // STAGE 8: DOCUMENT MANAGEMENT TESTS
  // ==============================================================
  console.log('\n--- STAGE 8: DOCUMENT TESTS ---');
  // 20. Unauthenticated access to /api/documents rejected
  const unauthDocs = await request({ method: 'GET', path: '/api/documents' });
  assert('Unauthenticated access to /api/documents returns 401', unauthDocs.status === 401);

  // 21. Employee scoped to own documents
  const empDocs = await request({
    method: 'GET',
    path: '/api/documents',
    headers: { Authorization: `Bearer ${empToken}` },
  });
  assert('Employee can access documents (scoped to self)', empDocs.status === 200 && Array.isArray(empDocs.data.data));

  console.log('\n===============================================================');
  const allPassed = results.every((r) => r.passed);
  console.log(`STAGES 4-8 SUITE: ${results.length} TESTS | PASSED: ${results.filter((r) => r.passed).length} | FAILED: ${results.filter((r) => !r.passed).length}`);
  console.log(`STATUS: ${allPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌'}`);
  console.log('===============================================================');
  process.exit(allPassed ? 0 : 1);
}

runAllModulesTests().catch((err) => {
  console.error('Fatal error in test suite:', err);
  process.exit(1);
});
