const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { requireAuth, requireManager, requireAdmin } = require('../middleware/auth');
const router = express.Router();

try { fs.appendFileSync('c:\\Users\\parad\\OneDrive\\Desktop\\Projeler\\website\\bambam_proje\\debug.log', `[${new Date().toISOString()}] personnel.js loaded\n`); } catch(e) {}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/personnel');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'personnel-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir!'), false);
    }
  },
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// Get all personnel (filtered by service_id for non-admin)
router.get('/', requireAuth, (req, res) => {
  const user = req.session.user;
  
  if (user.role === 'personel') {
    return res.status(403).json({ error: 'Yetkiniz yok' });
  }

  let rows;
  if (user.role === 'admin') {
    rows = db.prepare(`
      SELECT p.id, p.service_id, p.full_name, p.start_date, p.position, p.phone, p.phone2,
             p.city, p.district, p.address, p.email, p.id_number, p.username, p.role, p.created_at,
             p.profile_picture,
             a.name as authorized_service_name
      FROM personnel p
      LEFT JOIN authorized_services a ON p.service_id = a.id
      ORDER BY p.created_at DESC
    `).all();
  } else { // Manager role
    rows = db.prepare(`
      SELECT p.id, p.service_id, p.full_name, p.start_date, p.position, p.phone, p.phone2,
             p.city, p.district, p.address, p.email, p.id_number, p.username, p.role, p.created_at,
             p.profile_picture,
             a.name as authorized_service_name
      FROM personnel p
      LEFT JOIN authorized_services a ON p.service_id = a.id
      WHERE p.service_id = ?
      ORDER BY p.created_at DESC
    `).all(user.service_id);
  }

  res.json(rows);
});


// Create new personnel (Admin or Manager)
router.post('/', requireManager, (req, res, next) => {
  const logMsg = `[${new Date().toISOString()}] Headers: ${JSON.stringify(req.headers)}\n`;
  try { fs.appendFileSync('c:\\Users\\parad\\OneDrive\\Desktop\\Projeler\\website\\bambam_proje\\debug.log', logMsg); } catch(e) {}
  next();
}, upload.single('profile_picture'), (req, res) => {
  const logMsg = `[${new Date().toISOString()}] POST /api/personnel\nBody: ${JSON.stringify(req.body)}\nFile: ${JSON.stringify(req.file)}\n\n`;
  try { fs.appendFileSync('c:\\Users\\parad\\OneDrive\\Desktop\\Projeler\\website\\bambam_proje\\debug.log', logMsg); } catch(e) {}
  console.log('POST /api/personnel - body:', req.body);
  console.log('POST /api/personnel - file:', req.file);
  const user = req.session.user;
  const {
    full_name, start_date, position, phone, phone2,
    city, district, address, email, id_number,
    username, password, role
  } = req.body;

  if (!full_name || !username || !password) {
    return res.status(400).json({ error: 'Ad, kullanıcı adı ve şifre gerekli' });
  }

  const existing = db.prepare('SELECT id FROM personnel WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
  }

  const serviceId = user.role === 'admin' ? (req.body.service_id || user.service_id) : user.service_id;
  const hash = bcrypt.hashSync(password, 10);
  const finalRole = user.role === 'admin' ? (role || 'personel') : 'personel';
  const profilePicture = req.file ? `/uploads/personnel/${req.file.filename}` : null;

  const result = db.prepare(`
    INSERT INTO personnel (service_id, full_name, start_date, position, phone, phone2,
                           city, district, address, email, id_number, username, password_hash, role, profile_picture)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(serviceId, full_name, start_date, position, phone, phone2,
         city, district, address, email, id_number, username, hash, finalRole, profilePicture);

  res.json({ success: true, id: result.lastInsertRowid });
});

// Update personnel (Admin or Manager)
router.put('/:id', requireManager, upload.single('profile_picture'), (req, res) => {
  const user = req.session.user;
  const person = db.prepare('SELECT * FROM personnel WHERE id = ?').get(req.params.id);

  if (!person) {
    return res.status(404).json({ error: 'Personel bulunamadı' });
  }

  if (user.role !== 'admin' && person.service_id !== user.service_id) {
    return res.status(403).json({ error: 'Yetkiniz yok' });
  }

  const {
    full_name, start_date, position, phone, phone2,
    city, district, address, email, id_number,
    username, password, role, service_id
  } = req.body;

  if (username && username !== person.username) {
    const existing = db.prepare('SELECT id FROM personnel WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
    }
  }

  let query = `
    UPDATE personnel SET 
      full_name = ?, start_date = ?, position = ?, phone = ?, phone2 = ?,
      city = ?, district = ?, address = ?, email = ?, id_number = ?,
      username = ?, role = ?, service_id = ?, profile_picture = ?
  `;
  const profilePicture = req.file ? `/uploads/personnel/${req.file.filename}` : person.profile_picture;
  
  const params = [
    full_name || person.full_name,
    start_date !== undefined ? start_date : person.start_date,
    position !== undefined ? position : person.position,
    phone !== undefined ? phone : person.phone,
    phone2 !== undefined ? phone2 : person.phone2,
    city !== undefined ? city : person.city,
    district !== undefined ? district : person.district,
    address !== undefined ? address : person.address,
    email !== undefined ? email : person.email,
    id_number !== undefined ? id_number : person.id_number,
    username || person.username,
    user.role === 'admin' ? (role || person.role) : person.role,
    user.role === 'admin' ? (service_id !== undefined ? service_id : person.service_id) : person.service_id,
    profilePicture
  ];

  if (password) {
    query += `, password_hash = ?`;
    params.push(bcrypt.hashSync(password, 10));
  }

  query += ` WHERE id = ?`;
  params.push(req.params.id);

  db.prepare(query).run(...params);

  // Update session if editing self
  if (parseInt(req.params.id) === user.id) {
    req.session.user.full_name = full_name || person.full_name;
    req.session.user.username = username || person.username;
    req.session.user.profile_picture = profilePicture;
    if (role && user.role === 'admin') req.session.user.role = role;
  }

  res.json({ success: true });
});

// Delete personnel
router.delete('/:id', requireManager, (req, res) => {
  const user = req.session.user;
  const person = db.prepare('SELECT * FROM personnel WHERE id = ?').get(req.params.id);

  if (!person) {
    return res.status(404).json({ error: 'Personel bulunamadı' });
  }

  if (person.role === 'admin') {
    return res.status(403).json({ error: 'Admin hesabı silinemez' });
  }

  if (user.role !== 'admin' && person.service_id !== user.service_id) {
    return res.status(403).json({ error: 'Yetkiniz yok' });
  }

  db.prepare('DELETE FROM personnel WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
