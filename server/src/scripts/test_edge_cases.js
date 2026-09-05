const dotenv = require('dotenv');
const dns = require('dns');
const path = require('path');
const http = require('http');
const jwt = require('jsonwebtoken');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

dotenv.config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { User } = require('../models/User');

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

async function testEdgeCases() {
  console.log('--- Testing Expired Token and Inactive User ---');
  await mongoose.connect(process.env.MONGODB_URI);

  const hrUser = await User.findOne({ role: 'hr' });

  // 1. Expired token rejection
  const expiredToken = jwt.sign(
    { id: hrUser._id.toString(), role: hrUser.role },
    process.env.JWT_SECRET,
    { expiresIn: '-10s' }
  );

  const expiredRes = await request({
    method: 'GET',
    path: '/api/auth/me',
    headers: { Authorization: `Bearer ${expiredToken}` },
  });
  console.log('Expired token test status:', expiredRes.status, expiredRes.data.message);
  if (expiredRes.status !== 401) throw new Error('Expired token was not rejected!');

  // 2. Inactive user rejection
  hrUser.isActive = false;
  await hrUser.save();

  // Test login while inactive
  const inactiveLogin = await request({
    method: 'POST',
    path: '/api/auth/login',
    body: { email: 'tnu23505@gmail.com', password: 'Corp@EMP023#' },
  });
  console.log('Inactive user login status:', inactiveLogin.status, inactiveLogin.data.message);
  if (inactiveLogin.status !== 401) throw new Error('Inactive user was allowed to log in!');

  // Restore active status
  hrUser.isActive = true;
  await hrUser.save();
  console.log('Restored HR user isActive: true');

  await mongoose.connection.close();
  console.log('✅ Expired token & Inactive user checks passed perfectly!');
  process.exit(0);
}

testEdgeCases().catch(err => {
  console.error('Edge case error:', err);
  process.exit(1);
});
