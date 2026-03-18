const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.sqlite'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS authorized_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS personnel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER,
    full_name TEXT NOT NULL,
    start_date TEXT,
    position TEXT,
    phone TEXT,
    phone2 TEXT,
    city TEXT,
    district TEXT,
    address TEXT,
    email TEXT,
    id_number TEXT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    title TEXT,
    profile_picture TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES authorized_services(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER,
    customer_type TEXT DEFAULT 'bireysel',
    full_name TEXT NOT NULL,
    phone TEXT,
    phone2 TEXT,
    city TEXT,
    district TEXT,
    address TEXT,
    id_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES authorized_services(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER,
    customer_id INTEGER,
    personnel_id INTEGER,
    device_brand TEXT,
    device_type TEXT,
    device_model TEXT,
    device_fault TEXT,
    operator_note TEXT,
    warranty_period TEXT,
    availability_date TEXT,
    time_start TEXT,
    time_end TEXT,
    status TEXT DEFAULT 'Beklemede',
    service_source TEXT,
    service_vehicle TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES authorized_services(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS device_brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES authorized_services(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS device_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES authorized_services(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS service_stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES authorized_services(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS service_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES authorized_services(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS service_vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES authorized_services(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS personnel_positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES authorized_services(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS service_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_record_id INTEGER NOT NULL,
    personnel_id INTEGER,
    action_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_record_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE SET NULL
  );

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

  CREATE TABLE IF NOT EXISTS payment_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES authorized_services(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES authorized_services(id) ON DELETE CASCADE
  );
`);

// Seed payment categories if none exist
const firstService = db.prepare('SELECT id FROM authorized_services LIMIT 1').get();
const serviceId = firstService ? firstService.id : null;

if (serviceId) {
  const catExists = db.prepare('SELECT id FROM payment_categories LIMIT 1').get();
  if (!catExists) {
    const categories = [
      'Ürün / Hizmet Alımı',
      'Maaş Ödemesi',
      'Ofis Gideri',
      'Kira Ödemesi',
      'Diğer',
      'Servis İşlemleri'
    ];
    const stmt = db.prepare('INSERT INTO payment_categories (service_id, name) VALUES (?, ?)');
    categories.forEach(name => stmt.run(serviceId, name));
    console.log('Başlangıç ödeme türleri eklendi.');
  }

  const methodExists = db.prepare('SELECT id FROM payment_methods LIMIT 1').get();
  if (!methodExists) {
    const methods = [
      'Nakit',
      'EFT / Havale',
      'Kredi Kartı',
      'Çek',
      'Senet',
      'Diğer'
    ];
    const stmt = db.prepare('INSERT INTO payment_methods (service_id, name) VALUES (?, ?)');
    methods.forEach(name => stmt.run(serviceId, name));
    console.log('Başlangıç ödeme şekilleri eklendi.');
  }
}

const payCatColumns = db.prepare('PRAGMA table_info(payment_categories)').all().map(c => c.name);
if (!payCatColumns.includes('ask_description')) db.exec('ALTER TABLE payment_categories ADD COLUMN ask_description INTEGER DEFAULT 1');
if (!payCatColumns.includes('ask_personnel')) db.exec('ALTER TABLE payment_categories ADD COLUMN ask_personnel INTEGER DEFAULT 0');
if (!payCatColumns.includes('ask_service_no')) db.exec('ALTER TABLE payment_categories ADD COLUMN ask_service_no INTEGER DEFAULT 0');
if (!payCatColumns.includes('ask_supplier')) db.exec('ALTER TABLE payment_categories ADD COLUMN ask_supplier INTEGER DEFAULT 0');
if (!payCatColumns.includes('direction')) db.exec('ALTER TABLE payment_categories ADD COLUMN direction TEXT DEFAULT \'out\'');
if (!payCatColumns.includes('is_service_payment')) db.exec('ALTER TABLE payment_categories ADD COLUMN is_service_payment INTEGER DEFAULT 0');
if (!payCatColumns.includes('is_stock_payment')) db.exec('ALTER TABLE payment_categories ADD COLUMN is_stock_payment INTEGER DEFAULT 0');

// Add missing columns to services if they don't exist
const serviceColumns = db.prepare('PRAGMA table_info(services)').all().map(c => c.name);
if (!serviceColumns.includes('is_locked')) db.exec('ALTER TABLE services ADD COLUMN is_locked INTEGER DEFAULT 0');
if (!serviceColumns.includes('service_source')) db.exec('ALTER TABLE services ADD COLUMN service_source TEXT');
if (!serviceColumns.includes('service_vehicle')) db.exec('ALTER TABLE services ADD COLUMN service_vehicle TEXT');

const personnelColumns = db.prepare('PRAGMA table_info(personnel)').all().map(c => c.name);
if (!personnelColumns.includes('title')) db.exec('ALTER TABLE personnel ADD COLUMN title TEXT');

// Add missing columns to personnel_positions if they don't exist
const posColumns = db.prepare('PRAGMA table_info(personnel_positions)').all().map(c => c.name);
if (!posColumns.includes('permissions')) db.exec('ALTER TABLE personnel_positions ADD COLUMN permissions TEXT');
if (!posColumns.includes('visible_stages')) db.exec('ALTER TABLE personnel_positions ADD COLUMN visible_stages TEXT');
if (!posColumns.includes('base_role')) db.exec('ALTER TABLE personnel_positions ADD COLUMN base_role TEXT DEFAULT \'personel\'');

// Seed admin account if not exists
const adminExists = db.prepare('SELECT id FROM personnel WHERE username = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO personnel (full_name, username, password_hash, role, position, start_date)
    VALUES (?, ?, ?, ?, ?, date('now'))
  `).run('Sistem Yöneticisi', 'admin', hash, 'admin', 'Administrator');
  console.log('Admin hesabı oluşturuldu: admin / admin123');
}

module.exports = db;
