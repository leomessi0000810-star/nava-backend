const path = require('path'); // حتماً این رو بالای فایل اضافه کن

// ... بخش روت آپلود ...
router.post('/', auth, adminOnly, upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), (req, res) => {
  try {
    const { title, artist, album, genre_id, duration } = req.body;

    // ۱. چک کردن فایل‌ها
    if (!req.files || !req.files.audio) {
      return res.status(400).json({ error: 'فایل صوتی الزامی است!' });
    }

    // ۲. استخراج فقط نام فایل (بدون مسیرهای ویندوزی مثل \)
    const audioFileName = req.files.audio[0].filename;
    const coverFileName = req.files.cover ? req.files.cover[0].filename : null;

    // ۳. ساخت مسیر استانداردِ وب
    // استفاده از path.posix باعث میشه همیشه اسلش (/) استفاده بشه، حتی در ویندوز
    const audioWebPath = path.posix.join('audio', audioFileName);
    const coverWebPath = coverFileName ? path.posix.join('covers', coverFileName) : null;

    // ۴. ثبت در دیتابیس
    const newSong = db.addSong({
      title: title.trim(),
      artist: artist.trim(),
      album: album ? album.trim() : null,
      genre_id: genre_id ? Number(genre_id) : null,
      duration: duration ? Number(duration) : null,
      audio_path: audioWebPath, // خروجی: audio/name.mp3
      cover_path: coverWebPath  // خروجی: covers/name.jpg
    });

    res.status(201).json({ success: true, song: newSong });

  } catch (error) {
    console.error('خطا در ذخیره‌سازی:', error);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});
