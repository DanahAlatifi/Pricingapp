// ───────────────────────────────────────────────────────────────
// وسيط التحقق من المصادقة
// يفحص الـ JWT في الهيدر، يطلع sessionId، يحمّل الجلسة،
// ويرفق uid وكلمة المرور بالطلب لاستخدامها مع أودو
// ───────────────────────────────────────────────────────────────
const jwt = require('jsonwebtoken');
const { getSession } = require('../odoo/sessionStore');

const JWT_SECRET = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ ok: false, error: 'مطلوب تسجيل الدخول' });
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return res.status(401).json({ ok: false, error: 'الجلسة منتهية أو غير صالحة' });
  }

  const session = getSession(payload.sid);
  if (!session) {
    return res.status(401).json({ ok: false, error: 'الجلسة منتهية، سجّل الدخول من جديد' });
  }

  // نرفق بيانات أودو بالطلب لتستخدمها المسارات
  req.odoo = {
    url: session.url,
    db: session.db,
    uid: session.uid,
    password: session.password,
  };
  req.user = {
    uid: session.uid,
    email: session.email,
    name: session.name,
  };
  req.sessionId = payload.sid;

  next();
}

module.exports = authMiddleware;
