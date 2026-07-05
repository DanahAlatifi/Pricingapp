# سيرفر تسعير (الوسيط)

السيرفر الوسيط الذي يربط تطبيق الجوال بأودو عبر XML-RPC.
يغطي **المرحلة ٠ + ١**: الاتصال بأودو + تسجيل الدخول بـ JWT.

## التشغيل

```bash
cd server
npm install
cp .env.example .env      # ثم عدّل القيم
npm run dev               # أو: npm start
```

افتح `.env` وعبّئ:
- `ODOO_URL` رابط أودو (بدون / في الآخر)
- `ODOO_DB` اسم قاعدة البيانات
- `JWT_SECRET` نص عشوائي طويل وسري
- `SESSION_ENC_KEY` ٣٢ حرف لتشفير الجلسات

## الاختبار السريع

```bash
# ١. فحص أن السيرفر يعمل
curl http://localhost:3000/health

# ٢. تسجيل الدخول (يرجّع token)
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmed@alufuq.com","password":"YOUR_PASSWORD"}'

# ٣. استخدم الـ token لجلب المنتجات من أودو
curl http://localhost:3000/api/products \
  -H "Authorization: Bearer THE_TOKEN_FROM_STEP_2"
```

لو الخطوة ٣ رجّعت منتجاتك الحقيقية من أودو، فالربط شغّال والأساس جاهز.

## البنية

```
server/
├── .env.example
├── package.json
└── src/
    ├── index.js              # تشغيل Express
    ├── odoo/
    │   ├── client.js         # الاتصال بأودو: authenticate + execute_kw
    │   ├── mappers.js        # تحويل الحالات (draft/sent/sale/cancel)
    │   └── sessionStore.js   # تخزين كلمة المرور مشفّرة للجلسة
    ├── middleware/
    │   └── auth.js           # تحقق JWT → uid
    └── routes/
        ├── auth.js           # login / logout / me
        └── products.js       # اختبار الربط بأودو
```

## الخطوة التالية
المرحلة ٢: مسارات العملاء وعروض الأسعار (`/api/customers`, `/api/orders`, `/api/dashboard`)
ثم بناء تطبيق Expo وربطه بهذه المسارات.

> ⚠️ **ملاحظة أمان للإنتاج:** نظام `sessionStore` الحالي يخزّن كلمة المرور
> مشفّرة في ذاكرة السيرفر (مناسب للتطوير). قبل الإطلاق، انتقل إلى
> **API Key من أودو** لكل مستخدم — راجع قسم ٣ في مستند الخطة.
