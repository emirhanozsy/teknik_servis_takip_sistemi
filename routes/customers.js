const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Get all customers (filtered by service_id for non-admin)
router.get('/', requireAuth, (req, res) => {
  const user = req.session.user;
  let rows;

  if (user.role === 'admin') {
    rows = db.prepare(`
      SELECT c.*, a.name as authorized_service_name
      FROM customers c
      LEFT JOIN authorized_services a ON c.service_id = a.id
      ORDER BY c.created_at DESC
    `).all();
  } else {
    rows = db.prepare(`
      SELECT c.*, a.name as authorized_service_name
      FROM customers c
      LEFT JOIN authorized_services a ON c.service_id = a.id
      WHERE c.service_id = ?
      ORDER BY c.created_at DESC
    `).all(user.service_id);
  }

  res.json(rows);
});

// Search customers (autocomplete)
router.get('/search', requireAuth, (req, res) => {
  const user = req.session.user;
  const q = req.query.q || '';
  if (q.length < 2) return res.json([]);

  let rows;
  if (user.role === 'admin') {
    rows = db.prepare(`
      SELECT * FROM customers WHERE full_name LIKE ? ORDER BY full_name LIMIT 10
    `).all(`%${q}%`);
  } else {
    rows = db.prepare(`
      SELECT * FROM customers WHERE full_name LIKE ? AND service_id = ? ORDER BY full_name LIMIT 10
    `).all(`%${q}%`, user.service_id);
  }

  res.json(rows);
});

// Create new customer
router.post('/', requireAuth, (req, res) => {
  const user = req.session.user;
  const { customer_type, full_name, phone, phone2, city, district, address, id_number } = req.body;

  if (!full_name) {
    return res.status(400).json({ error: 'Müşteri adı gerekli' });
  }

  const serviceId = user.role === 'admin' ? (req.body.service_id || user.service_id) : user.service_id;

  const result = db.prepare(`
    INSERT INTO customers (service_id, customer_type, full_name, phone, phone2, city, district, address, id_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(serviceId, customer_type || 'bireysel', full_name, phone, phone2, city, district, address, id_number);

  res.json({ success: true, id: result.lastInsertRowid });
});

// Delete customer
router.delete('/:id', requireAuth, (req, res) => {
  const user = req.session.user;
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);

  if (!customer) {
    return res.status(404).json({ error: 'Müşteri bulunamadı' });
  }

  if (user.role !== 'admin' && customer.service_id !== user.service_id) {
    return res.status(403).json({ error: 'Yetkiniz yok' });
  }

  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
