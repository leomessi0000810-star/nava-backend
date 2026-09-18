function adminOnly(req, res, next) {
  // فایل auth باید اطلاعات کاربر واردشده را در req.user قرار داده باشد
  if (!req.user) {
    return res.status(401).json({
      error: 'ابتدا وارد حساب کاربری شوید.'
    });
  }

  // نقش مدیر را بررسی می‌کنیم
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'فقط مدیر اجازهٔ انجام این کار را دارد.'
    });
  }

  next();
}

module.exports = adminOnly;
