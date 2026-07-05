// ───────────────────────────────────────────────────────────────
// سياق المصادقة — يدير حالة الدخول عبر التطبيق
// ───────────────────────────────────────────────────────────────
import React, { createContext, useContext, useEffect, useState } from 'react';
import Api, { saveToken, getToken, clearToken, saveConn } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true); // فحص أولي للجلسة المخزّنة

  // عند فتح التطبيق: لو فيه token محفوظ، نتحقق منه
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          const data = await Api.me();
          setUser(data.user);
        }
      } catch (_) {
        await clearToken(); // token منتهي
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  async function login(url, db, email, password) {
    const data = await Api.login(url, db, email, password);
    await saveToken(data.token);
    await saveConn(url, db); // نتذكّر الرابط وقاعدة البيانات لتعبئتهما لاحقاً
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try { await Api.logout(); } catch (_) {}
    await clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, booting, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth يجب أن يُستخدم داخل AuthProvider');
  return ctx;
}
