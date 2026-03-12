const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'database.sqlite'));

const stages = [
  'AAA BEKLEMEDE',
  'Fiyat verildi',
  'Teknisyen Yönlendir',
  'Müşteriye Ulaşılamadı',
  'Adres Yanlış',
  'Atölyeye Aldır (Nakliye Gönder)',
  'Yerinde işlem Yapıldı',
  'Atölyeye Alındı',
  'Teslimata Hazır',
  'Atölyeye Tekrar Alındı',
  'Parçası Atölyeye Alındı',
  'Parça Gidecek',
  'Parça Bekleniyor',
  'Cihaz Tamir Edilemiyor',
  'Haber Verecek',
  'Farklı Teknisyen Yönlendir',
  'Tamamlandı',
  'Parça Depoda',
  'Müşteri İptal Etti',
  'Servisi Sonlandır',
  'İade Edildi'
];

// Get current service IDs
const services = db.prepare('SELECT id FROM authorized_services').all();

console.log('Clearing existing service stages...');
db.prepare('DELETE FROM service_stages').run();

console.log('Seeding service stages...');

const insert = db.prepare('INSERT INTO service_stages (service_id, name) VALUES (?, ?)');

const insertMany = db.transaction((serviceId, stageList) => {
  for (const stage of stageList) {
    insert.run(serviceId, stage);
  }
});

if (services.length === 0) {
  // If no services, seed for null or first available? 
  // better to seed for at least one if none exist or just skip.
  console.log('No authorized services found. Skipping seed for now.');
} else {
  for (const s of services) {
    insertMany(s.id, stages);
    console.log(`Seeded ${stages.length} stages for service ID: ${s.id}`);
  }
}

// Also seed for the first admin service if it exists
// (Actually the check above handles all registered services)

console.log('Seeding completed.');
process.exit(0);
