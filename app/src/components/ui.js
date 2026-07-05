import React from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, FONT } from '../theme';

export function Screen({ title, children, scroll = true }) {
  const Body = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {title ? (
        <Text
          style={{
            fontFamily: FONT, fontSize: 30, fontWeight: '700',
            color: colors.ink, textAlign: 'right',
            paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
          }}
        >
          {title}
        </Text>
      ) : null}
      <Body style={{ flex: 1 }} contentContainerStyle={scroll ? { paddingBottom: 24 } : undefined}>
        {children}
      </Body>
    </SafeAreaView>
  );
}

export function Loader() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
      <ActivityIndicator color={colors.ink} />
    </View>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <Text style={{ fontFamily: FONT, color: '#7A4A4A', textAlign: 'center', marginBottom: 8 }}>{message}</Text>
      {onRetry ? (
        <Text onPress={onRetry} style={{ fontFamily: FONT, color: colors.ink, fontWeight: '700' }}>إعادة المحاولة</Text>
      ) : null}
    </View>
  );
}

export function Empty({ text }) {
  return (
    <View style={{ padding: 40, alignItems: 'center' }}>
      <Text style={{ fontFamily: FONT, color: colors.muted, textAlign: 'center' }}>{text}</Text>
    </View>
  );
}
