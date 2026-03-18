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
    availability_date, time_start, time_end, status, service_source, service_vehicle,
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
                          device_fault, operator_note, warranty_period, availability_date, time_start, time_end, status, service_source, service_vehicle)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(serviceId, customerId, user.id, device_brand, device_type, device_model,
         device_fault, operator_note, warranty_period, availability_date, time_start, time_end, status || 'Beklemede', service_source, service_vehicle);

  res.json({ success: true, id: result.lastInsertRowid });
});

// Update service (status, details, etc.)
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

  // Permissions: Admin can update everything. Manager can update everything in their service. Staff only status.
  if (user.role === 'admin') {
    // Admin can update everything
    const {
      service_id, device_brand, device_type, device_model,
      device_fault, operator_note, warranty_period,
      availability_date, time_start, time_end, status,
      service_source, service_vehicle
    } = req.body;

    db.prepare(`
      UPDATE services SET 
        service_id = ?, device_brand = ?, device_type = ?, device_model = ?,
        device_fault = ?, operator_note = ?, warranty_period = ?, 
        availability_date = ?, time_start = ?, time_end = ?, status = ?, service_source = ?, service_vehicle = ?
      WHERE id = ?
    `).run(
      service_id || serviceRecord.service_id,
      device_brand !== undefined ? device_brand : serviceRecord.device_brand,
      device_type !== undefined ? device_type : serviceRecord.device_type,
      device_model !== undefined ? device_model : serviceRecord.device_model,
      device_fault !== undefined ? device_fault : serviceRecord.device_fault,
      operator_note !== undefined ? operator_note : serviceRecord.operator_note,
      warranty_period !== undefined ? warranty_period : serviceRecord.warranty_period,
      availability_date !== undefined ? availability_date : serviceRecord.availability_date,
      time_start !== undefined ? time_start : serviceRecord.time_start,
      time_end !== undefined ? time_end : serviceRecord.time_end,
      status || serviceRecord.status,
      service_source !== undefined ? service_source : serviceRecord.service_source,
      service_vehicle !== undefined ? service_vehicle : serviceRecord.service_vehicle,
      req.params.id
    );
  } else if (user.role === 'yönetici') {
    // Manager can update all details for their own service
    const {
      device_brand, device_type, device_model,
      device_fault, operator_note, warranty_period,
      availability_date, time_start, time_end, status,
      service_source, service_vehicle
    } = req.body;

    db.prepare(`
      UPDATE services SET 
        device_brand = ?, device_type = ?, device_model = ?,
        device_fault = ?, operator_note = ?, warranty_period = ?, 
        availability_date = ?, time_start = ?, time_end = ?, status = ?, service_source = ?, service_vehicle = ?
      WHERE id = ?
    `).run(
      device_brand !== undefined ? device_brand : serviceRecord.device_brand,
      device_type !== undefined ? device_type : serviceRecord.device_type,
      device_model !== undefined ? device_model : serviceRecord.device_model,
      device_fault !== undefined ? device_fault : serviceRecord.device_fault,
      operator_note !== undefined ? operator_note : serviceRecord.operator_note,
      warranty_period !== undefined ? warranty_period : serviceRecord.warranty_period,
      availability_date !== undefined ? availability_date : serviceRecord.availability_date,
      time_start !== undefined ? time_start : serviceRecord.time_start,
      time_end !== undefined ? time_end : serviceRecord.time_end,
      status || serviceRecord.status,
      service_source !== undefined ? service_source : serviceRecord.service_source,
      service_vehicle !== undefined ? service_vehicle : serviceRecord.service_vehicle,
      req.params.id
    );
  } else {
    // Personnel (staff) can only update status
    const { status } = req.body;
    if (status) {
      db.prepare('UPDATE services SET status = ? WHERE id = ?').run(status, req.params.id);
    }
  }

  res.json({ success: true });
});

// Get single service details
router.get('/:id', requireAuth, (req, res) => {
  try {
    const service = db.prepare(`
      SELECT s.*, c.full_name as customer_name, c.phone as customer_phone, c.address as customer_address,
             p.full_name as personnel_name, a.name as authorized_service_name
      FROM services s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN personnel p ON s.personnel_id = p.id
      LEFT JOIN authorized_services a ON s.service_id = a.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!service) return res.status(404).json({ error: 'Servis bulunamadı' });

    const actions = db.prepare(`
      SELECT sa.*, p.full_name as personnel_name 
      FROM service_actions sa
      LEFT JOIN personnel p ON sa.personnel_id = p.id
      WHERE sa.service_record_id = ? 
      ORDER BY sa.created_at DESC
    `).all(req.params.id);

    const payments = db.prepare(`
      SELECT sp.*, p.full_name as personnel_name 
      FROM service_payments sp
      LEFT JOIN personnel p ON sp.personnel_id = p.id
      WHERE sp.service_record_id = ? 
      ORDER BY sp.created_at DESC
    `).all(req.params.id);

    res.json({ ...service, actions, payments });
  } catch (err) {
    console.error('API Error in GET /services/:id:', err);
    res.status(500).json({ error: 'Sunucu hatası: ' + err.message });
  }
});

// Add action to service
router.post('/:id/actions', requireAuth, (req, res) => {
  const { action_text } = req.body;
  if (!action_text) return res.status(400).json({ error: 'İşlem metni gereklidir' });

  db.prepare(`
    INSERT INTO service_actions (service_record_id, personnel_id, action_text)
    VALUES (?, ?, ?)
  `).run(req.params.id, req.session.user.id, action_text);

  res.json({ success: true });
});

// Add payment to service
router.post('/:id/payments', requireAuth, (req, res) => {
  const { amount, payment_method, payment_status, description } = req.body;
  if (!amount) return res.status(400).json({ error: 'Tutar gereklidir' });

  db.prepare(`
    INSERT INTO service_payments (service_record_id, personnel_id, amount, payment_method, payment_status, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, req.session.user.id, amount, payment_method, payment_status, description);

  res.json({ success: true });
});

// Delete service
router.delete('/:id', requireAuth, (req, res) => {
  const user = req.session.user;
  const serviceId = req.params.id;

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId);
  if (!service) return res.status(404).json({ error: 'Servis bulunamadı' });

  // Only admin or users with delete_service permission can delete
  const canDelete = user.role === 'admin' || (user.permissions && JSON.parse(user.permissions).delete_service === 'yes');
  
  if (!canDelete) {
    return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
  }

  // Related actions and payments are deleted via CASCADE in DB
  db.prepare('DELETE FROM services WHERE id = ?').run(serviceId);

  res.json({ success: true });
});

module.exports = router;
