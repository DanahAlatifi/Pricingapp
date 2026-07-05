// ───────────────────────────────────────────────────────────────
// أيقونات بسيطة مرسومة بـ View فقط (بدون أي مكتبة خارجية)
// تتجنب مشاكل تثبيت المكتبات
// ───────────────────────────────────────────────────────────────
import React from 'react';
import { View } from 'react-native';

// أيقونة الرئيسية (بيت)
export function HomeIcon({ color = '#000', size = 24 }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* السقف */}
      <View style={{
        position: 'absolute', top: s * 0.08,
        width: 0, height: 0,
        borderLeftWidth: s * 0.42, borderRightWidth: s * 0.42, borderBottomWidth: s * 0.34,
        borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color,
      }} />
      {/* الجسم */}
      <View style={{
        width: s * 0.6, height: s * 0.42, borderWidth: s * 0.09, borderColor: color,
        borderTopWidth: 0, marginBottom: s * 0.06,
      }} />
    </View>
  );
}

// أيقونة الطلبات (قائمة/مستند)
export function OrdersIcon({ color = '#000', size = 24 }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: s * 0.62, height: s * 0.78, borderWidth: s * 0.09, borderColor: color, borderRadius: s * 0.1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: s * 0.34, height: s * 0.07, backgroundColor: color, marginBottom: s * 0.06, borderRadius: 2 }} />
        <View style={{ width: s * 0.34, height: s * 0.07, backgroundColor: color, marginBottom: s * 0.06, borderRadius: 2 }} />
        <View style={{ width: s * 0.34, height: s * 0.07, backgroundColor: color, borderRadius: 2 }} />
      </View>
    </View>
  );
}

// أيقونة جديد (+ داخل دائرة)
export function PlusIcon({ color = '#000', size = 24, filled = false }) {
  const s = size;
  return (
    <View style={{
      width: s, height: s, borderRadius: s / 2,
      backgroundColor: filled ? color : 'transparent',
      borderWidth: filled ? 0 : s * 0.09, borderColor: color,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <View style={{ position: 'absolute', width: s * 0.46, height: s * 0.1, backgroundColor: filled ? '#fff' : color, borderRadius: 2 }} />
      <View style={{ position: 'absolute', width: s * 0.1, height: s * 0.46, backgroundColor: filled ? '#fff' : color, borderRadius: 2 }} />
    </View>
  );
}

// أيقونة الحساب (شخص)
export function ProfileIcon({ color = '#000', size = 24 }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
      {/* الرأس */}
      <View style={{ width: s * 0.34, height: s * 0.34, borderRadius: s * 0.17, borderWidth: s * 0.09, borderColor: color, marginBottom: s * 0.04 }} />
      {/* الكتفين */}
      <View style={{ width: s * 0.6, height: s * 0.3, borderTopLeftRadius: s * 0.3, borderTopRightRadius: s * 0.3, borderWidth: s * 0.09, borderColor: color, borderBottomWidth: 0 }} />
    </View>
  );
}

// أيقونة البحث (عدسة)
export function SearchIcon({ color = '#000', size = 20 }) {
  const s = size;
  return (
    <View style={{ width: s, height: s }}>
      <View style={{ width: s * 0.62, height: s * 0.62, borderRadius: s * 0.31, borderWidth: s * 0.1, borderColor: color }} />
      <View style={{ position: 'absolute', bottom: s * 0.02, right: s * 0.02, width: s * 0.28, height: s * 0.1, backgroundColor: color, borderRadius: 2, transform: [{ rotate: '45deg' }] }} />
    </View>
  );
}
export function ChartIcon({ color = '#000', size = 24 }) {
  const s = size;
  const bar = (h, ml) => (
    <View style={{ width: s * 0.16, height: s * h, backgroundColor: color, borderRadius: 2, marginLeft: ml }} />
  );
  return (
    <View style={{ width: s, height: s, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
      {bar(0.4, 0)}
      {bar(0.7, s * 0.08)}
      {bar(0.55, s * 0.08)}
    </View>
  );
}
