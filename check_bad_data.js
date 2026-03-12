const db = require('./db');

function checkDate(str) {
  if (!str) return true;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

try {
  const personnel = db.prepare('SELECT id, full_name, start_date, created_at FROM personnel').all();
  console.log('--- Personnel Date Check ---');
  personnel.forEach(p => {
    if (!checkDate(p.start_date)) console.log(`Personnel #${p.id} (${p.full_name}) has invalid start_date: "${p.start_date}"`);
    if (!checkDate(p.created_at)) console.log(`Personnel #${p.id} (${p.full_name}) has invalid created_at: "${p.created_at}"`);
  });

  const customers = db.prepare('SELECT id, full_name, created_at FROM customers').all();
  console.log('\n--- Customers Date Check ---');
  customers.forEach(c => {
    if (!checkDate(c.created_at)) console.log(`Customer #${c.id} (${c.full_name}) has invalid created_at: "${c.created_at}"`);
  });

  console.log('\nCheck complete.');
} catch (err) {
  console.error('Error:', err);
}

process.exit();
