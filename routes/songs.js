const express = require('express');
const path = require('path');
const db = require('../db');

const router = express.Router();

const { auth, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');


router.post(
  '/',
  auth,
  adminOnly,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
  ]),
  (req, res) => {
    try {
      const { title, artist, album, genre_id, duration } = req.body;

      // بررسی اطلاعات ضروری
      if (!title || !artist) {
        return res.status(400).json({
          error: 'عنوان و نام خواننده الزامی هستند.'
        });
      }

      // بررسی فایل صوتی
      if (!req.files || !req.files.audio || !req.files.audio[0]) {
        return res.status(400).json({
          error: 'فایل صوتی الزامی است!'
        });
      }

      const audioFileName = req.files.audio[0].filename;
      const coverFileName =
        req.files.cover && req.files.cover[0]
          ? req.files.cover[0].filename
          : null;

const audioWebPath = path.posix.join('audio', audioFileName);

const coverWebPath = coverFileName
  ? path.posix.join('covers', coverFileName)
  : null;

      const newSong = db.addSong({
        title: title.trim(),
        artist: artist.trim(),
        album: album ? album.trim() : null,
        genre_id: genre_id ? Number(genre_id) : null,
        duration: duration ? Number(duration) : null,
        audio_path: audioWebPath,
        cover_path: coverWebPath
      });

      res.status(201).json({
        success: true,
        song: newSong
      });
    } catch (error) {
      console.error('خطا در ذخیره‌سازی آهنگ:', error);

      res.status(500).json({
        error: 'خطای داخلی سرور'
      });
    }
  }
);

module.exports = router;