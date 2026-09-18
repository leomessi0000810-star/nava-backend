const multer = require('multer');
const path = require('path');
const fs = require('fs');

const audioDir = path.join(__dirname, '../uploads/audio');
const coversDir = path.join(__dirname, '../uploads/covers');

fs.mkdirSync(audioDir, { recursive: true });
fs.mkdirSync(coversDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'audio') return cb(null, audioDir);
    if (file.fieldname === 'cover') return cb(null, coversDir);
    cb(new Error('نوع فایل نامعتبر است.'));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueName}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'audio') {
    const allowedAudioTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
      'audio/x-m4a'
    ];
    if (!allowedAudioTypes.includes(file.mimetype)) {
      return cb(new Error('فقط فایل‌های صوتی مجاز هستند.'), false);
    }
  }

  if (file.fieldname === 'cover') {
    const allowedImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error('کاور باید تصویر JPG، PNG یا WEBP باشد.'), false);
    }
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

module.exports = upload;
