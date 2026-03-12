const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const db = new Database(path.join(__dirname, 'database.sqlite'));

// VERIFICATION: Assign Customer ID 2 to Service ID 3
db.prepare('UPDATE customers SET service_id = 3 WHERE id = 2').run();
console.log('Verification: Assigned Customer ID 2 to Service ID 3');

let output = '';
output += '--- PERSONNEL ---\n';
db.prepare('SELECT id, full_name, username, role, service_id FROM personnel').all().forEach(p => {
    output += `ID: ${p.id}, Name: ${p.full_name}, User: ${p.username}, Role: ${p.role}, ServiceID: ${p.service_id}\n`;
});

output += '\n--- CUSTOMERS ---\n';
db.prepare('SELECT id, full_name, service_id FROM customers').all().forEach(c => {
    output += `ID: ${c.id}, Name: ${c.full_name}, ServiceID: ${c.service_id}\n`;
});

output += '\n--- AUTHORIZED SERVICES ---\n';
db.prepare('SELECT id, name FROM authorized_services').all().forEach(s => {
    output += `ID: ${s.id}, Name: ${s.name}\n`;
});

fs.writeFileSync('db_output.txt', output);
console.log('Results written to db_output.txt');
