const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin, requireManager } = require('../middleware/auth');
const router = express.Router();

// Get brands
router.get('/brands', requireAuth, (req, res) => {
  const user = req.session.user;
  let serviceId = user.service_id;
  
  if (user.role === 'admin' && !serviceId) {
    const firstService = db.prepare('SELECT id FROM authorized_services LIMIT 1').get();
    if (firstService) serviceId = firstService.id;
  }

  const brands = db.prepare('SELECT * FROM device_brands WHERE service_id = ? ORDER BY name ASC').all(serviceId || 0);
  res.json(brands);
});

// Add brand
router.post('/brands', requireAdmin, (req, res) => {
  const user = req.session.user;
  const { name } = req.body;
  let serviceId = user.service_id;

  if (user.role === 'admin' && !serviceId) {
    const firstService = db.prepare('SELECT id FROM authorized_services LIMIT 1').get();
    if (firstService) serviceId = firstService.id;
  }

  if (!name) return res.status(400).json({ error: 'İsim gereklidir' });
  if (!serviceId) return res.status(400).json({ error: 'Servis ID bulunamadı' });

  const result = db.prepare('INSERT INTO device_brands (service_id, name) VALUES (?, ?)').run(serviceId, name);
  res.json({ success: true, id: result.lastInsertRowid });
});

