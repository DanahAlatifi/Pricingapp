import React from 'react';
import { View, Text } from 'react-native';
import { statusMeta, FONT } from '../theme';

export default function StatusChip({ status }) {
  const m = statusMeta[status] || statusMeta.draft;
  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: m.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999 }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: m.dot }} />
      <Text style={{ fontFamily: FONT, fontSize: 12, color: m.fg }}>{m.ar}</Text>
    </View>
  );
}
