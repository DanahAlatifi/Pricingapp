// ───────────────────────────────────────────────────────────────
// الشاشة الرئيسية — ملخّص + أزرار سريعة + إحصائيات + آخر العروض
// ───────────────────────────────────────────────────────────────
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { colors, radius, FONT, fmt, statusMeta } from '../theme';
import StatusChip from '../components/StatusChip';
import { PlusIcon, SearchIcon, OrdersIcon, ProfileIcon } from '../components/Icon';
import { Screen, Loader, ErrorBox } from '../components/ui';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await Api.getOrders();
      setOrders(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const counts = orders.reduce((a, o) => { a[o.status] = (a[o.status] || 0) + 1; return a; }, {});
  const confirmedTotal = orders.filter((o) => o.status === 'confirmed').reduce((a, o) => a + (o.total || 0), 0);
  const pendingTotal = orders.filter((o) => o.status === 'sent' || o.status === 'draft').reduce((a, o) => a + (o.total || 0), 0);
  const recent = orders.slice(0, 5);

  if (loading) return <Screen title="الرئيسية"><Loader /></Screen>;

  return (
    <Screen title={`أهلاً، ${user?.name?.split(' ')[0] || ''}`}>
      {error ? (
        <ErrorBox message={error} onRetry={() => { setLoading(true); load(); }} />
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
          {/* بطاقة الإجمالي */}
          <View style={{ marginHorizontal: 16, backgroundColor: colors.ink, borderRadius: radius.card, padding: 20, marginBottom: 14 }}>
            <Text style={{ fontFamily: FONT, color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'right' }}>
              إجمالي العروض المؤكدة
            </Text>
            <Text style={{ fontFamily: FONT, color: '#fff', fontSize: 32, fontWeight: '700', textAlign: 'right', marginTop: 6 }}>
              {fmt(confirmedTotal)} ر.س
            </Text>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' }}>
              <View>
                <Text style={{ fontFamily: FONT, color: 'rgba(255,255,255,0.55)', fontSize: 12, textAlign: 'right' }}>قيد الانتظار</Text>
                <Text style={{ fontFamily: FONT, color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'right', marginTop: 2 }}>{fmt(pendingTotal)} ر.س</Text>
              </View>
              <View>
                <Text style={{ fontFamily: FONT, color: 'rgba(255,255,255,0.55)', fontSize: 12, textAlign: 'right' }}>إجمالي العروض</Text>
                <Text style={{ fontFamily: FONT, color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'right', marginTop: 2 }}>{orders.length}</Text>
              </View>
            </View>
          </View>

          {/* أزرار سريعة */}
          <View style={{ flexDirection: 'row-reverse', paddingHorizontal: 16, gap: 10, marginBottom: 18 }}>
         <QuickAction Icon={PlusIcon} label="طلب جديد" primary onPress={() => navigation.navigate('NewOrder')} />
            <QuickAction Icon={ProfileIcon} label="عميل جديد" onPress={() => navigation.navigate('NewOrder', { openNewCustomer: true })} />
            <QuickAction Icon={OrdersIcon} label="كل الطلبات" onPress={() => navigation.navigate('Tabs', { screen: 'OrdersTab' })} />
          </View>

          {/* عدّادات الحالات */}
          <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 18 }}>
            {['draft', 'sent', 'confirmed', 'cancelled'].map((s) => (
              <View key={s} style={{ flexBasis: '47%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: radius.field, padding: 14 }}>
                <Text style={{ fontFamily: FONT, fontSize: 24, fontWeight: '700', color: colors.ink, textAlign: 'right' }}>
                  {counts[s] || 0}
                </Text>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: statusMeta[s].dot }} />
                  <Text style={{ fontFamily: FONT, fontSize: 13, color: statusMeta[s].fg }}>{statusMeta[s].ar}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* آخر العروض */}
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 }}>
            <Text style={{ fontFamily: FONT, fontSize: 17, fontWeight: '700', color: colors.ink }}>آخر العروض</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'OrdersTab' })}>
              <Text style={{ fontFamily: FONT, fontSize: 13, color: colors.muted }}>عرض الكل</Text>
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 16, gap: 10, paddingBottom: 10 }}>
            {recent.length === 0 ? (
              <Text style={{ fontFamily: FONT, fontSize: 13, color: colors.muted, textAlign: 'center', paddingVertical: 20 }}>لا توجد عروض بعد</Text>
            ) : recent.map((o) => (
              <TouchableOpacity
                key={o.id}
                onPress={() => navigation.navigate('OrderDetail', { id: o.id })}
                style={{ backgroundColor: colors.surface, borderRadius: radius.field, padding: 14, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT, fontSize: 14, fontWeight: '700', color: colors.ink, textAlign: 'right' }}>{o.customer}</Text>
                  <Text style={{ fontFamily: FONT, fontSize: 12, color: colors.muted, textAlign: 'right', marginTop: 2 }}>{o.ref} · {fmt(o.total)} ر.س</Text>
                </View>
                <StatusChip status={o.status} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

function QuickAction({ Icon, label, onPress, primary }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1, height: 80, borderRadius: radius.field,
        backgroundColor: primary ? colors.ink : colors.surface,
        borderWidth: primary ? 0 : 1, borderColor: colors.border,
        alignItems: 'center', justifyContent: 'center', gap: 8,
      }}
    >
      <Icon color={primary ? '#fff' : colors.ink} size={22} />
      <Text style={{ fontFamily: FONT, fontSize: 12, fontWeight: '600', color: primary ? '#fff' : colors.ink }}>{label}</Text>
    </TouchableOpacity>
  );
}
