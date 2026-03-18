const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
  }

  const user = db.prepare(`
    SELECT p.*, a.name as service_name, pp.permissions, pp.visible_stages
    FROM personnel p 
    LEFT JOIN authorized_services a ON p.service_id = a.id 
    LEFT JOIN personnel_positions pp ON p.position = pp.name AND p.service_id = pp.service_id
    WHERE p.username = ?
  `).get(username);

  if (!user) {
    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
  }

  req.session.user = {
    id: user.id,
    full_name: user.full_name,
    username: user.username,
    role: user.role,
    service_id: user.service_id,
    service_name: user.service_name,
    position: user.position,
    profile_picture: user.profile_picture,
    title: user.title,
    permissions: user.permissions ? JSON.parse(user.permissions) : null,
    visible_stages: user.visible_stages ? JSON.parse(user.visible_stages) : null
  };

  res.json({ success: true, user: req.session.user });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Get current user
router.get('/me', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Oturum bulunamadı' });
  }
  res.json({ user: req.session.user });
});

module.exports = router;
