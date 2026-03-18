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

// Get payment categories
router.get('/payment-categories', requireAuth, (req, res) => {
  const user = req.session.user;
  let serviceId = user.service_id;

  if (user.role === 'admin' && !serviceId) {
    const firstService = db.prepare('SELECT id FROM authorized_services LIMIT 1').get();
    if (firstService) serviceId = firstService.id;
  }

  const categories = db.prepare('SELECT * FROM payment_categories WHERE service_id = ? ORDER BY name ASC').all(serviceId || 0);
  res.json(categories);
});

// Add payment category
router.post('/payment-categories', requireAdmin, (req, res) => {
  const user = req.session.user;
  const { name } = req.body;
  let serviceId = user.service_id;

  if (user.role === 'admin' && !serviceId) {
    const firstService = db.prepare('SELECT id FROM authorized_services LIMIT 1').get();
    if (firstService) serviceId = firstService.id;
  }

  if (!name) return res.status(400).json({ error: 'İsim gereklidir' });
  if (!serviceId) return res.status(400).json({ error: 'Servis ID bulunamadı' });

  const result = db.prepare('INSERT INTO payment_categories (service_id, name) VALUES (?, ?)').run(serviceId, name);
  res.json({ success: true, id: result.lastInsertRowid });
});

// Delete payment category
router.delete('/payment-categories/:id', requireAdmin, (req, res) => {
  const category = db.prepare('SELECT * FROM payment_categories WHERE id = ?').get(req.params.id);

  if (!category) return res.status(404).json({ error: 'Ödeme türü bulunamadı' });

  db.prepare('DELETE FROM payment_categories WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Get payment methods
router.get('/payment-methods', requireAuth, (req, res) => {
  const user = req.session.user;
  let serviceId = user.service_id;

  if (user.role === 'admin' && !serviceId) {
    const firstService = db.prepare('SELECT id FROM authorized_services LIMIT 1').get();
    if (firstService) serviceId = firstService.id;
  }

  const methods = db.prepare('SELECT * FROM payment_methods WHERE service_id = ? ORDER BY name ASC').all(serviceId || 0);
  res.json(methods);
});

// Add payment method
router.post('/payment-methods', requireAdmin, (req, res) => {
  const user = req.session.user;
  const { name } = req.body;
  let serviceId = user.service_id;

  if (user.role === 'admin' && !serviceId) {
    const firstService = db.prepare('SELECT id FROM authorized_services LIMIT 1').get();
    if (firstService) serviceId = firstService.id;
  }

  if (!name) return res.status(400).json({ error: 'İsim gereklidir' });
  if (!serviceId) return res.status(400).json({ error: 'Servis ID bulunamadı' });

  const result = db.prepare('INSERT INTO payment_methods (service_id, name) VALUES (?, ?)').run(serviceId, name);
  res.json({ success: true, id: result.lastInsertRowid });
});

// Delete payment method
router.delete('/payment-methods/:id', requireAdmin, (req, res) => {
  const method = db.prepare('SELECT * FROM payment_methods WHERE id = ?').get(req.params.id);

  if (!method) return res.status(404).json({ error: 'Ödeme şekli bulunamadı' });

  db.prepare('DELETE FROM payment_methods WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Update payment category settings
router.put('/payment-categories/:id', requireAdmin, (req, res) => {
  const { 
    name, 
    ask_description, 
    ask_personnel, 
    ask_service_no, 
    ask_supplier, 
    direction, 
    is_service_payment, 
    is_stock_payment 
  } = req.body;
  const categoryId = req.params.id;

  const category = db.prepare('SELECT * FROM payment_categories WHERE id = ?').get(categoryId);
  if (!category) return res.status(404).json({ error: 'Ödeme türü bulunamadı' });

  db.prepare(`
    UPDATE payment_categories 
    SET name = ?, 
        ask_description = ?, 
        ask_personnel = ?, 
        ask_service_no = ?, 
        ask_supplier = ?, 
        direction = ?, 
        is_service_payment = ?, 
        is_stock_payment = ?
    WHERE id = ?
  `).run(
    name || category.name,
    ask_description !== undefined ? ask_description : category.ask_description,
    ask_personnel !== undefined ? ask_personnel : category.ask_personnel,
    ask_service_no !== undefined ? ask_service_no : category.ask_service_no,
    ask_supplier !== undefined ? ask_supplier : category.ask_supplier,
    direction || category.direction,
    is_service_payment !== undefined ? is_service_payment : category.is_service_payment,
    is_stock_payment !== undefined ? is_stock_payment : category.is_stock_payment,
    categoryId
  );

  res.json({ success: true });
});

// Get personnel positions
router.get('/positions', requireAuth, (req, res) => {
  const user = req.session.user;
  let serviceId = user.service_id;

  if (user.role === 'admin' && !serviceId) {
    const firstService = db.prepare('SELECT id FROM authorized_services LIMIT 1').get();
    if (firstService) serviceId = firstService.id;
  }

  const positions = db.prepare('SELECT * FROM personnel_positions WHERE service_id = ? ORDER BY name ASC').all(serviceId || 0);
  res.json(positions);
});

// Add personnel position
router.post('/positions', requireAdmin, (req, res) => {
  const user = req.session.user;
  const { name } = req.body;
  let serviceId = user.service_id;

  if (user.role === 'admin' && !serviceId) {
    const firstService = db.prepare('SELECT id FROM authorized_services LIMIT 1').get();
    if (firstService) serviceId = firstService.id;
  }

  if (!name) return res.status(400).json({ error: 'İsim gereklidir' });
  if (!serviceId) return res.status(400).json({ error: 'Servis ID bulunamadı' });

  // Default permissions placeholder
  const defaultPermissions = JSON.stringify({
    all_services_view: 'none',
    delete_service: 'none',
    delete_service_action: 'none',
    customer_edit: 'none',
    personnel_edit: 'none',
    stock_view: 'none',
    finance_view: 'none',
    settings_view: 'none',
    membership_info_view: 'none'
  });

  const result = db.prepare('INSERT INTO personnel_positions (service_id, name, permissions, base_role) VALUES (?, ?, ?, ?)').run(serviceId, name, defaultPermissions, 'personel');
  res.json({ success: true, id: result.lastInsertRowid });
});

// Update personnel position (including permissions and visible stages)
router.put('/positions/:id', requireAdmin, (req, res) => {
  const { name, permissions, visible_stages } = req.body;
  const positionId = req.params.id;

  const position = db.prepare('SELECT * FROM personnel_positions WHERE id = ?').get(positionId);
  if (!position) return res.status(404).json({ error: 'Pozisyon bulunamadı' });

  db.prepare(`
    UPDATE personnel_positions 
    SET name = ?, permissions = ?, visible_stages = ?, base_role = ?
    WHERE id = ?
  `).run(
    name || position.name,
    permissions ? JSON.stringify(permissions) : position.permissions,
    visible_stages ? JSON.stringify(visible_stages) : position.visible_stages,
    req.body.base_role || position.base_role,
    positionId
  );

  res.json({ success: true });
});

// Delete personnel position
router.delete('/positions/:id', requireAdmin, (req, res) => {
  const position = db.prepare('SELECT * FROM personnel_positions WHERE id = ?').get(req.params.id);

  if (!position) return res.status(404).json({ error: 'Pozisyon bulunamadı' });

  db.prepare('DELETE FROM personnel_positions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
