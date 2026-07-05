import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Api from '../api/client';
import { colors, radius, FONT, fmt, statusMeta } from '../theme';
import { Screen, Loader, ErrorBox } from '../components/ui';

export default function ActivityScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try { setStats(await Api.getStats()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  if (loading) return <Screen title="نشاطي"><Loader /></Screen>;
  if (error) return <Screen title="نشاطي"><ErrorBox message={error} onRetry={() => { setLoading(true); load(); }} /></Screen>;

  return (
    <Screen title="نشاطي">
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
        <View style={{ marginHorizontal: 16, backgroundColor: colors.ink, borderRadius: radius.card, padding: 22, marginBottom: 14 }}>
          <Text style={{ fontFamily: FONT, color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'right' }}>إجمالي مبيعاتي المؤكدة</Text>
          <Text style={{ fontFamily: FONT, color: '#fff', fontSize: 34, fontWeight: '700', textAlign: 'right', marginTop: 6 }}>{fmt(stats.confirmedTotal)} ر.س</Text>
        </View>

        <View style={{ flexDirection: 'row-reverse', paddingHorizontal: 16, gap: 12, marginBottom: 14 }}>
          <BigStat label="عدد عروضي" value={stats.ordersCount} />
          <BigStat label="عدد العملاء" value={stats.customersCount} />
        </View>

        <Text style={{ fontFamily: FONT, fontSize: 16, fontWeight: '700', color: colors.ink, textAlign: 'right', paddingHorizontal: 20, marginBottom: 8 }}>توزيع عروضي</Text>
        <View style={{ marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: radius.card, overflow: 'hidden' }}>
          <StatRow status="draft" value={stats.draftCount} />
          <Divider />
          <StatRow status="sent" value={stats.sentCount} />
          <Divider />
          <StatRow status="confirmed" value={stats.confirmedCount} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function BigStat({ label, value }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.card, padding: 18 }}>
      <Text style={{ fontFamily: FONT, fontSize: 32, fontWeight: '700', color: colors.ink, textAlign: 'right' }}>{fmt(value)}</Text>
      <Text style={{ fontFamily: FONT, fontSize: 13, color: colors.muted, textAlign: 'right', marginTop: 4 }}>{label}</Text>
    </View>
  );
}

function StatRow({ status, value }) {
  const m = statusMeta[status];
  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: m.dot }} />
        <Text style={{ fontFamily: FONT, fontSize: 15, color: colors.ink }}>{m.ar}</Text>
      </View>
      <Text style={{ fontFamily: FONT, fontSize: 17, fontWeight: '700', color: colors.ink }}>{fmt(value)}</Text>
    </View>
  );
}

function Divider() { return <View style={{ height: 0.5, backgroundColor: colors.border, marginHorizontal: 16 }} />; }
