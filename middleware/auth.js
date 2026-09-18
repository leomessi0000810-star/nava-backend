const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'توکن وجود ندارد'
    });
  }

  try {
    const token = header.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // نمونه: { id, username, isAdmin }
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'توکن نامعتبر یا منقضی شده است'
    });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      error: 'دسترسی فقط برای ادمین است'
    });
  }

  next();
}

module.exports = { auth, adminOnly };
