// ───────────────────────────────────────────────────────────────
// نظام التصميم — مأخوذ مباشرة من الموك‑أب الأصلي
// نفس الألوان والزوايا وألوان الحالات
// ───────────────────────────────────────────────────────────────

export const colors = {
  bg: '#E8E8EA',
  surface: '#FFFFFF',
  ink: '#18181B',
  inkSoft: '#52525B',
  muted: '#A1A1AA',
  border: '#E4E4E7',
  field: '#F7F7F8',
};

// ألوان حالات عرض السعر — مطابقة لـ statusMeta في الموك‑أب
export const statusMeta = {
  draft:     { ar: 'مسودة', bg: '#F4F4F5', fg: '#52525B', dot: '#A1A1AA' },
  sent:      { ar: 'مُرسل', bg: '#EEF1F6', fg: '#3F4D63', dot: '#6B7E9E' },
  confirmed: { ar: 'مؤكد',  bg: '#ECF2EE', fg: '#3A5A47', dot: '#5C8A6E' },
  cancelled: { ar: 'ملغى',  bg: '#F6EEEE', fg: '#7A4A4A', dot: '#B07474' },
};

export const radius = {
  card: 26,
  field: 14,
  chip: 9999,
  tile: 19,
};

export const FONT = 'IBMPlexArabic';

// تنسيق الأرقام بفواصل
export const fmt = (n) => Number(n || 0).toLocaleString('en-US');

// أول حرف من اسم العميل (للأفاتار) — مطابق لـ initialOf
export const initialOf = (name = '') => {
  const p = name.trim().split(/\s+/);
  return (p[1] || p[0] || '').charAt(0);
};
