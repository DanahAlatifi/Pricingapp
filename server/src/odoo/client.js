// ───────────────────────────────────────────────────────────────
// غلاف الاتصال بأودو عبر XML-RPC
// الرابط (url) يُمرّر من المستخدم. قاعدة البيانات (db) تُكتشف
// تلقائياً من السيرفر (المستخدم لم يعد يدخلها).
// ───────────────────────────────────────────────────────────────
const xmlrpc = require('xmlrpc');

// function normalizeUrl(url) {
//   if (!url || typeof url !== 'string') return null;
//   const clean = url.trim().replace(/\/+$/, '');
//   if (!/^https?:\/\//i.test(clean)) return null;
//   return clean;
// }
function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return null;
  let clean = url.trim();
  if (!/^https?:\/\//i.test(clean)) return null;
  try {
    const u = new URL(clean);
    return u.origin;
  } catch {
    return clean.replace(/\/+$/, '');
  }
}

// ⚠️ أمان (SSRF): السيرفر يتصل بأي رابط يدخله المستخدم. لاستخدام داخلي مقبول.
// للإطلاق الواسع: فعّل قائمة السماح عبر ODOO_ALLOWED_HOSTS في .env
function assertAllowedHost(url) {
  const allow = (process.env.ODOO_ALLOWED_HOSTS || '').trim();
  if (!allow) return;
  const host = new URL(url).hostname;
  const list = allow.split(',').map((s) => s.trim()).filter(Boolean);
  if (!list.includes(host)) throw new Error(`النطاق غير مسموح: ${host}`);
}

function makeClient(url, path) {
  const isHttps = url.startsWith('https');
  const builder = isHttps ? xmlrpc.createSecureClient : xmlrpc.createClient;
  return builder({ url: `${url}${path}` });
}

function call(client, method, params) {
  return new Promise((resolve, reject) => {
    client.methodCall(method, params, (err, value) => {
      if (err) return reject(err);
      resolve(value);
    });
  });
}

// تخمين اسم قاعدة البيانات من النطاق (لأودو المستضاف على odoo.com)
// مثال: https://mycompany.odoo.com → mycompany
function guessDbFromHost(url) {
  try {
    const host = new URL(url).hostname;
    const parts = host.split('.');
    if (host.endsWith('.odoo.com') && parts.length >= 3) return parts[0];
    return null;
  } catch {
    return null;
  }
}

// قائمة قواعد البيانات (قد تكون معطّلة في أودو لأسباب أمنية)
async function listDatabases(url) {
  const dbClient = makeClient(url, '/xmlrpc/2/db');
  return call(dbClient, 'list', []);
}

// ───────────────────────────────────────────────
// اكتشاف قاعدة البيانات تلقائياً من الرابط
//   ١. نحاول جلب قائمة القواعد: لو وحدة فقط → نستخدمها.
//   ٢. لو أكثر من وحدة → نطابق مع تخمين النطاق.
//   ٣. لو القائمة معطّلة → نخمّن من النطاق (odoo.com).
// ───────────────────────────────────────────────
async function resolveDb(url) {
  const u = normalizeUrl(url);
  if (!u) throw new Error('رابط أودو غير صالح');
  assertAllowedHost(u);

  let dbs = null;
  try {
    dbs = await listDatabases(u);
  } catch (_) {
    // القائمة معطّلة — نكمل للتخمين
  }

  if (Array.isArray(dbs)) {
    if (dbs.length === 1) return dbs[0];
    if (dbs.length > 1) {
      const guess = guessDbFromHost(u);
      if (guess && dbs.includes(guess)) return guess;
      throw new Error('يوجد أكثر من قاعدة بيانات على هذا الرابط — تعذّر تحديدها تلقائياً');
    }
  }

  const guess = guessDbFromHost(u);
  if (guess) return guess;

  throw new Error('تعذّر تحديد قاعدة البيانات تلقائياً — تأكد من الرابط');
}

// ───────────────────────────────────────────────
// المصادقة
// ───────────────────────────────────────────────
async function authenticate(url, db, email, password) {
  const u = normalizeUrl(url);
  if (!u) throw new Error('رابط أودو غير صالح');
  if (!db) throw new Error('اسم قاعدة البيانات مطلوب');
  assertAllowedHost(u);

  const common = makeClient(u, '/xmlrpc/2/common');
  const uid = await call(common, 'authenticate', [db, email, password, {}]);
  return uid ? uid : null;
}

// ───────────────────────────────────────────────
// تنفيذ عملية على موديل
// ───────────────────────────────────────────────
async function execute(url, db, uid, password, model, method, args = [], kwargs = {}) {
  const u = normalizeUrl(url);
  if (!u) throw new Error('رابط أودو غير صالح');
  assertAllowedHost(u);

  const object = makeClient(u, '/xmlrpc/2/object');
  return call(object, 'execute_kw', [db, uid, password, model, method, args, kwargs]);
}

async function searchRead(url, db, uid, password, model, domain = [], fields = [], opts = {}) {
  return execute(url, db, uid, password, model, 'search_read', [domain], { fields, ...opts });
}

function humanizeError(e) {
  let raw = e?.faultString || e?.message || String(e);
  if (/already exists|duplicate|unique/i.test(raw)) return 'هذا السجل موجود مسبقاً (مكرّر)';
  if (/Access Denied|access rights|not allowed|AccessError/i.test(raw)) return 'ليس لديك صلاحية لهذه العملية في أودو';
  if (/required|Missing required/i.test(raw)) return 'بعض الحقول الإلزامية ناقصة في أودو';
  if (/ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i.test(raw)) return 'تعذّر الوصول لأودو — تأكد من الرابط والشبكة';
  if (/does not exist|database/i.test(raw)) return 'قاعدة البيانات غير موجودة أو الاسم خاطئ';
  const lines = raw.split('\n').map((s) => s.trim()).filter(Boolean);
  return (lines[lines.length - 1] || raw).slice(0, 200);
}

module.exports = { authenticate, execute, searchRead, resolveDb, humanizeError };
