// ───────────────────────────────────────────────────────────────
// تحويل البيانات بين أودو وصيغة التطبيق
// أهمها تحويل حالة عرض السعر (state) في الاتجاهين
// ───────────────────────────────────────────────────────────────

// حالة أودو → حالة التطبيق
const ODOO_TO_APP = {
  draft: 'draft',
  sent: 'sent',
  sale: 'confirmed',
  done: 'confirmed', // أمر بيع مقفل يُعتبر مؤكد
  cancel: 'cancelled',
};

// حالة التطبيق → حالة أودو (للفلترة)
const APP_TO_ODOO = {
  draft: 'draft',
  sent: 'sent',
  confirmed: 'sale',
  cancelled: 'cancel',
};

// النص العربي المعروض لكل حالة
const STATUS_AR = {
  draft: 'مسودة',
  sent: 'مُرسل',
  confirmed: 'مؤكد',
  cancelled: 'ملغى',
};

function appStatusFromOdoo(state) {
  return ODOO_TO_APP[state] || 'draft';
}

function odooStateFromApp(status) {
  return APP_TO_ODOO[status] || null;
}

function statusArabic(appStatus) {
  return STATUS_AR[appStatus] || appStatus;
}

// أودو يرجّع الحقول المرتبطة كـ [id, "الاسم"] — هذا اختصار لاستخراج كل جزء
const relId = (field) => (Array.isArray(field) ? field[0] : null);
const relName = (field) => (Array.isArray(field) ? field[1] : '');

module.exports = {
  appStatusFromOdoo,
  odooStateFromApp,
  statusArabic,
  relId,
  relName,
};
