import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import Api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { colors, radius, FONT, initialOf } from '../theme';
import { Screen } from '../components/ui';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [details, setDetails] = useState(user);

  useEffect(() => {
    (async () => {
      try {
        const data = await Api.me();
        if (data?.user) setDetails(data.user);
      } catch (_) {}
    })();
  }, []);

  const d = details || {};

  return (
    <Screen title="حسابي">
      <View style={{ alignItems: 'center', marginVertical: 24 }}>
        <View style={{ width: 76, height: 76, borderRadius: 24, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: FONT, fontSize: 30, fontWeight: '700', color: '#fff' }}>{initialOf(d.name || '')}</Text>
        </View>
        <Text style={{ fontFamily: FONT, fontSize: 20, fontWeight: '700', color: colors.ink, marginTop: 14 }}>{d.name}</Text>
        <Text style={{ fontFamily: FONT, fontSize: 14, color: colors.muted, marginTop: 4 }}>{d.email}</Text>
      </View>

      <SectionTitle text="بيانات الحساب" />
      <Card>
        <InfoRow label="الجوال" value={d.phone} />
        <InfoRow label="الشركة" value={d.company} />
        <InfoRow label="المسمى الوظيفي" value={d.job} />
        <InfoRow label="رقم المستخدم في أودو" value={d.uid ? `#${d.uid}` : null} last />
      </Card>

      <SectionTitle text="الاتصال بالنظام" />
      <Card>
        <InfoRow label="رابط أودو" value={d.url} />
        <InfoRow label="قاعدة البيانات" value={d.db} last />
      </Card>

      <TouchableOpacity
        onPress={() => Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج؟', [{ text: 'تراجع', style: 'cancel' }, { text: 'خروج', style: 'destructive', onPress: logout }])}
        style={{ marginHorizontal: 16, marginTop: 20, marginBottom: 30, height: 50, borderRadius: radius.field, backgroundColor: '#F6EEEE', alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ fontFamily: FONT, fontSize: 15, fontWeight: '700', color: '#7A4A4A' }}>تسجيل الخروج</Text>
      </TouchableOpacity>
    </Screen>
  );
}

function SectionTitle({ text }) {
  return <Text style={{ fontFamily: FONT, fontSize: 14, fontWeight: '700', color: colors.inkSoft, textAlign: 'right', paddingHorizontal: 20, marginTop: 18, marginBottom: 8 }}>{text}</Text>;
}

function Card({ children }) {
  return <View style={{ marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: radius.card, overflow: 'hidden' }}>{children}</View>;
}

function InfoRow({ label, value, last }) {
  return (
    <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: last ? 0 : 0.5, borderBottomColor: colors.border }}>
      <Text style={{ fontFamily: FONT, fontSize: 15, color: colors.ink }}>{label}</Text>
      <Text style={{ fontFamily: FONT, fontSize: 14, color: value ? colors.inkSoft : colors.muted, maxWidth: '60%', textAlign: 'left' }} numberOfLines={1}>{value || 'غير محدد'}</Text>
    </View>
  );
}
