// ───────────────────────────────────────────────────────────────
// مخزن الجلسات
// يخزّن الآن أيضاً url + db (إضافةً للـ uid وكلمة المرور المشفّرة)،
// لأن المستخدم يدخلها وقت تسجيل الدخول.
// ⚠️ للإنتاج: انتقل إلى Redis + API Key من أودو (راجع مستند الخطة).
// ───────────────────────────────────────────────────────────────
const crypto = require('crypto');

const ENC_KEY = (process.env.SESSION_ENC_KEY || '').padEnd(32, '0').slice(0, 32);
const ALGO = 'aes-256-gcm';

const sessions = new Map();

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, Buffer.from(ENC_KEY), iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { enc: enc.toString('hex'), iv: iv.toString('hex'), tag: tag.toString('hex') };
}

function decrypt({ enc, iv, tag }) {
  const decipher = crypto.createDecipheriv(ALGO, Buffer.from(ENC_KEY), Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(enc, 'hex')), decipher.final()]).toString('utf8');
}

function createSession({ uid, email, name, password, url, db }) {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, {
    uid, email, name, url, db,
    cred: encrypt(password),
    createdAt: Date.now(),
  });
  return sessionId;
}

function getSession(sessionId) {
  const s = sessions.get(sessionId);
  if (!s) return null;
  return {
    uid: s.uid,
    email: s.email,
    name: s.name,
    url: s.url,
    db: s.db,
    password: decrypt(s.cred),
  };
}

function destroySession(sessionId) {
  sessions.delete(sessionId);
}

module.exports = { createSession, getSession, destroySession };
