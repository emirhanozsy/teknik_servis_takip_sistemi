const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/stats', requireAuth, (req, res) => {
  const user = req.session.user;
  const isAdmin = user.role === 'admin';
  const serviceId = user.service_id;
  
  let totalServices, totalCustomers, totalPersonnel, totalCash;

  if (isAdmin) {
    totalServices = db.prepare('SELECT COUNT(*) as count FROM services').get().count;
    totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
    totalPersonnel = db.prepare('SELECT COUNT(*) as count FROM personnel').get().count;
    totalCash = db.prepare("SELECT SUM(price) as total FROM services WHERE status = 'Tamamlandı'").get().total || 0;
  } else {
    totalServices = db.prepare('SELECT COUNT(*) as count FROM services WHERE service_id = ?').get(serviceId).count;
    totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers WHERE service_id = ?').get(serviceId).count;
    totalPersonnel = db.prepare('SELECT COUNT(*) as count FROM personnel WHERE service_id = ?').get(serviceId).count;
    totalCash = db.prepare("SELECT SUM(price) as total FROM services WHERE service_id = ? AND status = 'Tamamlandı'").get(serviceId).total || 0;
  }

  // Periodic Stats
  const getPeriodCount = (periodSql) => {
    let sql = `SELECT COUNT(*) as count FROM services WHERE ${periodSql}`;
    if (!isAdmin) sql += ` AND service_id = ${serviceId}`;
    return db.prepare(sql).get().count;
  };

  const today = getPeriodCount("date(created_at, 'localtime') = date('now', 'localtime')");
  const thisWeek = getPeriodCount("date(created_at, 'localtime') >= date('now', '-7 days', 'localtime')");
  const thisMonth = getPeriodCount("strftime('%Y-%m', created_at, 'localtime') = strftime('%Y-%m', 'now', 'localtime')");
  const thisYear = getPeriodCount("strftime('%Y', created_at, 'localtime') = strftime('%Y', 'now', 'localtime')");

  // Chart Data (Last 7 Days)
  const chartData = [];
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  
  for (let i = 6; i >= 0; i--) {
    let sql = `SELECT COUNT(*) as count FROM services WHERE date(created_at, 'localtime') = date('now', '-${i} days', 'localtime')`;
    if (!isAdmin) sql += ` AND service_id = ${serviceId}`;
    const count = db.prepare(sql).get().count;
    
    // Get day name
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - i);
    const dayName = days[dateObj.getDay()];
    
    chartData.push({ label: dayName, value: count });
  }

  res.json({
    services: totalServices,
    customers: totalCustomers,
    personnel: totalPersonnel,
    cash: totalCash,
    periodic: {
      today,
      thisWeek,
      thisMonth,
      thisYear
    },
    chart: chartData
  });
});

module.exports = router;
