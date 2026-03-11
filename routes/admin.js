const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Get all authorized services
router.get('/authorized-services', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM authorized_services ORDER BY name').all();
  res.json(rows);
});

// Create authorized service
router.post('/authorized-services', requireAdmin, (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Servis adı gerekli' });
  }

  const existing = db.prepare('SELECT id FROM authorized_services WHERE name = ?').get(name);
  if (existing) {
    return res.status(400).json({ error: 'Bu servis adı zaten mevcut' });
  }

  const result = db.prepare('INSERT INTO authorized_services (name) VALUES (?)').run(name);
  res.json({ success: true, id: result.lastInsertRowid });
});

// Delete authorized service
router.delete('/authorized-services/:id', requireAdmin, (req, res) => {
  const service = db.prepare('SELECT * FROM authorized_services WHERE id = ?').get(req.params.id);
  if (!service) {
    return res.status(404).json({ error: 'Yetkili servis bulunamadı' });
  }

  db.prepare('DELETE FROM authorized_services WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Get all authorized services (for dropdowns in forms - accessible by all authenticated users)
router.get('/authorized-services-list', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
  }
  const rows = db.prepare('SELECT id, name FROM authorized_services ORDER BY name').all();
  res.json(rows);
});

module.exports = router;
