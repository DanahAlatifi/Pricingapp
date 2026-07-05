import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Api from '../api/client';
import { colors, radius, FONT, fmt } from '../theme';
import StatusChip from '../components/StatusChip';
import { Screen, Loader, ErrorBox } from '../components/ui';

export default function OrderDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try { setOrder(await Api.getOrder(id)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [id]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  async function runAction(fn, label) {
    setActing(true);
    try { await fn(id); await load(); }
    catch (e) { Alert.alert(`تعذّر ${label}`, e.message); }
    finally { setActing(false); }
  }

  if (loading) return <Screen title="تفاصيل العرض"><Loader /></Screen>;
  if (error) return <Screen title="تفاصيل العرض"><ErrorBox message={error} onRetry={() => { setLoading(true); load(); }} /></Screen>;
  if (!order) return null;

  const canEdit = order.status === 'draft' || order.status === 'sent';
  const canSend = order.status === 'draft';
  const canCancel = order.status !== 'cancelled' && order.status !== 'confirmed';

  return (
    <Screen title={order.ref}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.card, padding: 18 }}>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT, fontSize: 18, fontWeight: '700', color: colors.ink }}>{order.customer}</Text>
            <StatusChip status={order.status} />
          </View>
          <Text style={{ fontFamily: FONT, fontSize: 13, color: colors.muted, textAlign: 'right', marginTop: 8 }}>
            التاريخ: {order.date}{order.validUntil ? ` · صالح حتى: ${order.validUntil}` : ''}
          </Text>
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: radius.card, padding: 6 }}>
          {order.lines.map((l, i) => (
            <View key={i} style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: i < order.lines.length - 1 ? 0.5 : 0, borderBottomColor: colors.border }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT, fontSize: 15, color: colors.ink, textAlign: 'right' }}>{l.name}</Text>
                <Text style={{ fontFamily: FONT, fontSize: 12, color: colors.muted, textAlign: 'right', marginTop: 2 }}>{l.qty} × {fmt(l.price)} ر.س</Text>
              </View>
              <Text style={{ fontFamily: FONT, fontSize: 15, fontWeight: '700', color: colors.ink }}>{fmt(l.lineTotal)} ر.س</Text>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: radius.card, padding: 18, gap: 10 }}>
          <Row label="المجموع الفرعي" value={`${fmt(order.subtotal)} ر.س`} />
          <Row label="الضريبة (١٥٪)" value={`${fmt(order.vat)} ر.س`} />
          <View style={{ height: 0.5, backgroundColor: colors.border }} />
          <Row label="الإجمالي" value={`${fmt(order.total)} ر.س`} bold />
        </View>

        {acting ? <ActivityIndicator color={colors.ink} style={{ marginVertical: 8 }} /> : (
          <View style={{ gap: 10 }}>
            {canEdit && <ActionBtn label="تعديل العرض" outline onPress={() => navigation.navigate('NewOrder', { editId: id })} />}
            {canSend && <ActionBtn label="إرسال للعميل" onPress={() => runAction(Api.sendOrder, 'الإرسال')} />}
            {canEdit && <ActionBtn label="تأكيد العرض" onPress={() => runAction(Api.confirmOrder, 'التأكيد')} />}
            {canCancel && <ActionBtn label="إلغاء العرض" danger onPress={() => Alert.alert('تأكيد', 'إلغاء هذا العرض؟', [{ text: 'تراجع', style: 'cancel' }, { text: 'إلغاء العرض', style: 'destructive', onPress: () => runAction(Api.cancelOrder, 'الإلغاء') }])} />}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value, bold }) {
  return (
    <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
      <Text style={{ fontFamily: FONT, fontSize: bold ? 16 : 14, fontWeight: bold ? '700' : '400', color: bold ? colors.ink : colors.inkSoft }}>{label}</Text>
      <Text style={{ fontFamily: FONT, fontSize: bold ? 16 : 14, fontWeight: bold ? '700' : '400', color: colors.ink }}>{value}</Text>
    </View>
  );
}

function ActionBtn({ label, onPress, outline, danger }) {
  const bg = danger ? '#F6EEEE' : outline ? colors.surface : colors.ink;
  const fg = danger ? '#7A4A4A' : outline ? colors.ink : '#fff';
  return (
    <TouchableOpacity onPress={onPress} style={{ height: 50, borderRadius: radius.field, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', borderWidth: outline ? 1 : 0, borderColor: colors.border }}>
      <Text style={{ fontFamily: FONT, fontSize: 15, fontWeight: '700', color: fg }}>{label}</Text>
    </TouchableOpacity>
  );
}
