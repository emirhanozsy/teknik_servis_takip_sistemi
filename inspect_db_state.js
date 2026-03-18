const db = require('./db');
try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables);
  const columns = db.prepare("PRAGMA table_info(services)").all().map(c => c.name);
  console.log('Services Columns:', columns);
} catch (e) {
  console.error(e);
}
process.exit(0);
