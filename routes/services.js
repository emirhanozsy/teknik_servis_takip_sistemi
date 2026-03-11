const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Get all services (filtered by service_id for non-admin)
router.get('/', requireAuth, (req, res) => {
  const user = req.session.user;
  let rows;

  if (user.role === 'admin') {
    rows = db.prepare(`
      SELECT s.*, c.full_name as customer_name, p.full_name as personnel_name,
             a.name as authorized_service_name
      FROM services s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN personnel p ON s.personnel_id = p.id
      LEFT JOIN authorized_services a ON s.service_id = a.id
      ORDER BY s.created_at DESC
    `).all();
  } else {
    rows = db.prepare(`
      SELECT s.*, c.full_name as customer_name, p.full_name as personnel_name,
             a.name as authorized_service_name
      FROM services s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN personnel p ON s.personnel_id = p.id
      LEFT JOIN authorized_services a ON s.service_id = a.id
      WHERE s.service_id = ?
      ORDER BY s.created_at DESC
    `).all(user.service_id);
  }

  res.json(rows);
});

// Create new service
router.post('/', requireAuth, (req, res) => {
  const user = req.session.user;
  const {
    customer_id, device_brand, device_type, device_model,
    device_fault, operator_note, warranty_period,
    availability_date, time_start, time_end,
    // customer fields for new customer
    customer_type, customer_name, phone, phone2,
    city, district, address, id_number
  } = req.body;

  const serviceId = user.role === 'admin' ? (req.body.assigned_service_id || user.service_id) : user.service_id;

  let customerId = customer_id;

  // If no existing customer selected, create new one
  if (!customerId && customer_name) {
    const result = db.prepare(`
      INSERT INTO customers (service_id, customer_type, full_name, phone, phone2, city, district, address, id_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(serviceId, customer_type || 'bireysel', customer_name, phone, phone2, city, district, address, id_number);
    customerId = result.lastInsertRowid;
  }

  const result = db.prepare(`
    INSERT INTO services (service_id, customer_id, personnel_id, device_brand, device_type, device_model,
                          device_fault, operator_note, warranty_period, availability_date, time_start, time_end)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(serviceId, customerId, user.id, device_brand, device_type, device_model,
         device_fault, operator_note, warranty_period, availability_date, time_start, time_end);

  res.json({ success: true, id: result.lastInsertRowid });
});

// Update service (status, assignment, etc.)
router.put('/:id', requireAuth, (req, res) => {
  const user = req.session.user;
  const serviceRecord = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);

  if (!serviceRecord) {
    return res.status(404).json({ error: 'Servis bulunamadı' });
  }

  // Non-admin can only update their own service center's records
  if (user.role !== 'admin' && serviceRecord.service_id !== user.service_id) {
    return res.status(403).json({ error: 'Yetkiniz yok' });
  }

  const { status, service_id: newServiceId } = req.body;

  if (status) {
    db.prepare('UPDATE services SET status = ? WHERE id = ?').run(status, req.params.id);
  }

  // Only admin can reassign service to different authorized service
  if (user.role === 'admin' && newServiceId) {
    db.prepare('UPDATE services SET service_id = ? WHERE id = ?').run(newServiceId, req.params.id);
  }

  res.json({ success: true });
});

// Delete service
router.delete('/:id', requireAuth, (req, res) => {
  const user = req.session.user;
  const serviceRecord = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);

  if (!serviceRecord) {
    return res.status(404).json({ error: 'Servis bulunamadı' });
  }

  if (user.role !== 'admin' && serviceRecord.service_id !== user.service_id) {
    return res.status(403).json({ error: 'Yetkiniz yok' });
  }

  db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
