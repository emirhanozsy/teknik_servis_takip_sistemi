const db = require('./db');
try {
  db.prepare('ALTER TABLE personnel ADD COLUMN profile_picture TEXT').run();
  console.log('Column profile_picture added to personnel table');
} catch (err) {
  if (err.message.includes('duplicate column name')) {
    console.log('Column profile_picture already exists');
  } else {
    console.error('Error adding column:', err);
  }
}
process.exit(0);
