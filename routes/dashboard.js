const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/stats', requireAuth, (req, res) => {
  const user = req.session.user;
  
  let servicesCount, customersCount, personnelCount, totalCash;

  if (user.role === 'admin') {
    servicesCount = db.prepare('SELECT COUNT(*) as count FROM services').get().count;
    customersCount = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
    personnelCount = db.prepare('SELECT COUNT(*) as count FROM personnel').get().count;
    totalCash = db.prepare("SELECT SUM(price) as total FROM services WHERE status = 'Tamamlandı'").get().total || 0;
  } else {
    const serviceId = user.service_id;
    servicesCount = db.prepare('SELECT COUNT(*) as count FROM services WHERE service_id = ?').get(serviceId).count;
    customersCount = db.prepare('SELECT COUNT(*) as count FROM customers WHERE service_id = ?').get(serviceId).count;
    personnelCount = db.prepare('SELECT COUNT(*) as count FROM personnel WHERE service_id = ?').get(serviceId).count;
    totalCash = db.prepare("SELECT SUM(price) as total FROM services WHERE service_id = ? AND status = 'Tamamlandı'").get(serviceId).total || 0;
  }

  res.json({
    services: servicesCount,
    customers: customersCount,
    personnel: personnelCount,
    cash: totalCash
  });
});

module.exports = router;
