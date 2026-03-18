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
             p.profile_picture, p.title,
             a.name as authorized_service_name
      FROM personnel p
      LEFT JOIN authorized_services a ON p.service_id = a.id
      ORDER BY p.created_at DESC
    `).all();
  } else { // Manager role
    rows = db.prepare(`
      SELECT p.id, p.service_id, p.full_name, p.start_date, p.position, p.phone, p.phone2,
             p.city, p.district, p.address, p.email, p.id_number, p.username, p.role, p.created_at,
             p.profile_picture, p.title,
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
    username, password, role, title
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

  db.prepare(`
    INSERT INTO personnel (
      service_id, full_name, start_date, position, title, phone, phone2,
      city, district, address, email, id_number, username, password_hash, role, profile_picture
    ) VALUES (
      @service_id, @full_name, @start_date, @position, @title, @phone, @phone2,
      @city, @district, @address, @email, @id_number, @username, @password_hash, @role, @profile_picture
    )
  `).run({
    service_id: serviceId ? Number(serviceId) : null,
    full_name: full_name ? String(full_name) : null,
    start_date: start_date ? String(start_date) : null,
    position: position ? String(position) : null,
    title: title ? String(title) : null,
    phone: phone ? String(phone) : null,
    phone2: phone2 ? String(phone2) : null,
    city: city ? String(city) : null,
    district: district ? String(district) : null,
    address: address ? String(address) : null,
    email: email ? String(email) : null,
    id_number: id_number ? String(id_number) : null,
    username: username ? String(username) : null,
    password_hash: hash ? String(hash) : null,
    role: finalRole ? String(finalRole) : 'personel',
    profile_picture: profilePicture ? String(profilePicture) : null
  });

  res.json({ success: true });
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
    username, password, role, service_id, title
  } = req.body;

  if (username && username !== person.username) {
    const existing = db.prepare('SELECT id FROM personnel WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
    }
  }

  const updateParams = {
    full_name: (full_name || person.full_name) ? String(full_name || person.full_name) : null,
    start_date: (start_date !== undefined ? start_date : person.start_date) ? String(start_date !== undefined ? start_date : person.start_date) : null,
    position: (position !== undefined ? position : person.position) ? String(position !== undefined ? position : person.position) : null,
    title: (title !== undefined ? title : person.title) ? String(title !== undefined ? title : person.title) : null,
    phone: (phone !== undefined ? phone : person.phone) ? String(phone !== undefined ? phone : person.phone) : null,
    phone2: (phone2 !== undefined ? phone2 : person.phone2) ? String(phone2 !== undefined ? phone2 : person.phone2) : null,
    city: (city !== undefined ? city : person.city) ? String(city !== undefined ? city : person.city) : null,
    district: (district !== undefined ? district : person.district) ? String(district !== undefined ? district : person.district) : null,
    address: (address !== undefined ? address : person.address) ? String(address !== undefined ? address : person.address) : null,
    email: (email !== undefined ? email : person.email) ? String(email !== undefined ? email : person.email) : null,
    id_number: (id_number !== undefined ? id_number : person.id_number) ? String(id_number !== undefined ? id_number : person.id_number) : null,
    username: (username || person.username) ? String(username || person.username) : null,
    role: (user.role === 'admin' ? (role || person.role) : person.role) ? String(user.role === 'admin' ? (role || person.role) : person.role) : 'personel',
    service_id: (user.role === 'admin' ? (service_id !== undefined ? service_id : person.service_id) : person.service_id) ? Number(user.role === 'admin' ? (service_id !== undefined ? service_id : person.service_id) : person.service_id) : null,
    profile_picture: (req.file ? `/uploads/personnel/${req.file.filename}` : person.profile_picture) ? String(req.file ? `/uploads/personnel/${req.file.filename}` : person.profile_picture) : null,
    id: req.params.id ? Number(req.params.id) : null
  };

  let query = `
    UPDATE personnel SET 
      full_name = @full_name, start_date = @start_date, position = @position, title = @title, 
      phone = @phone, phone2 = @phone2, city = @city, district = @district, address = @address, 
      email = @email, id_number = @id_number, username = @username, role = @role, 
      service_id = @service_id, profile_picture = @profile_picture
  `;

  if (password) {
    query += `, password_hash = @password_hash`;
    updateParams.password_hash = bcrypt.hashSync(password, 10);
  }

  query += ` WHERE id = @id`;

  db.prepare(query).run(updateParams);

  // Update session if editing self
  if (parseInt(req.params.id) === user.id) {
    req.session.user.full_name = updateParams.full_name;
    req.session.user.username = updateParams.username;
    req.session.user.profile_picture = updateParams.profile_picture;
    req.session.user.title = updateParams.title;
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
