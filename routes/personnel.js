const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Get all personnel (filtered by service_id for non-admin)
router.get('/', requireAuth, (req, res) => {
  const user = req.session.user;
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
  } else {
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

// Create new personnel
router.post('/', requireAuth, (req, res) => {
  const user = req.session.user;
  const {
    full_name, start_date, position, phone, phone2,
    city, district, address, email, id_number,
    username, password
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

  const result = db.prepare(`
    INSERT INTO personnel (service_id, full_name, start_date, position, phone, phone2,
                           city, district, address, email, id_number, username, password_hash, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'user')
  `).run(serviceId, full_name, start_date, position, phone, phone2,
         city, district, address, email, id_number, username, hash);

  res.json({ success: true, id: result.lastInsertRowid });
});

// Delete personnel
router.delete('/:id', requireAuth, (req, res) => {
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
