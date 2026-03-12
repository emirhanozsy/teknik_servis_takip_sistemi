const db = require('./db');
try {
  db.prepare('ALTER TABLE services ADD COLUMN service_vehicle TEXT').run();
  console.log('Column service_vehicle added successfully.');
} catch (err) {
  if (err.message.includes('duplicate column name')) {
    console.log('Column service_vehicle already exists.');
  } else {
    throw err;
  }
}
db.close();
