const http = require('http');

async function apiCall(method, path, data, cookie) {
  const body = data ? JSON.stringify(data) : '';
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: path,
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'Cookie': cookie || ''
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resData) });
        } catch (e) {
          resolve({ status: res.statusCode, data: resData });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function login(username, password) {
  const res = await apiCall('POST', '/api/auth/login', { username, password });
  const cookie = res.status === 200 ? res.data.success ? 'connect.sid=' + res.data.user.id : null : null; 
  // Wait, session cookie is in headers
  return res;
}

// Improved login to get cookie
async function loginAndGetCookie(username, password) {
  const body = JSON.stringify({ username, password });
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          cookie: res.headers['set-cookie'],
          data: JSON.parse(data)
        });
      });
    });
    req.write(body);
    req.end();
  });
}

async function test() {
  console.log('--- TESTING ROLE-BASED ACCESS ---');

  // 1. MANAGER TEST
  console.log('\n[Manager Test]');
  const managerLogin = await loginAndGetCookie('test_yönetici', 'test123');
  if (!managerLogin.data.success) {
    console.log('Manager login failed. Skipping manager tests.');
  } else {
    const mCookie = managerLogin.cookie;
    
    // Add vehicle (Should work)
    const addVeh = await apiCall('POST', '/api/settings/vehicles', { name: 'Test Vehicle' }, mCookie);
    console.log('Manager Add Vehicle Status:', addVeh.status, addVeh.status === 200 ? '(Success - Expected)' : '(Failed)');

    // Add brand (Should fail with 403)
    const addBrand = await apiCall('POST', '/api/settings/brands', { name: 'Test Brand' }, mCookie);
    console.log('Manager Add Brand Status:', addBrand.status, addBrand.status === 403 ? '(Forbidden - Expected)' : '(Failed)');
  }

  // 2. PERSONNEL TEST
  console.log('\n[Personnel Test]');
  const personelLogin = await loginAndGetCookie('test_personel', 'test123');
  if (!personelLogin.data.success) {
    console.log('Personnel login failed. Skipping personnel tests.');
  } else {
    const pCookie = personelLogin.cookie;

    // Get settings (Should fail or be filtered - usually requireAuth is enough for GET, but let's see if we added more)
    // Actually, user requested "ayarlar kısmı sadece admin ve hizmet yöneticileri tarafından kullanılabilecek"
    // So GET routes might still work but frontend hides it. 
    // If we want total security, we should check backend GET routes too.
    const getVeh = await apiCall('GET', '/api/settings/vehicles', null, pCookie);
    console.log('Personnel GET Vehicles Status:', getVeh.status);
  }

  console.log('\nVerification complete.');
}

test().catch(console.error);
