const express = require('express');
const db = require('../db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// تنظیم multer برای مدیریت آپلود فایل‌های صوتی و کاور
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = file.fieldname === 'audio' ? 'uploads/audio' : 'uploads/covers';
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // ۵۰ مگابایت محدودیت حجم
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audio' && !file.mimetype.startsWith('audio/')) {
      return cb(new Error('فقط فایل صوتی مجاز است'));
    }
    if (file.fieldname === 'cover' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('فقط تصویر مجاز است'));
    }
    cb(null, true);
  }
});

// تابع کمکی برای ادغام اطلاعات ژانر با آهنگ (مشابه JOIN در دیتابیس)
function enrichSong(song, genres) {
  const g = genres.find(item => item.id === Number(song.genre_id));
  return {
    ...song,
    genre: g ? g.name : null
  };
}

// ۱. لیست همه آهنگ‌ها (با قابلیت فیلتر بر اساس نام ژانر)
router.get('/', (req, res) => {
  const { genre } = req.query;
  const songs = db.getSongs();
  const genres = db.getGenres();

  // مرتب‌سازی بر اساس جدیدترین (نزولی بر اساس شناسه یا تاریخ)
  let enrichedSongs = songs
    .map(s => enrichSong(s, genres))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (genre) {
    enrichedSongs = enrichedSongs.filter(s => s.genre === genre);
  }

  res.json(enrichedSongs);
});

// ۲. دریافت اطلاعات یک آهنگ خاص بر اساس شناسه
router.get('/:id', (req, res) => {
  const songs = db.getSongs();
  const song = songs.find(s => s.id === Number(req.params.id));

  if (!song) {
    return res.status(404).json({ error: 'آهنگ پیدا نشد' });
  }

  const genres = db.getGenres();
  res.json(enrichSong(song, genres));
});

// ۳. آپلود و ثبت آهنگ جدید (فقط ادمین)
router.post('/', auth, adminOnly, upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), (req, res) => {
  try {
    const { title, artist, album, genre_id, duration } = req.body;
    if (!title || !artist || !req.files?.audio) {
      return res.status(400).json({ error: 'عنوان، هنرمند و فایل صوتی الزامی است' });
    }

    // اصلاح اسلش‌ها برای سازگاری در سیستم‌عامل‌های مختلف
    const audioPath = req.files.audio[0].path.replace(/\\/g, '/');
    const coverPath = req.files.cover ? req.files.cover[0].path.replace(/\\/g, '/') : null;

    const newSong = db.addSong({
      title: title.trim(),
      artist: artist.trim(),
      album: album ? album.trim() : null,
      genre_id: genre_id ? Number(genre_id) : null,
      duration: duration ? Number(duration) : null,
      audio_path: audioPath,
      cover_path: coverPath
    });

    res.json({ id: newSong.id, message: 'آهنگ با موفقیت آپلود شد' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ۴. حذف آهنگ و پاک‌سازی فایل‌های فیزیکی از دیسک (فقط ادمین)
router.delete('/:id', auth, adminOnly, (req, res) => {
  const songs = db.getSongs();
  const song = songs.find(s => s.id === Number(req.params.id));

  if (!song) {
    return res.status(404).json({ error: 'آهنگ پیدا نشد' });
  }

  // حذف فیزیکی فایل‌های صوتی و کاور از روی هارد
  if (song.audio_path && fs.existsSync(song.audio_path)) {
    try { fs.unlinkSync(song.audio_path); } catch (e) { console.error('خطا در حذف فایل صوتی:', e); }
  }
  if (song.cover_path && fs.existsSync(song.cover_path)) {
    try { fs.unlinkSync(song.cover_path); } catch (e) { console.error('خطا در حذف کاور:', e); }
  }

  // حذف از دیتابیس JSON
  db.deleteSong(song.id);

  res.json({ success: true });
});

// ۵. تغییر ژانر یک آهنگ (فقط ادمین)
router.patch('/:id/genre', auth, adminOnly, (req, res) => {
  const { genre_id } = req.body;
  db.updateSongGenre(req.params.id, genre_id ? Number(genre_id) : null);
  res.json({ success: true });
});

module.exports = router;
// ۱. مسیر افزایش تعداد پخش (وقتی آهنگ استارت می‌خوره)
router.post('/:id/play', (req, res) => {
  db.incrementPlayCount(req.params.id);
  res.json({ success: true });
});

// ۲. مسیر دریافت محبوب‌ترین آهنگ‌ها بر اساس پلی
router.get('/stats/popular', (req, res) => {
  res.json(db.getPopularSongs(15));
});

// ۳. مسیر ویرایش آهنگ (فقط ادمین)
router.put('/:id', auth, adminOnly, upload.fields([
  { name: 'cover', maxCount: 1 }
]), (req, res) => {
  try {
    const { title, artist, album, genre_id, tags } = req.body;
    const data = {};
    if (title) data.title = title;
    if (artist) data.artist = artist;
    if (album !== undefined) data.album = album;
    if (genre_id) data.genre_id = Number(genre_id);
    if (tags) {
      data.tags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;
    }
    if (req.files && req.files.cover && req.files.cover[0]) {
      // ذخیره مسیر کاور به شکل استاندارد وب
      data.cover = `/covers/${req.files.cover[0].filename}`;
    }

    const updated = db.updateSong(req.params.id, data);
    if (!updated) return res.status(404).json({ error: 'آهنگ پیدا نشد' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'خطا در ویرایش اطلاعات آهنگ' });
  }
});
