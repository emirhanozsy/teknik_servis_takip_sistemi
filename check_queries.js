const db = require('./db');

try {
  console.log('Testing Personnel query...');
  const personnel = db.prepare(`
    SELECT p.id, p.service_id, p.full_name, p.start_date, p.position, p.phone, p.phone2,
           p.city, p.district, p.address, p.email, p.id_number, p.username, p.role, p.created_at,
           p.profile_picture,
           a.name as authorized_service_name
    FROM personnel p
    LEFT JOIN authorized_services a ON p.service_id = a.id
    ORDER BY p.created_at DESC
  `).all();
  console.log('Personnel query success, count:', personnel.length);

  console.log('Testing Customers query...');
  const customers = db.prepare(`
    SELECT c.*, a.name as authorized_service_name
    FROM customers c
    LEFT JOIN authorized_services a ON c.service_id = a.id
    ORDER BY c.created_at DESC
  `).all();
  console.log('Customers query success, count:', customers.length);

  console.log('Testing Services query...');
  const services = db.prepare(`
    SELECT s.*, c.full_name as customer_name, p.full_name as personnel_name,
           a.name as authorized_service_name
    FROM services s
    LEFT JOIN customers c ON s.customer_id = c.id
    LEFT JOIN personnel p ON s.personnel_id = p.id
    LEFT JOIN authorized_services a ON s.service_id = a.id
    ORDER BY s.created_at DESC
  `).all();
  console.log('Services query success, count:', services.length);

} catch (err) {
  console.error('Query Error:', err);
}

process.exit();
