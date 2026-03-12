const db = require('./db');

try {
  console.log('--- Personnel Records ---');
  const personnel = db.prepare('SELECT * FROM personnel').all();
  console.log(JSON.stringify(personnel, null, 2));

  console.log('\n--- Customers Records ---');
  const customers = db.prepare('SELECT * FROM customers LIMIT 5').all();
  console.log(JSON.stringify(customers, null, 2));

  console.log('\n--- Authorized Services ---');
  const authServices = db.prepare('SELECT * FROM authorized_services').all();
  console.log(JSON.stringify(authServices, null, 2));

} catch (err) {
  console.error('Error:', err);
}

process.exit();
