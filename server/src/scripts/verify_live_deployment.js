async function runRealTest() {
  console.log('===========================================================');
  console.log('🚀 LIVE PRODUCTION END-TO-END VERIFICATION');
  console.log('   Frontend: https://hr-2027.vercel.app');
  console.log('   Backend:  https://hr-2027.onrender.com');
  console.log('===========================================================\n');

  const VERCEL_URL = 'https://hr-2027.vercel.app';
  const RENDER_URL = 'https://hr-2027.onrender.com/api';
  let passed = 0;
  let total = 0;

  function assert(name, condition, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ PASS: ${name} ${details ? `(${details})` : ''}`);
    } else {
      console.error(`❌ FAIL: ${name} ${details ? `(${details})` : ''}`);
    }
  }

  // 1. Frontend Asset Loading Test
  console.log('--- 1. BROWSER ASSETS & SPA ROUTING ---');
  try {
    const htmlRes = await fetch(VERCEL_URL + '/');
    assert('Frontend index.html loads', htmlRes.status === 200, `HTTP ${htmlRes.status}`);
    const html = await htmlRes.text();
    assert('HTML contains React root div', html.includes('id="root"'));

    const cssMatch = html.match(/href="(\/assets\/[^"]+\.css)"/);
    if (cssMatch) {
      const cssRes = await fetch(VERCEL_URL + cssMatch[1]);
      assert('Design System CSS bundle loads', cssRes.status === 200, cssMatch[1]);
    }

    const jsMatch = html.match(/src="(\/assets\/[^"]+\.js)"/);
    if (jsMatch) {
      const jsRes = await fetch(VERCEL_URL + jsMatch[1]);
      assert('Production JS bundle loads', jsRes.status === 200, jsMatch[1]);
    }

    const adminRouteRes = await fetch(VERCEL_URL + '/admin/login');
    assert('Admin SPA route loads (no 404)', adminRouteRes.status === 200);

    const hrRouteRes = await fetch(VERCEL_URL + '/hr/login');
    assert('HR SPA route loads (no 404)', hrRouteRes.status === 200);

    const managerRouteRes = await fetch(VERCEL_URL + '/manager/login');
    assert('Manager SPA route loads (no 404)', managerRouteRes.status === 200);

    const empRouteRes = await fetch(VERCEL_URL + '/employee/login');
    assert('Employee SPA route loads (no 404)', empRouteRes.status === 200);
  } catch (e) {
    assert('Frontend asset fetching', false, e.message);
  }

  // 2. Backend Live API & DB Health
  console.log('\n--- 2. BACKEND API & MONGODB CLUSTER ---');
  try {
    const healthRes = await fetch(RENDER_URL + '/health');
    assert('Backend health check', healthRes.status === 200, `HTTP ${healthRes.status}`);
    const health = await healthRes.json();
    assert('Database connected to MongoDB Atlas', health.database === 'connected', `DB: ${health.database}`);
    assert('Backend running in production environment', health.environment === 'production', health.environment);
  } catch (e) {
    assert('Backend health check', false, e.message);
  }

  // 3. CORS Handshake
  console.log('\n--- 3. BROWSER CORS HANDSHAKE ---');
  try {
    const corsRes = await fetch(RENDER_URL + '/auth/login', {
      method: 'OPTIONS',
      headers: {
        'Origin': VERCEL_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });
    assert('CORS Preflight HTTP 204', corsRes.status === 204, `HTTP ${corsRes.status}`);
    assert('CORS allows Vercel origin', corsRes.headers.get('access-control-allow-origin') === VERCEL_URL, corsRes.headers.get('access-control-allow-origin'));
    assert('CORS allows credentials', corsRes.headers.get('access-control-allow-credentials') === 'true');
  } catch (e) {
    assert('CORS handshake', false, e.message);
  }

  // 4. Multi-Role Authentication & Data Access
  console.log('\n--- 4. MULTI-ROLE AUTHENTICATION & IDENTITY ---');
  let adminToken = '';
  try {
    // Admin login
    const adminLoginRes = await fetch(RENDER_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': VERCEL_URL },
      body: JSON.stringify({ email: 'a4adityaarora@gmail.com', password: 'Corp@EMP007#' }),
    });
    assert('Admin login HTTP 200', adminLoginRes.status === 200);
    const adminData = await adminLoginRes.json();
    assert('Admin JWT token received', !!adminData.data?.token);
    assert('Admin identity confirmed (Aditya Arora)', adminData.data?.user?.employeeId === 'EMP007', adminData.data?.user?.email);
    adminToken = adminData.data?.token || '';

    // HR login
    const hrLoginRes = await fetch(RENDER_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': VERCEL_URL },
      body: JSON.stringify({ email: 'tnu23505@gmail.com', password: 'Corp@EMP023#' }),
    });
    assert('HR login HTTP 200', hrLoginRes.status === 200);
    const hrData = await hrLoginRes.json();
    assert('HR identity confirmed (Tanishq Goyal)', hrData.data?.user?.employeeId === 'EMP023', hrData.data?.user?.email);

    // Manager login
    const mgrLoginRes = await fetch(RENDER_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': VERCEL_URL },
      body: JSON.stringify({ email: 'akshat.wadagbalkar@gmail.com', password: 'Corp@EMP019#' }),
    });
    assert('Manager login HTTP 200', mgrLoginRes.status === 200);
    const mgrData = await mgrLoginRes.json();
    assert('Manager identity confirmed (Akshat Wadagbalkar)', mgrData.data?.user?.employeeId === 'EMP019', mgrData.data?.user?.email);

    // Employee login
    const empLoginRes = await fetch(RENDER_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': VERCEL_URL },
      body: JSON.stringify({ email: 'abhiksinha06@gmail.com', password: 'Corp@EMP021#' }),
    });
    assert('Employee login HTTP 200', empLoginRes.status === 200);
    const empData = await empLoginRes.json();
    assert('Employee identity confirmed (Abhik Sinha)', empData.data?.user?.employeeId === 'EMP021', empData.data?.user?.email);
  } catch (e) {
    assert('Role login flow', false, e.message);
  }

  // 5. Protected Endpoints with JWT Token
  console.log('\n--- 5. PROTECTED API DATA RETRIEVAL (JWT Bearer) ---');
  if (adminToken) {
    try {
      // 5.1 /auth/me
      const meRes = await fetch(RENDER_URL + '/auth/me', {
        headers: { 'Authorization': `Bearer ${adminToken}`, 'Origin': VERCEL_URL },
      });
      assert('Protected /auth/me HTTP 200', meRes.status === 200);
      const meData = await meRes.json();
      assert('Token decoded to valid user session', meData.data?.user?.email === 'a4adityaarora@gmail.com');

      // 5.2 /employees
      const empListRes = await fetch(RENDER_URL + '/employees', {
        headers: { 'Authorization': `Bearer ${adminToken}`, 'Origin': VERCEL_URL },
      });
      assert('Protected /employees list HTTP 200', empListRes.status === 200);
      const empList = await empListRes.json();
      const count = empList.data?.employees?.length || empList.data?.length || 0;
      assert('Active employee directory accessible', count > 0, `${count} employees found`);

      // 5.3 /leaves
      const leavesRes = await fetch(RENDER_URL + '/leaves', {
        headers: { 'Authorization': `Bearer ${adminToken}`, 'Origin': VERCEL_URL },
      });
      assert('Protected /leaves endpoint HTTP 200', leavesRes.status === 200);

      // 5.4 /departments
      const deptRes = await fetch(RENDER_URL + '/departments', {
        headers: { 'Authorization': `Bearer ${adminToken}`, 'Origin': VERCEL_URL },
      });
      assert('Protected /departments endpoint HTTP 200', deptRes.status === 200);
    } catch (e) {
      assert('Protected API endpoints', false, e.message);
    }
  }

  console.log('\n===========================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  if (passed === total) {
    console.log('STATUS: ALL PRODUCTION SYSTEMS 100% OPERATIONAL & VERIFIED ✅');
  } else {
    console.log('STATUS: SOME CHECKS FAILED ❌');
  }
  console.log('===========================================================');
}

runRealTest();
