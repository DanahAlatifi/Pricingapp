import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';
import { getConn } from '../api/client';
import { colors, radius, FONT } from '../theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const conn = await getConn();
      if (conn && conn.url) setUrl(conn.url);
    })();
  }, []);

  async function onSubmit() {
    if (!url || !email || !password) {
      Alert.alert('تنبيه', 'عبّئ كل الحقول');
      return;
    }
    setLoading(true);
    try {
      await login(url.trim(), '', email.trim(), password);
    } catch (e) {
      Alert.alert('فشل الدخول', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 26, paddingVertical: 30 }}>
          <View style={{ alignItems: 'center', marginBottom: 34 }}>
            <View style={{ width: 62, height: 62, borderRadius: radius.tile, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <View style={{ width: 22, height: 22, borderRadius: 7, borderWidth: 2.5, borderColor: '#fff' }} />
            </View>
            <Text style={{ fontFamily: FONT, fontSize: 27, fontWeight: '700', color: colors.ink }}>تسعير</Text>
            <Text style={{ fontFamily: FONT, fontSize: 14, color: colors.muted, marginTop: 6 }}>عروض الأسعار وإدارة الطلبات</Text>
          </View>

          <Field label="رابط أودو">
            <TextInput value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://dana71.odoo.com" placeholderTextColor={colors.muted} style={inputStyle} />
          </Field>
          <Field label="البريد الإلكتروني">
            <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="you@company.com" placeholderTextColor={colors.muted} style={inputStyle} />
          </Field>
          <Field label="كلمة المرور">
            <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" placeholderTextColor={colors.muted} style={inputStyle} />
          </Field>

          <TouchableOpacity onPress={onSubmit} disabled={loading} style={{ height: 52, borderRadius: radius.field, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginTop: 22, opacity: loading ? 0.7 : 1 }}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ fontFamily: FONT, color: '#fff', fontSize: 16, fontWeight: '700' }}>تسجيل الدخول</Text>}
          </TouchableOpacity>

          <Text style={{ fontFamily: FONT, fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 14 }}>قاعدة البيانات تُكتشف تلقائياً من الرابط</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontFamily: FONT, fontSize: 13, color: colors.inkSoft, marginBottom: 8, textAlign: 'right', fontWeight: '600' }}>{label}</Text>
      {children}
    </View>
  );
}

const inputStyle = {
  height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: radius.field,
  backgroundColor: colors.field, paddingHorizontal: 16, fontSize: 15, color: colors.ink,
  fontFamily: FONT, textAlign: 'left', writingDirection: 'ltr',
};
