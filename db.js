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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES authorized_services(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE SET NULL
  );
`);

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
