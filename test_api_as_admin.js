const http = require('http');

async function test() {
  const loginData = JSON.stringify({ username: 'admin', password: 'admin123' });
  
  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };

  const loginRes = await new Promise((resolve, reject) => {
    const req = http.request(loginOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.status, headers: res.headers, data: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });

  const cookie = loginRes.headers['set-cookie'];
  console.log('Login Status:', loginRes.data.success ? 'Success' : 'Failed');

  async function getApi(path) {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: { 'Cookie': cookie }
    };

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
  }

  console.log('\n--- Testing /api/personnel ---');
  const pers = await getApi('/api/personnel');
  console.log('Status:', pers.status);
  console.log('Data Type:', Array.isArray(pers.data) ? 'Array' : 'Object');
  if (!Array.isArray(pers.data)) console.log('Data:', pers.data);

  console.log('\n--- Testing /api/customers ---');
  const cust = await getApi('/api/customers');
  console.log('Status:', cust.status);
  console.log('Data Type:', Array.isArray(cust.data) ? 'Array' : 'Object');
  if (!Array.isArray(cust.data)) console.log('Data:', cust.data);

  console.log('\n--- Testing /api/services ---');
  const serv = await getApi('/api/services');
  console.log('Status:', serv.status);
  console.log('Data Type:', Array.isArray(serv.data) ? 'Array' : 'Object');
  if (!Array.isArray(serv.data)) console.log('Data:', serv.data);
}

test().catch(console.error);
