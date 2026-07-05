// ───────────────────────────────────────────────────────────────
// نقطة تشغيل السيرفر — تطبيق تسعير (الوسيط)
// ───────────────────────────────────────────────────────────────
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const os = require('os');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const customerRoutes = require('./routes/customers');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

// ───────────────────────────────────────────────
// إعدادات عامة
// ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// فحص صحة السيرفر (افتحيه من متصفح جوالك للتأكد من الاتصال)
app.get('/health', (req, res) => {
  res.json({ ok: true, data: { status: 'يعمل', time: new Date().toISOString() } });
});

// ───────────────────────────────────────────────
// المسارات
// ───────────────────────────────────────────────
app.use('/api', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);

app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'المسار غير موجود' });
});

app.use((err, req, res, next) => {
  console.error('[server] خطأ غير متوقع:', err.message);
  res.status(500).json({ ok: false, error: 'خطأ في السيرفر' });
});

// إيجاد عناوين IP المحلية (لمساعدتك في ضبط app.json)
function lanAddresses() {
  const nets = os.networkInterfaces();
  const out = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) out.push(net.address);
    }
  }
  return out;
}

// الاستماع على كل الشبكات (0.0.0.0) ليصل إليه الجوال
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('✓ سيرفر تسعير يعمل');
  console.log('──────────────────────────────────────────');
  const ips = lanAddresses();
  if (ips.length) {
    console.log('ضعي هذا العنوان في app/app.json (apiBaseUrl):');
    ips.forEach((ip) => console.log(`   http://${ip}:${PORT}`));
    console.log('');
    console.log('للتأكد: افتحي هذا الرابط من متصفح جوالك،');
    console.log('لازم يطلع {"ok":true,...}:');
    ips.forEach((ip) => console.log(`   http://${ip}:${PORT}/health`));
  } else {
    console.log(`المنفذ: ${PORT} — لم أجد عنوان IP محلي، تأكدي من اتصال الواي‑فاي`);
  }
  console.log('──────────────────────────────────────────');
  console.log('');
});
