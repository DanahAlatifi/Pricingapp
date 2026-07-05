// ───────────────────────────────────────────────────────────────
// شاشة الطلبات — قائمة عروض الأسعار مع بحث + فلترة بالحالة
// ───────────────────────────────────────────────────────────────
import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Api from '../api/client';
import { colors, radius, FONT, fmt, initialOf } from '../theme';
import StatusChip from '../components/StatusChip';
import { SearchIcon } from '../components/Icon';
import { Screen, Loader, ErrorBox, Empty } from '../components/ui';

const FILTERS = [
  ['all', 'الكل'], ['draft', 'مسودة'], ['sent', 'مُرسل'], ['confirmed', 'مؤكد'],
];

export default function OrdersScreen({ navigation }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (status) => {
    setError(null);
    try {
      const data = await Api.getOrders(status === 'all' ? undefined : status);
      setOrders(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(filter); }, [filter, load]));

  // فلترة بالبحث (اسم العميل أو رقم العرض)
  const q = search.trim().toLowerCase();
  const visible = q
    ? orders.filter((o) =>
        (o.customer || '').toLowerCase().includes(q) ||
        (o.ref || '').toLowerCase().includes(q))
    : orders;

  return (
    <Screen title="الطلبات" scroll={false}>
      {/* خانة البحث */}
      <View style={{ paddingHorizontal: 16, marginBottom: 4 }}>
        <View style={{
          flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
          backgroundColor: colors.surface, borderRadius: radius.field,
          paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: colors.border,
        }}>
          <SearchIcon color={colors.muted} size={18} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث باسم العميل أو رقم العرض"
            placeholderTextColor={colors.muted}
            style={{ flex: 1, fontFamily: FONT, fontSize: 14, color: colors.ink, textAlign: 'right' }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ fontFamily: FONT, fontSize: 16, color: colors.muted }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* أزرار الفلترة */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 8 }}
        style={{ flexGrow: 0 }}
      >
        {FILTERS.map(([key, label]) => {
          const active = filter === key;
          return (
            <TouchableOpacity
              key={key} onPress={() => setFilter(key)}
              style={{
                paddingHorizontal: 16, height: 36, borderRadius: 9999,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: active ? colors.ink : colors.surface,
                borderWidth: 1, borderColor: active ? colors.ink : colors.border,
              }}
            >
              <Text style={{ fontFamily: FONT, fontSize: 13, color: active ? '#fff' : colors.inkSoft }}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorBox message={error} onRetry={() => { setLoading(true); load(filter); }} />
      ) : visible.length === 0 ? (
        <Empty text={q ? 'لا نتائج للبحث' : 'لا توجد عروض أسعار'} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(filter); }} />}
        >
          {visible.map((o) => (
            <OrderCard key={o.id} order={o} onPress={() => navigation.navigate('OrderDetail', { id: o.id })} />
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

function OrderCard({ order, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ backgroundColor: colors.surface, borderRadius: radius.card, padding: 16 }}
    >
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.field, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: FONT, fontSize: 18, fontWeight: '700', color: colors.ink }}>
            {initialOf(order.customer)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONT, fontSize: 15, fontWeight: '700', color: colors.ink, textAlign: 'right' }}>
            {order.customer}
          </Text>
          <Text style={{ fontFamily: FONT, fontSize: 12, color: colors.muted, textAlign: 'right', marginTop: 2 }}>
            {order.ref} · {order.date}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        <StatusChip status={order.status} />
        <Text style={{ fontFamily: FONT, fontSize: 16, fontWeight: '700', color: colors.ink }}>
          {fmt(order.total)} ر.س
        </Text>
      </View>
    </TouchableOpacity>
  );
}
