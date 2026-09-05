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

async function runStage9Tests() {
  console.log('===============================================================');
  console.log('📈 RUNNING STAGE 9: PERFORMANCE MANAGEMENT VERIFICATION SUITE');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      passed++;
      console.log(`✅ PASS: ${name} ${details ? '(' + details + ')' : ''}`);
    } else {
      failed++;
      console.log(`❌ FAIL: ${name} ${details ? '(' + details + ')' : ''}`);
    }
  }

  // 1. Authenticate tokens for all 4 roles
  console.log('\n--- 1. AUTHENTICATING ROLES ---');
  const adminLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'a4adityaarora@gmail.com', password: 'Corp@EMP007#' },
  });
  const adminToken = adminLogin.data?.data?.token;
  assert('Admin authenticated', adminLogin.status === 200 && Boolean(adminToken));

  const hrLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'tnu23505@gmail.com', password: 'Corp@EMP023#' },
  });
  const hrToken = hrLogin.data?.data?.token;
  assert('HR authenticated', hrLogin.status === 200 && Boolean(hrToken));

  const mgrLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'akshat.wadagbalkar@gmail.com', password: 'Corp@EMP019#' },
  });
  const mgrToken = mgrLogin.data?.data?.token;
  assert('Manager authenticated', mgrLogin.status === 200 && Boolean(mgrToken));

  const empLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'u23022686@gmail.com', password: 'Corp@EMP020#' },
  });
  const empToken = empLogin.data?.data?.token;
  assert('Employee (Uttkarsh Kumar) authenticated', empLogin.status === 200 && Boolean(empToken));

  // Retrieve employee records to have target IDs
  const employeesRes = await request({
    method: 'GET',
    path: '/api/employees?limit=100',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const allEmployees = employeesRes.data?.data || [];
  const targetEmp = allEmployees.find((e) => e.email === 'u23022686@gmail.com');
  const adminEmp = allEmployees.find((e) => e.email === 'a4adityaarora@gmail.com');

  assert('Target test employees resolved', Boolean(targetEmp && adminEmp));

  // 2. Performance Review Cycle Tests
  console.log('\n--- 2. PERFORMANCE REVIEW CYCLES ---');
  // Employee cannot create review cycle (403 Forbidden)
  const empCycleAttempt = await request({
    method: 'POST',
    path: '/api/performance/cycles',
    headers: { Authorization: `Bearer ${empToken}` },
    body: {
      name: 'Employee Unauthorized Cycle',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    },
  });
  assert('Employee forbidden from creating review cycle', empCycleAttempt.status === 403);

  // HR creates review cycle
  const cycleName = `Annual Appraisal Cycle ${Date.now()}`;
  const hrCycleRes = await request({
    method: 'POST',
    path: '/api/performance/cycles',
    headers: { Authorization: `Bearer ${hrToken}` },
    body: {
      name: cycleName,
      description: 'Annual corporate performance and growth evaluation',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'active',
    },
  });
  assert('HR successfully creates review cycle', hrCycleRes.status === 201 && hrCycleRes.data?.data?.name === cycleName);
  const cycleId = hrCycleRes.data?.data?._id;

  // Invalid date rejection (start > end)
  const invalidDateCycle = await request({
    method: 'POST',
    path: '/api/performance/cycles',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      name: `Invalid Cycle ${Date.now()}`,
      startDate: '2026-12-31',
      endDate: '2026-01-01',
    },
  });
  assert('Cycle with start date after end date rejected (400)', invalidDateCycle.status === 400);

  // List review cycles
  const listCycles = await request({
    method: 'GET',
    path: '/api/performance/cycles',
    headers: { Authorization: `Bearer ${empToken}` },
  });
  assert('Employees can view published review cycles', listCycles.status === 200 && Array.isArray(listCycles.data?.data));

  // 3. Goals Management & Scoping Tests
  console.log('\n--- 3. EMPLOYEE GOALS & SCOPING ---');
  // Manager assigns goal to direct report (Rohan Gupta)
  const mgrGoalRes = await request({
    method: 'POST',
    path: '/api/performance/goals',
    headers: { Authorization: `Bearer ${mgrToken}` },
    body: {
      employee: targetEmp._id,
      title: 'Optimize API Response Times to <100ms',
      description: 'Implement distributed Redis caching and query indexing across core endpoints',
      category: 'Technical Excellence',
      priority: 'high',
      dueDate: '2026-06-30',
      progress: 25,
      reviewCycle: cycleId,
    },
  });
  assert('Manager assigns goal to direct report (201)', mgrGoalRes.status === 201);
  const goalId = mgrGoalRes.data?.data?._id;

  // Manager CANNOT assign goal to unrelated employee (Aditya Arora - Admin/CTO)
  const mgrUnrelatedGoal = await request({
    method: 'POST',
    path: '/api/performance/goals',
    headers: { Authorization: `Bearer ${mgrToken}` },
    body: {
      employee: adminEmp._id,
      title: 'Unauthorized Goal for CTO',
      dueDate: '2026-12-31',
    },
  });
  assert('Manager cannot assign goal to unrelated employee (403 Forbidden)', mgrUnrelatedGoal.status === 403);

  // Employee updates permitted goal progress (25% -> 80%)
  const empUpdateProgress = await request({
    method: 'PATCH',
    path: `/api/performance/goals/${goalId}`,
    headers: { Authorization: `Bearer ${empToken}` },
    body: { progress: 80 },
  });
  assert('Employee updates personal goal progress (200)', empUpdateProgress.status === 200 && empUpdateProgress.data?.data?.progress === 80);

  // Invalid progress (>100) rejected
  const invalidProgressHigh = await request({
    method: 'PATCH',
    path: `/api/performance/goals/${goalId}`,
    headers: { Authorization: `Bearer ${empToken}` },
    body: { progress: 150 },
  });
  assert('Goal progress >100 rejected (400 Bad Request)', invalidProgressHigh.status === 400);

  // Invalid progress (<0) rejected
  const invalidProgressLow = await request({
    method: 'PATCH',
    path: `/api/performance/goals/${goalId}`,
    headers: { Authorization: `Bearer ${empToken}` },
    body: { progress: -10 },
  });
  assert('Goal progress <0 rejected (400 Bad Request)', invalidProgressLow.status === 400);

  // 4. Performance Review & Evaluations Tests
  console.log('\n--- 4. PERFORMANCE REVIEWS & SCOPING ---');
  // Employee cannot submit manager evaluation (403)
  const empReviewAttempt = await request({
    method: 'POST',
    path: '/api/performance/reviews',
    headers: { Authorization: `Bearer ${empToken}` },
    body: {
      employee: targetEmp._id,
      reviewCycle: cycleId,
      overallRating: 5,
    },
  });
  assert('Employee cannot create review evaluation (403 Forbidden)', empReviewAttempt.status === 403);

  // Manager CANNOT review unrelated employee (Aditya Arora)
  const mgrUnrelatedReview = await request({
    method: 'POST',
    path: '/api/performance/reviews',
    headers: { Authorization: `Bearer ${mgrToken}` },
    body: {
      employee: adminEmp._id,
      reviewCycle: cycleId,
      overallRating: 4,
      strengths: 'Good leadership',
    },
  });
  assert('Manager cannot conduct review for unrelated employee (403 Forbidden)', mgrUnrelatedReview.status === 403);

  // Invalid rating (e.g. 6 or 0) rejected
  const invalidRatingRes = await request({
    method: 'POST',
    path: '/api/performance/reviews',
    headers: { Authorization: `Bearer ${mgrToken}` },
    body: {
      employee: targetEmp._id,
      reviewCycle: cycleId,
      overallRating: 6,
    },
  });
  assert('Invalid rating >5 rejected (400 Bad Request)', invalidRatingRes.status === 400);

  // Manager conducts performance review for direct report (Rohan Gupta)
  const mgrReviewRes = await request({
    method: 'POST',
    path: '/api/performance/reviews',
    headers: { Authorization: `Bearer ${mgrToken}` },
    body: {
      employee: targetEmp._id,
      reviewCycle: cycleId,
      overallRating: 4,
      strengths: 'Deep technical knowledge, high code quality, and proactive mentoring.',
      weaknesses: 'Can improve cross-departmental documentation sharing.',
      achievements: 'Delivered high-throughput microservice architecture ahead of schedule.',
      areasForImprovement: 'Lead quarterly engineering architectural reviews.',
      managerComments: 'Outstanding contributor to the engineering team this year.',
      status: 'submitted',
    },
  });
  assert('Manager conducts review for assigned team member (201 Created)', mgrReviewRes.status === 201);
  const reviewId = mgrReviewRes.data?.data?._id;

  // Duplicate review in same cycle prevented (409 Conflict)
  const duplicateReviewRes = await request({
    method: 'POST',
    path: '/api/performance/reviews',
    headers: { Authorization: `Bearer ${mgrToken}` },
    body: {
      employee: targetEmp._id,
      reviewCycle: cycleId,
      overallRating: 5,
    },
  });
  assert('Duplicate review in same cycle rejected (409 Conflict)', duplicateReviewRes.status === 409);

  // Employee CANNOT modify manager rating or feedback (403 Forbidden)
  const empTamperRating = await request({
    method: 'PATCH',
    path: `/api/performance/reviews/${reviewId}`,
    headers: { Authorization: `Bearer ${empToken}` },
    body: { overallRating: 5 },
  });
  assert('Employee cannot alter manager rating (403 Forbidden)', empTamperRating.status === 403);

  // Employee acknowledges review and submits employeeComments
  const empAckRes = await request({
    method: 'PATCH',
    path: `/api/performance/reviews/${reviewId}`,
    headers: { Authorization: `Bearer ${empToken}` },
    body: {
      status: 'acknowledged',
      employeeComments: 'Thank you for the detailed feedback. I am excited to take on architecture reviews.',
    },
  });
  assert('Employee acknowledges review with employee comments (200 OK)', empAckRes.status === 200 && empAckRes.data?.data?.status === 'acknowledged');

  // Once acknowledged, Manager cannot freely edit review
  const mgrPostAckEdit = await request({
    method: 'PATCH',
    path: `/api/performance/reviews/${reviewId}`,
    headers: { Authorization: `Bearer ${mgrToken}` },
    body: { overallRating: 3 },
  });
  assert('Manager cannot alter review once acknowledged by employee (400 Bad Request)', mgrPostAckEdit.status === 400);

  // 5. Employee Self-Service: GET /api/performance/my
  console.log('\n--- 5. EMPLOYEE SELF-SERVICE (GET /api/performance/my) ---');
  const myPerfRes = await request({
    method: 'GET',
    path: '/api/performance/my',
    headers: { Authorization: `Bearer ${empToken}` },
  });
  assert('Employee accesses personal performance dashboard summary', myPerfRes.status === 200 && Boolean(myPerfRes.data?.data?.metrics));
  assert('Personal summary includes accurate rating and goal metrics', myPerfRes.data?.data?.metrics?.avgRating === 4);

  console.log('\n===============================================================');
  console.log(`📊 STAGE 9 SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) process.exit(1);
}

runStage9Tests().catch((err) => {
  console.error('Unhandled error in Stage 9 test suite:', err);
  process.exit(1);
});