// Delete brand
router.delete('/brands/:id', requireAdmin, (req, res) => {
  const brand = db.prepare('SELECT * FROM device_brands WHERE id = ?').get(req.params.id);

  if (!brand) return res.status(404).json({ error: 'Marka bulunamadı' });

  db.prepare('DELETE FROM device_brands WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Get types
router.get('/types', requireAuth, (req, res) => {
  const user = req.session.user;
  let serviceId = user.service_id;

  if (user.role === 'admin' && !serviceId) {
    const firstService = db.prepare('SELECT id FROM authorized_services LIMIT 1').get();
    if (firstService) serviceId = firstService.id;
  }

  const types = db.prepare('SELECT * FROM device_types WHERE service_id = ? ORDER BY name ASC').all(serviceId || 0);
  res.json(types);
});

// Add type
router.post('/types', requireAdmin, (req, res) => {
  const user = req.session.user;
  const { name } = req.body;
  let serviceId = user.service_id;

  if (user.role === 'admin' && !serviceId) {
    const firstService = db.prepare('SELECT id FROM authorized_services LIMIT 1').get();
    if (firstService) serviceId = firstService.id;
  }

  if (!name) return res.status(400).json({ error: 'İsim gereklidir' });
  if (!serviceId) return res.status(400).json({ error: 'Servis ID bulunamadı' });

  const result = db.prepare('INSERT INTO device_types (service_id, name) VALUES (?, ?)').run(serviceId, name);
  res.json({ success: true, id: result.lastInsertRowid });
});

// Delete type
router.delete('/types/:id', requireAdmin, (req, res) => {
  const type = db.prepare('SELECT * FROM device_types WHERE id = ?').get(req.params.id);

  if (!type) return res.status(404).json({ error: 'Tür bulunamadı' });

  db.prepare('DELETE FROM device_types WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Get service stages
router.get('/stages', requireAuth, (req, res) => {
  const user = req.session.user;
  let serviceId = user.service_id;

  if (user.role === 'admin' && !serviceId) {
    const firstService = db.prepare('SELECT id FROM authorized_services LIMIT 1').get();
    if (firstService) serviceId = firstService.id;
  }

  const stages = db.prepare('SELECT * FROM service_stages WHERE service_id = ? ORDER BY name ASC').all(serviceId || 0);
  res.json(stages);
});

// Add service stage
router.post('/stages', requireAdmin, (req, res) => {
  const user = req.session.user;
  const { name } = req.body;
  let serviceId = user.service_id;

  if (user.role === 'admin' && !serviceId) {
    const firstService = db.prepare('SELECT id FROM authorized_services LIMIT 1').get();
    if (firstService) serviceId = firstService.id;
  }

  if (!name) return res.status(400).json({ error: 'İsim gereklidir' });
  if (!serviceId) return res.status(400).json({ error: 'Servis ID bulunamadı' });

  const result = db.prepare('INSERT INTO service_stages (service_id, name) VALUES (?, ?)').run(serviceId, name);
  res.json({ success: true, id: result.lastInsertRowid });
});

// Delete service stage
router.delete('/stages/:id', requireAdmin, (req, res) => {
  const stage = db.prepare('SELECT * FROM service_stages WHERE id = ?').get(req.params.id);

  if (!stage) return res.status(404).json({ error: 'Aşama bulunamadı' });

  db.prepare('DELETE FROM service_stages WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Get service sources
router.get('/sources', requireAuth, (req, res) => {
  const user = req.session.user;
  let serviceId = user.service_id;

  if (user.role === 'admin' && !serviceId) {
    const firstService = db.prepare('SELECT id FROM authorized_services LIMIT 1').get();
    if (firstService) serviceId = firstService.id;
  }

  const sources = db.prepare('SELECT * FROM service_sources WHERE service_id = ? ORDER BY name ASC').all(serviceId || 0);
  res.json(sources);
});

// Add service source
router.post('/sources', requireAdmin, (req, res) => {
  const user = req.session.user;
  const { name } = req.body;
  let serviceId = user.service_id;

  if (user.role === 'admin' && !serviceId) {
    const firstService = db.prepare('SELECT id FROM authorized_services LIMIT 1').get();
    if (firstService) serviceId = firstService.id;
  }

  if (!name) return res.status(400).json({ error: 'İsim gereklidir' });
  if (!serviceId) return res.status(400).json({ error: 'Servis ID bulunamadı' });

  const result = db.prepare('INSERT INTO service_sources (service_id, name) VALUES (?, ?)').run(serviceId, name);
  res.json({ success: true, id: result.lastInsertRowid });
});

// Delete service source
router.delete('/sources/:id', requireAdmin, (req, res) => {
  const source = db.prepare('SELECT * FROM service_sources WHERE id = ?').get(req.params.id);

  if (!source) return res.status(404).json({ error: 'Kaynak bulunamadı' });

  db.prepare('DELETE FROM service_sources WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Get service vehicles
router.get('/vehicles', requireAuth, (req, res) => {
  const user = req.session.user;
  let serviceId = user.service_id;

  if (user.role === 'admin' && !serviceId) {
    const firstService = db.prepare('SELECT id FROM authorized_services LIMIT 1').get();
    if (firstService) serviceId = firstService.id;
  }

  const vehicles = db.prepare('SELECT * FROM service_vehicles WHERE service_id = ? ORDER BY name ASC').all(serviceId || 0);
  res.json(vehicles);
});

// Add service vehicle
router.post('/vehicles', requireManager, (req, res) => {
  const user = req.session.user;
  const { name } = req.body;
  let serviceId = user.service_id;

  // The middleware (requireManager) should ensure serviceId is set for the user's context.
  // If an admin can operate without a serviceId, the middleware should handle assigning a default.
  // This block is removed as per "Clean up redundant internal checks" instruction,
  // assuming the middleware or prior logic ensures serviceId is valid for the operation.
  if (user.role === 'admin' && !serviceId) {
    const firstService = db.prepare('SELECT id FROM authorized_services LIMIT 1').get();
    if (firstService) serviceId = firstService.id;
  }

  if (!name) return res.status(400).json({ error: 'İsim gereklidir' });
  if (!serviceId) return res.status(400).json({ error: 'Servis ID bulunamadı' });

  const result = db.prepare('INSERT INTO service_vehicles (service_id, name) VALUES (?, ?)').run(serviceId, name);
  res.json({ success: true, id: result.lastInsertRowid });
});

// Delete service vehicle
router.delete('/vehicles/:id', requireManager, (req, res) => {
  const vehicle = db.prepare('SELECT * FROM service_vehicles WHERE id = ?').get(req.params.id);

  if (!vehicle) return res.status(404).json({ error: 'Araç bulunamadı' });

  db.prepare('DELETE FROM service_vehicles WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
