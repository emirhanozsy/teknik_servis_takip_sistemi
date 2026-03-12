const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'database.sqlite'));

console.log('--- DATABASE MIGRATION START ---');

try {
  // Check if service_source column exists
  const info = db.prepare('PRAGMA table_info(services)').all();
  const hasSource = info.some(col => col.name === 'service_source');
  const hasVehicle = info.some(col => col.name === 'service_vehicle');

  if (!hasSource) {
    console.log('Adding service_source column to services table...');
    db.prepare('ALTER TABLE services ADD COLUMN service_source TEXT').run();
    console.log('service_source column added.');
  } else {
    console.log('service_source column already exists.');
  }

  if (!hasVehicle) {
    console.log('Adding service_vehicle column to services table...');
    db.prepare('ALTER TABLE services ADD COLUMN service_vehicle TEXT').run();
    console.log('service_vehicle column added.');
  } else {
    console.log('service_vehicle column already exists.');
  }

  console.log('--- DATABASE MIGRATION SUCCESSFUL ---');
} catch (error) {
  console.error('--- DATABASE MIGRATION FAILED ---');
  console.error(error);
  process.exit(1);
}
