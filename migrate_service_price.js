const db = require('./db');
try {
  db.prepare('ALTER TABLE services ADD COLUMN price REAL DEFAULT 0').run();
  console.log('Column price added to services table');
} catch (err) {
  if (err.message.includes('duplicate column name')) {
    console.log('Column price already exists');
  } else {
    console.error('Error adding column:', err);
  }
}
process.exit(0);
