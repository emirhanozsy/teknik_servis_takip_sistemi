function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin yetkisi gerekiyor' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
