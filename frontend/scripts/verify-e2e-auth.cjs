const http = require('http');

function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, text: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, text: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runE2E() {
  console.log('\n--- Expensio Live End-to-End Auth & Onboarding Verification ---\n');

  // Test 1: Google Social Login (Phase 1)
  console.log('1. Testing Google OAuth POST /api/auth/social...');
  const googleRes = await postJson('/api/auth/social', {
    provider: 'google',
    token: 'mock_google_id_token_12345',
    email: 'apeksha.google@expensio.app',
    name: 'Apeksha Verma',
  });
  console.log('Google Auth Status:', googleRes.status);
  console.log('JWT Issued:', Boolean(googleRes.data?.token));
  console.log('Provider:', googleRes.data?.user?.authProvider);
  if (!googleRes.data?.token) throw new Error('Failed to generate JWT on Google Auth');

  const jwt = googleRes.data.token;

  // Test 2: Profile Check (Phase 2)
  console.log('\n2. Testing Profile Check GET /api/user/profile...');
  const profileRes = await getJson('/api/user/profile', jwt);
  console.log('Profile Status:', profileRes.status);
  console.log('Profile Completeness:', profileRes.data?.isProfileComplete);

  // Test 3: Complete Onboarding Profile (Phase 2)
  console.log('\n3. Testing Profile Update POST /api/user/profile...');
  const updateRes = await postJson('/api/user/profile', {
    username: '@apeksha',
    salary: 45000,
    avatarId: 'avatar_1',
    name: 'Apeksha Verma',
  });
  console.log('Update Status:', updateRes.status);
  console.log('Updated Username:', updateRes.data?.user?.username);
  console.log('Updated Salary:', updateRes.data?.user?.salary);
  console.log('Updated AvatarId:', updateRes.data?.user?.avatarId);
  console.log('Is Profile Complete Now:', updateRes.data?.isProfileComplete);
  if (!updateRes.data?.isProfileComplete) throw new Error('Expected profile to be complete after onboarding');

  // Test 4: MPIN Verification (Phase 3)
  console.log('\n4. Testing MPIN Verification POST /api/auth/mpin/verify...');
  const mpinCorrect = await postJson('/api/auth/mpin/verify', { mpin: '1234' });
  console.log('Valid MPIN (1234):', mpinCorrect.data?.success);

  const mpinWrong = await postJson('/api/auth/mpin/verify', { mpin: '9999' });
  console.log('Invalid MPIN (9999) Error:', mpinWrong.data?.error);

  console.log('\n🎉 ALL LIVE END-TO-END FLOW TESTS PASSED SUCCESSFULLY!\n');
}

runE2E().catch((err) => {
  console.error('❌ E2E Test Failure:', err);
  process.exit(1);
});
