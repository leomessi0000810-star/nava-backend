require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const songRoutes = require('./routes/songs');
const genreRoutes = require('./routes/genres');
const playlistRoutes = require('./routes/playlists');

const app = express();
const PORT = process.env.PORT || 3000;

// ساخت پوشه‌های آپلود با مسیر مطلق و استاندارد
fs.mkdirSync(path.join(__dirname, 'uploads', 'audio'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'uploads', 'covers'), { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// سرو کردن فایل‌های استاتیک (بدون کش تا فایل‌های جدید فوراً لود بشن)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  etag: false,
  maxAge: 0
}));
app.use(express.static(path.join(__dirname, 'public')));

// روت‌ها
app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/playlists', playlistRoutes);

app.listen(PORT, () => {
  console.log(`✓ سرور روی پورت ${PORT} اجرا شد`);
});
