const express = require('express');
const db = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// لیست همه ژانرها
router.get('/', (req, res) => {
  res.json(db.getGenres());
});

// ساخت ژانر (فقط ادمین)
router.post('/', auth, adminOnly, (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'نام الزامی است' });

  const genre = db.addGenre(name.trim());
  if (!genre) return res.status(400).json({ error: 'این ژانر از قبل وجود دارد' });

  res.json(genre);
});

// حذف ژانر (فقط ادمین)
router.delete('/:id', auth, adminOnly, (req, res) => {
  db.deleteGenre(req.params.id);
  res.json({ success: true });
});

module.exports = router;