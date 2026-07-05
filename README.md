# تطبيق تسعير — النسخة النظيفة الكاملة

هذي نسخة وحدة محدّثة بالكامل ومختبَرة. استخدميها وانسي كل النسخ القديمة.

## التشغيل (نافذتان)

### نافذة ١ — السيرفر
    cd server
    npm install
    # اكتبي .env (انسخي الأمر من الأسفل)
    npm run dev

ملف .env (الصقيه داخل مجلد server):
    cat > .env << 'ENVEOF'
    PORT=3000
    JWT_SECRET=my_secret_key_change_me_123456789
    SESSION_HOURS=12
    SESSION_ENC_KEY=32_char_encryption_key_change_me!
    DEFAULT_ODOO_URL=
    DEFAULT_ODOO_DB=
    ODOO_ALLOWED_HOSTS=
    ENVEOF

### نافذة ٢ — التطبيق
    cd app
    npm install --legacy-peer-deps
    npx expo start --clear

## الدخول (٤ خانات)
- رابط أودو:   http://192.168.1.119:8080   (IP جهازك + منفذ أودو، مو localhost)
- قاعدة البيانات: testluxury
- البريد + كلمة المرور: حسابك في أودو

## شروط
- أودو شغّال على جهازك
- الجوال والكمبيوتر على نفس الواي‑فاي
# Pricingapp
