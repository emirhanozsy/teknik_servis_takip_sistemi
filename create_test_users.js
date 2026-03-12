const db = require('./db');
const bcrypt = require('bcryptjs');

async function create() {
  const hash = bcrypt.hashSync('test123', 10);
  
  // Get a valid service_id
  const service = db.prepare('SELECT id FROM authorized_services LIMIT 1').get();
  if (!service) {
    console.log('No service found. Please seed services first.');
    process.exit(1);
  }

  // Create test manager
  db.prepare(`
    INSERT OR REPLACE INTO personnel (full_name, username, password_hash, role, service_id, start_date)
    VALUES (?, ?, ?, ?, ?, date('now'))
  `).run('Test Yönetici', 'test_yönetici', hash, 'yönetici', service.id);
  
  // Create test personnel
  db.prepare(`
    INSERT OR REPLACE INTO personnel (full_name, username, password_hash, role, service_id, start_date)
    VALUES (?, ?, ?, ?, ?, date('now'))
  `).run('Test Personel', 'test_personel', hash, 'personel', service.id);

  console.log('Test users created with password: test123');
}

create().then(() => process.exit());
