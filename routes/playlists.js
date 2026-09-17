const express = require('express');
const db = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// پلی‌لیست‌های من
router.get('/my', auth, (req, res) => {
  const playlists = db.getPlaylists().filter(p => p.user_id === req.user.id);
  res.json(playlists);
});

// ساخت پلی‌لیست
router.post('/', auth, (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'نام الزامی است' });

  const pl = db.addPlaylist({ name: name.trim(), user_id: req.user.id });
  res.json(pl);
});

// جزئیات یک پلی‌لیست
router.get('/:id', auth, (req, res) => {
  const playlists = db.getPlaylists();
  const pl = playlists.find(p => p.id === Number(req.params.id) && p.user_id === req.user.id);
  if (!pl) return res.status(404).json({ error: 'پلی‌لیست پیدا نشد' });

  const allSongs = db.getSongs();
  const genres = db.getGenres();
  const songs = (pl.songIds || []).map(sid => {
    const s = allSongs.find(song => song.id === sid);
    if (!s) return null;
    const genre = genres.find(g => g.id === s.genre_id);
    return { ...s, genre: genre ? genre.name : null };
  }).filter(Boolean);

  res.json({ ...pl, songs });
});

// اضافه کردن آهنگ به پلی‌لیست
router.post('/:id/songs', auth, (req, res) => {
  const { song_id } = req.body;
  const playlists = db.getPlaylists();
  const pl = playlists.find(p => p.id === Number(req.params.id) && p.user_id === req.user.id);
  if (!pl) return res.status(404).json({ error: 'پلی‌لیست پیدا نشد' });

  if (!pl.songIds) pl.songIds = [];
  if (pl.songIds.includes(Number(song_id))) {
    return res.status(400).json({ error: 'این آهنگ قبلاً اضافه شده' });
  }

  pl.songIds.push(Number(song_id));
  db.savePlaylists(playlists);
  res.json({ success: true });
});

// حذف آهنگ از پلی‌لیست
router.delete('/:id/songs/:songId', auth, (req, res) => {
  const playlists = db.getPlaylists();
  const pl = playlists.find(p => p.id === Number(req.params.id) && p.user_id === req.user.id);
  if (!pl) return res.status(404).json({ error: 'پلی‌لیست پیدا نشد' });

  pl.songIds = (pl.songIds || []).filter(id => id !== Number(req.params.songId));
  db.savePlaylists(playlists);
  res.json({ success: true });
});

// حذف پلی‌لیست
router.delete('/:id', auth, (req, res) => {
  db.deletePlaylist(req.params.id, req.user.id);
  res.json({ success: true });
});

module.exports = router;