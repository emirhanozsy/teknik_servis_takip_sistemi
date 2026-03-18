const db = require('./db');

console.log('Checking and creating missing tables...');

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS service_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_record_id INTEGER NOT NULL,
      personnel_id INTEGER,
      action_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_record_id) REFERENCES services(id) ON DELETE CASCADE,
      FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE SET NULL
    );
  `);
  console.log('service_actions table checked/created');
} catch (e) {
  console.error('Error creating service_actions:', e.message);
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS service_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_record_id INTEGER NOT NULL,
      personnel_id INTEGER,
      amount REAL NOT NULL,
      payment_method TEXT,
      payment_status TEXT DEFAULT 'Ödendi',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_record_id) REFERENCES services(id) ON DELETE CASCADE,
      FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE SET NULL
    );
  `);
  console.log('service_payments table checked/created');
} catch (e) {
  console.error('Error creating service_payments:', e.message);
}

// Columns check for services
const columns = db.prepare('PRAGMA table_info(services)').all().map(c => c.name);

const requiredColumns = [
  { name: 'is_locked', def: 'INTEGER DEFAULT 0' },
  { name: 'service_source', def: 'TEXT' },
  { name: 'service_vehicle', def: 'TEXT' }
];

requiredColumns.forEach(col => {
  if (!columns.includes(col.name)) {
    try {
      db.exec(`ALTER TABLE services ADD COLUMN ${col.name} ${col.def}`);
      console.log(`Column ${col.name} added to services`);
    } catch (e) {
      console.error(`Error adding column ${col.name}:`, e.message);
    }
  } else {
    console.log(`Column ${col.name} already exists in services`);
  }
});

console.log('Migration finished.');
process.exit(0);
