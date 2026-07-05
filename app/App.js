// ───────────────────────────────────────────────────────────────
// جذر التطبيق — تحميل الخط، تفعيل RTL، المزوّدات
// ───────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { I18nManager, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';

import { AuthProvider } from './src/auth/AuthContext';
import Navigation from './src/Navigation';
import { colors } from './src/theme';

// تفعيل اتجاه RTL (يحتاج إعادة تشغيل التطبيق مرة أولى لتطبيقه)
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
          // ضع ملف الخط في app/assets/ (راجع README)
          IBMPlexArabic: require('./assets/IBMPlexSansArabic-Regular.ttf'),
        });
      } catch (_) {
        // لو لم يوجد الخط، يكمل التطبيق بالخط الافتراضي
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
