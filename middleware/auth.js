const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'توکن وجود ندارد' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, username, isAdmin }
    next();
  } catch {
    return res.status(401).json({ error: 'توکن نامعتبر است' });
  }
}

function adminOnly(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'دسترسی فقط برای ادمین' });
  }
  next();
}

module.exports = { auth, adminOnly };