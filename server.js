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

// ساخت پوشه‌های آپلود
fs.mkdirSync('uploads/audio', { recursive: true });
fs.mkdirSync('uploads/covers', { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// سرو کردن فایل‌های آپلود شده
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// روت‌ها
app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/playlists', playlistRoutes);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('/', (req, res) => {
  res.json({ message: 'Nava API is running' });
});

app.listen(PORT, () => {
  console.log(`✓ سرور روی پورت ${PORT} اجرا شد`);
});