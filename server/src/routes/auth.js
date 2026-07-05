// ───────────────────────────────────────────────────────────────
// مسارات المصادقة
//   POST /api/login   — دخول عبر أودو (url + db + email + password)
//   POST /api/logout  — إنهاء الجلسة
//   GET  /api/me      — بيانات المستخدم الحالي
// ───────────────────────────────────────────────────────────────
const express = require('express');
const jwt = require('jsonwebtoken');
const odoo = require('../odoo/client');
const { createSession, destroySession } = require('../odoo/sessionStore');
const auth = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const SESSION_HOURS = parseInt(process.env.SESSION_HOURS || '12', 10);

// ───────────────────────────────────────────────
// تسجيل الدخول
// المستخدم يدخل: رابط أودو + البريد + كلمة المرور.
// قاعدة البيانات تُكتشف تلقائياً من الرابط.
// كل شخص يدخل بحسابه الخاص في أودو (uid لكل مستخدم).
// ───────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const body = req.body || {};
  const email = body.email;
  const password = body.password;
  const url = body.url || process.env.DEFAULT_ODOO_URL;
  // قاعدة البيانات: من المستخدم (مطلوبة عند تعدد القواعد)
  const dbInput = body.db || process.env.DEFAULT_ODOO_DB;

  if (!url || !email || !password) {
    return res.status(400).json({
      ok: false,
      error: 'الرابط والبريد وكلمة المرور كلها مطلوبة',
    });
  }

  try {
    // نستخدم قاعدة البيانات التي أدخلها المستخدم، وإلا نحاول اكتشافها
    const db = dbInput || await odoo.resolveDb(url);

    // التحقق من أودو والحصول على uid
    const uid = await odoo.authenticate(url, db, email, password);
    if (!uid) {
      return res.status(401).json({ ok: false, error: 'بيانات الدخول غير صحيحة' });
    }



    // ٣. جلب اسم المستخدم من res.users
    let name = email;
    try {
      const users = await odoo.searchRead(
        url, db, uid, password, 'res.users',
        [['id', '=', uid]], ['name'], { limit: 1 }
      );
      if (users && users[0]) name = users[0].name;
    } catch (_) { /* الاسم اختياري */ }

    // ٤. إنشاء جلسة (تخزّن url + db + كلمة المرور مشفّرة)
    const sid = createSession({ uid, email, name, password, url, db });

    // ٥. إصدار JWT يحمل الـ sessionId فقط
    const token = jwt.sign({ sid }, JWT_SECRET, { expiresIn: `${SESSION_HOURS}h` });

    return res.json({
      ok: true,
      data: { token, user: { uid, name, email } },
    });
  } catch (e) {
    console.error('[login] error:', e.message);
    // لو الخطأ من التحقق (رابط/نطاق غير صالح) نرجّعه كما هو
    const msg = /رابط|قاعدة|النطاق/.test(e.message)
      ? e.message
      : 'تعذّر الاتصال بأودو، تأكد من الرابط';
    return res.status(502).json({ ok: false, error: msg });
  }
});

// ───────────────────────────────────────────────
// تسجيل الخروج
// ───────────────────────────────────────────────
router.post('/logout', auth, (req, res) => {
  destroySession(req.sessionId);
  return res.json({ ok: true, data: { message: 'تم تسجيل الخروج' } });
});

// ───────────────────────────────────────────────
// بيانات المستخدم الحالي
// ───────────────────────────────────────────────

router.get('/me', auth, async (req, res) => {
  const { url, db, uid, password } = req.odoo;
  const base = { ...req.user, url, db };
  try {
    const [u] = await odoo.execute(
      url, db, uid, password, 'res.users', 'read', [[uid]],
      { fields: ['name', 'login', 'phone', 'mobile', 'company_name', 'function', 'lang', 'tz'] }
    );
    if (u) {
      base.phone = u.mobile || u.phone || null;
      base.company = u.company_name || null;
      base.job = u.function || null;
      base.lang = u.lang || null;
      base.tz = u.tz || null;
    }
  } catch (_) {}
  return res.json({ ok: true, data: { user: base } });
});

router.get('/stats', auth, async (req, res) => {
  const { url, db, uid, password } = req.odoo;
  try {
    const orders = await odoo.searchRead(
      url, db, uid, password, 'sale.order',
      [['user_id', '=', uid]], ['state', 'amount_total'], { limit: 1000 }
    );
    const ordersCount = orders.length;
    const confirmedTotal = orders.filter((o) => o.state === 'sale' || o.state === 'done').reduce((a, o) => a + (o.amount_total || 0), 0);
    const draftCount = orders.filter((o) => o.state === 'draft').length;
    const sentCount = orders.filter((o) => o.state === 'sent').length;
    const confirmedCount = orders.filter((o) => o.state === 'sale' || o.state === 'done').length;

    const partners = await odoo.searchRead(
      url, db, uid, password, 'res.partner',
      [['customer_rank', '>', 0]], ['id'], { limit: 5000 }
    );
    const customersCount = partners.length;

    return res.json({ ok: true, data: { ordersCount, confirmedTotal, customersCount, draftCount, sentCount, confirmedCount } });
  } catch (e) {
    console.error('[stats] error:', e.faultString || e.message);
    return res.status(502).json({ ok: false, error: 'تعذّر جلب الإحصائيات: ' + odoo.humanizeError(e) });
  }
});

module.exports = router;