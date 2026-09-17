const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

// ثبت‌نام
router.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || username.length < 3 || password.length < 4) {
    return res.status(400).json({ error: 'نام کاربری حداقل ۳ و رمز حداقل ۴ کاراکتر' });
  }

  if (username.toLowerCase() === (process.env.ADMIN_USERNAME || 'admin').toLowerCase()) {
    return res.status(400).json({ error: 'این نام کاربری رزرو شده است' });
  }

  if (db.findUserByUsername(username)) {
    return res.status(400).json({ error: 'این نام کاربری قبلاً استفاده شده' });
  }

  const user = db.createUser({ username, password, isAdmin: false });

  const token = jwt.sign(
    { id: user.id, username: user.username, isAdmin: false },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, isAdmin: false }
  });
});

// ورود
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.findUserByUsername(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'نام کاربری یا رمز اشتباه است' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, isAdmin: !!user.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      isAdmin: !!user.is_admin
    }
  });
});

module.exports = router;