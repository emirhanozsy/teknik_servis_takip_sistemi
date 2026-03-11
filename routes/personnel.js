const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth, requireManager, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Get all personnel (filtered by service_id for non-admin)
router.get('/', requireAuth, (req, res) => {
  const user = req.session.user;
  
  // Only admin and manager can see the full personnel list (others see nothing or restricted)
  if (user.role === 'personel') {
    return res.status(403).json({ error: 'Yetkiniz yok' });
  }

  let rows;
  if (user.role === 'admin') {
    rows = db.prepare(`
      SELECT p.id, p.service_id, p.full_name, p.start_date, p.position, p.phone, p.phone2,
             p.city, p.district, p.address, p.email, p.id_number, p.username, p.role, p.created_at,
             a.name as authorized_service_name
      FROM personnel p
      LEFT JOIN authorized_services a ON p.service_id = a.id
      ORDER BY p.created_at DESC
    `).all();
  } else { // Manager role
    rows = db.prepare(`
      SELECT p.id, p.service_id, p.full_name, p.start_date, p.position, p.phone, p.phone2,
             p.city, p.district, p.address, p.email, p.id_number, p.username, p.role, p.created_at,
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
router.post('/', requireManager, (req, res) => {
  const user = req.session.user;
  const {
    full_name, start_date, position, phone, phone2,
    city, district, address, email, id_number,
    username, password, role
  } = req.body;

  if (!full_name || !username || !password) {
    return res.status(400).json({ error: 'Ad, kullanıcı adı ve şifre gerekli' });
  }

  // Check if username already exists
  const existing = db.prepare('SELECT id FROM personnel WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
  }

  const serviceId = user.role === 'admin' ? (req.body.service_id || user.service_id) : user.service_id;
  const hash = bcrypt.hashSync(password, 10);
  
  // Manager can only create 'personel' or 'yönetici' in their own service.
  const finalRole = user.role === 'admin' ? (role || 'personel') : 'personel';

  const result = db.prepare(`
    INSERT INTO personnel (service_id, full_name, start_date, position, phone, phone2,
                           city, district, address, email, id_number, username, password_hash, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(serviceId, full_name, start_date, position, phone, phone2,
         city, district, address, email, id_number, username, hash, finalRole);

  res.json({ success: true, id: result.lastInsertRowid });
});

// Update personnel (Admin or Manager)
router.put('/:id', requireManager, (req, res) => {
  const user = req.session.user;
  const person = db.prepare('SELECT * FROM personnel WHERE id = ?').get(req.params.id);

  if (!person) {
    return res.status(404).json({ error: 'Personel bulunamadı' });
  }

  // Manager can only update personnel in their own service center
  if (user.role !== 'admin' && person.service_id !== user.service_id) {
    return res.status(403).json({ error: 'Yetkiniz yok' });
  }

  const {
    full_name, start_date, position, phone, phone2,
    city, district, address, email, id_number,
    username, password, role, service_id
  } = req.body;

  // Check username uniqueness if changed
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
      username = ?, role = ?, service_id = ?
  `;
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
    user.role === 'admin' ? (service_id !== undefined ? service_id : person.service_id) : person.service_id
  ];

  if (password) {
    query += `, password_hash = ?`;
    params.push(bcrypt.hashSync(password, 10));
  }

  query += ` WHERE id = ?`;
  params.push(req.params.id);

  db.prepare(query).run(...params);

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
