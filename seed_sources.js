const Database = require('better-sqlite3');
const path = require('path');

const db = require('./db');

const sources = [
  '06 Mobilya Y. Eskidji',
  'Arzum Koltuk',
  'ASSOS KOLTUK',
  'Bellina Koltuk',
  'Beser Mobilya',
  'Elizan Home',
  'Evkur Genel Merkez',
  'Hanedan Mobilya',
  'Kadir Saglam',
  'KoltuXpress',
  'Özde koltuk sivas',
  'Özsahin Mobilya Y. Eskiidji',
  'Sanklass'
];

// Get current service IDs
const services = db.prepare('SELECT id FROM authorized_services').all();

console.log('Clearing existing service sources...');
db.prepare('DELETE FROM service_sources').run();

console.log('Seeding service sources...');

const insert = db.prepare('INSERT INTO service_sources (service_id, name) VALUES (?, ?)');

const insertMany = db.transaction((serviceId, sourceList) => {
  for (const source of sourceList) {
    insert.run(serviceId, source);
  }
});

for (const service of services) {
  console.log(`Seeding ${sources.length} sources for service ID: ${service.id}`);
  insertMany(service.id, sources);
}

// Also seed for a default ID 1 if no services exist or just to be safe for global admin view
if (services.length === 0) {
    console.log('No services found. Seeding for default service ID: 1');
    insertMany(1, sources);
}

console.log('Seeding completed.');
db.close();
