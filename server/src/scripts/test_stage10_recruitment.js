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

async function runStage10Tests() {
  console.log('===============================================================');
  console.log('🎯 RUNNING STAGE 10: RECRUITMENT & ATS VERIFICATION SUITE');
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

  // 1. Authenticate tokens for all roles
  console.log('\n--- 1. AUTHENTICATING ROLES ---');
  const adminLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'aarav.sharma@company.com', password: 'Admin@123456' },
  });
  const adminToken = adminLogin.data?.data?.token;
  assert('Admin authenticated', adminLogin.status === 200 && Boolean(adminToken));

  const hrLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'priya.patel@company.com', password: 'HrAdmin@1810#' },
  });
  const hrToken = hrLogin.data?.data?.token;
  assert('HR authenticated', hrLogin.status === 200 && Boolean(hrToken));

  const mgrLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'rajesh.iyer@company.com', password: 'Manager@123456' },
  });
  const mgrToken = mgrLogin.data?.data?.token;
  assert('Manager authenticated', mgrLogin.status === 200 && Boolean(mgrToken));

  const empLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'akshat.wadagbalkar@gmail.com', password: 'Corp@EMP019#' },
  });
  const empToken = empLogin.data?.data?.token;
  assert('Employee authenticated', empLogin.status === 200 && Boolean(empToken));

  // Retrieve an active department ID
  const deptsRes = await request({
    method: 'GET',
    path: '/api/departments',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const testDept = deptsRes.data?.data?.[0];
  assert('Department resolved for recruitment', Boolean(testDept?._id));

  // 2. Role Restriction on Recruitment (Employee Blocked)
  console.log('\n--- 2. EMPLOYEE ROLE RESTRICTION ---');
  const empJobsAttempt = await request({
    method: 'GET',
    path: '/api/recruitment/jobs',
    headers: { Authorization: `Bearer ${empToken}` },
  });
  assert('Employee blocked from recruitment endpoints (403 Forbidden)', empJobsAttempt.status === 403);

  // 3. Job Opening Creation & Server-Generated Job ID
  console.log('\n--- 3. JOB OPENINGS CREATION & MANAGEMENT ---');
  const uniqueTitle = `Senior Cloud Architect - ${Date.now()}`;
  const createJobRes = await request({
    method: 'POST',
    path: '/api/recruitment/jobs',
    headers: { Authorization: `Bearer ${hrToken}` },
    body: {
      title: uniqueTitle,
      description: 'Lead next-generation distributed multi-region Kubernetes cloud infrastructure.',
      department: testDept._id,
      designation: 'Staff Cloud Architect',
      employmentType: 'full-time',
      location: 'Bengaluru HQ, Karnataka',
      openings: 2,
      requirements: ['10+ years backend & distributed systems', 'Expert in Go, Rust, and Kubernetes'],
      responsibilities: ['Architect fault-tolerant microservices', 'Mentor principal engineers'],
      salaryRange: { min: 4500000, max: 6500000, currency: 'INR' },
      status: 'open',
    },
  });
  assert('HR creates job opening (201 Created)', createJobRes.status === 201);
  const createdJob = createJobRes.data?.data;
  assert('Job ID auto-generated sequentially server-side', /^JOB\d+$/i.test(createdJob?.jobId));
  const jobId = createdJob?._id;

  // Manager cannot create organization job openings (403)
  const mgrJobAttempt = await request({
    method: 'POST',
    path: '/api/recruitment/jobs',
    headers: { Authorization: `Bearer ${mgrToken}` },
    body: {
      title: 'Unauthorized Manager Job',
      description: 'Testing permissions',
      department: testDept._id,
      designation: 'Engineer',
      location: 'Bengaluru',
    },
  });
  assert('Manager cannot create job openings (403 Forbidden)', mgrJobAttempt.status === 403);

  // 4. Candidate Creation & Deduplication
  console.log('\n--- 4. CANDIDATE CREATION & DEDUPLICATION ---');
  const candidateEmail = `candidate.${Date.now()}@gmail.com`;
  const candRes = await request({
    method: 'POST',
    path: '/api/recruitment/candidates',
    headers: { Authorization: `Bearer ${hrToken}` },
    body: {
      firstName: 'Vikram',
      lastName: 'Malhotra',
      email: candidateEmail,
      phone: '+91 99887 76655',
      address: {
        street: '45 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      },
      skills: ['Distributed Systems', 'Kubernetes', 'Go', 'PostgreSQL'],
      experience: 8,
      education: 'B.Tech in Computer Science, IIT Bombay',
      source: 'LinkedIn',
      notes: 'Strong candidate with deep open-source cloud native contributions',
    },
  });
  assert('HR creates candidate record (201 Created)', candRes.status === 201);
  const createdCand = candRes.data?.data;
  assert('Candidate ID auto-generated sequentially', /^CAN\d+$/i.test(createdCand?.candidateId));
  const candId = createdCand?._id;

  // Duplicate candidate email prevented (409 Conflict)
  const dupCandRes = await request({
    method: 'POST',
    path: '/api/recruitment/candidates',
    headers: { Authorization: `Bearer ${hrToken}` },
    body: {
      firstName: 'Vikram Duplicate',
      lastName: 'Malhotra',
      email: candidateEmail,
    },
  });
  assert('Duplicate candidate email rejected (409 Conflict)', dupCandRes.status === 409);

  // 5. Job Application & Pipeline Progression
  console.log('\n--- 5. APPLICATION PIPELINE & STAGE TRANSITIONS ---');
  const appRes = await request({
    method: 'POST',
    path: '/api/recruitment/applications',
    headers: { Authorization: `Bearer ${hrToken}` },
    body: {
      candidate: candId,
      jobOpening: jobId,
      notes: 'Initial application received via LinkedIn pipeline.',
    },
  });
  assert('Job application created (201 Created)', appRes.status === 201);
  const createdApp = appRes.data?.data;
  assert('Application ID auto-generated sequentially', /^APP\d+$/i.test(createdApp?.applicationId));
  assert('Initial stage is Applied', createdApp?.currentStage === 'Applied');
  const appId = createdApp?._id;

  // Duplicate application for same candidate & job prevented (409 Conflict)
  const dupAppRes = await request({
    method: 'POST',
    path: '/api/recruitment/applications',
    headers: { Authorization: `Bearer ${hrToken}` },
    body: {
      candidate: candId,
      jobOpening: jobId,
    },
  });
  assert('Duplicate application for same job opening rejected (409 Conflict)', dupAppRes.status === 409);

  // Stage transition: Applied -> Screening
  const toScreening = await request({
    method: 'POST',
    path: `/api/recruitment/applications/${appId}/stage`,
    headers: { Authorization: `Bearer ${hrToken}` },
    body: { stage: 'Screening', notes: 'Resume screened and skills verified.' },
  });
  assert('Stage transitioned to Screening (200 OK)', toScreening.status === 200 && toScreening.data?.data?.currentStage === 'Screening');

  // Stage transition: Screening -> Shortlisted
  const toShortlisted = await request({
    method: 'POST',
    path: `/api/recruitment/applications/${appId}/stage`,
    headers: { Authorization: `Bearer ${hrToken}` },
    body: { stage: 'Shortlisted', notes: 'Shortlisted for technical interviews.' },
  });
  assert('Stage transitioned to Shortlisted (200 OK)', toShortlisted.status === 200 && toShortlisted.data?.data?.currentStage === 'Shortlisted');

  // 6. Interview Scheduling & Feedback
  console.log('\n--- 6. INTERVIEW COORDINATION & FEEDBACK ---');
  // Resolve Rajesh Iyer's User ID
  const usersRes = await request({
    method: 'GET',
    path: '/api/recruitment/summary',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert('Recruitment dashboard summary retrieved', usersRes.status === 200);

  // HR schedules interview with Rajesh Iyer (Manager)
  const mgrUser = adminLogin.data?.data?.user; // Or manager user
  const interviewRes = await request({
    method: 'POST',
    path: '/api/recruitment/interviews',
    headers: { Authorization: `Bearer ${hrToken}` },
    body: {
      application: appId,
      interviewer: mgrUser.id,
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      duration: 60,
      mode: 'video',
      location: 'https://meet.google.com/xyz-test-meet',
    },
  });
  assert('Interview scheduled successfully (201 Created)', interviewRes.status === 201);
  const interviewId = interviewRes.data?.data?._id;
  assert('Interview ID auto-generated sequentially', /^INT\d+$/i.test(interviewRes.data?.data?.interviewId));

  // Verify application auto-progressed to 'Interview' stage
  const appAfterInterview = await request({
    method: 'GET',
    path: `/api/recruitment/applications/${appId}`,
    headers: { Authorization: `Bearer ${hrToken}` },
  });
  assert('Application stage automatically set to "Interview"', appAfterInterview.data?.data?.currentStage === 'Interview');

  // Submit interview feedback & rating (1-5)
  const feedbackRes = await request({
    method: 'PATCH',
    path: `/api/recruitment/interviews/${interviewId}`,
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      feedback: 'Excellent system design skills, clearly articulated distributed consensus algorithms.',
      rating: 5,
      status: 'completed',
    },
  });
  assert('Interview feedback and rating recorded (200 OK)', feedbackRes.status === 200 && feedbackRes.data?.data?.rating === 5);

  // Advance stage to Selected and then Offer
  await request({
    method: 'POST',
    path: `/api/recruitment/applications/${appId}/stage`,
    headers: { Authorization: `Bearer ${hrToken}` },
    body: { stage: 'Selected', notes: 'Cleared all rounds.' },
  });

  await request({
    method: 'POST',
    path: `/api/recruitment/applications/${appId}/stage`,
    headers: { Authorization: `Bearer ${hrToken}` },
    body: { stage: 'Offer', notes: 'Offer letter dispatched.' },
  });

  // 7. Candidate -> Employee Conversion (Critical Stage 10 Feature)
  console.log('\n--- 7. CANDIDATE -> EMPLOYEE CONVERSION ---');
  // Manager cannot convert candidate to employee (403)
  const mgrConvertAttempt = await request({
    method: 'POST',
    path: `/api/recruitment/applications/${appId}/convert-to-employee`,
    headers: { Authorization: `Bearer ${mgrToken}` },
    body: { department: testDept._id },
  });
  assert('Manager forbidden from executing employee conversion (403 Forbidden)', mgrConvertAttempt.status === 403);

  // HR converts candidate to active Employee
  const convertRes = await request({
    method: 'POST',
    path: `/api/recruitment/applications/${appId}/convert-to-employee`,
    headers: { Authorization: `Bearer ${hrToken}` },
    body: {
      department: testDept._id,
      designation: 'Staff Cloud Architect',
      employmentType: 'full-time',
      joiningDate: new Date().toISOString(),
    },
  });
  assert('Candidate successfully converted into Employee (201 Created)', convertRes.status === 201);
  const newEmp = convertRes.data?.data?.employee;
  assert('Converted employee has valid sequential EMPxxx ID', /^EMP\d+$/i.test(newEmp?.employeeId));
  assert('Candidate profile details mapped to Employee', newEmp?.firstName === 'Vikram' && newEmp?.email === candidateEmail);

  // Verify application record has link to converted employee
  const appAfterConversion = await request({
    method: 'GET',
    path: `/api/recruitment/applications/${appId}`,
    headers: { Authorization: `Bearer ${hrToken}` },
  });
  assert('Application links to converted Employee record', Boolean(appAfterConversion.data?.data?.convertedToEmployee));
  assert('Application stage is updated to Hired', appAfterConversion.data?.data?.currentStage === 'Hired');

  // Duplicate conversion prevented
  const secondConvertAttempt = await request({
    method: 'POST',
    path: `/api/recruitment/applications/${appId}/convert-to-employee`,
    headers: { Authorization: `Bearer ${hrToken}` },
    body: { department: testDept._id },
  });
  assert('Duplicate conversion on already converted application rejected (400 Bad Request)', secondConvertAttempt.status === 400);

  console.log('\n===============================================================');
  console.log(`📊 STAGE 10 SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) process.exit(1);
}

runStage10Tests().catch((err) => {
  console.error('Unhandled error in Stage 10 test suite:', err);
  process.exit(1);
});
