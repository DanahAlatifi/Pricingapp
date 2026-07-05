import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

let Constants = {};
try {
  Constants = require('expo-constants').default || {};
} catch (_) {
  Constants = {};
}

const API_PORT = 3000;

function getExpoHost() {
  const candidates = [
    Constants?.expoConfig?.hostUri,
    Constants?.expoGoConfig?.debuggerHost,
    Constants?.manifest2?.extra?.expoGo?.debuggerHost,
    Constants?.manifest?.debuggerHost,
    Constants?.manifest?.hostUri,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.length) {
      const host = c.split(':')[0].trim();
      if (host) return host;
    }
  }
  return null;
}

function resolveBaseUrl() {
  const configured = Constants?.expoConfig?.extra?.apiBaseUrl;
  if (configured && !configured.includes('192.168.1.10')) {
    return configured;
  }
  const host = getExpoHost();
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${API_PORT}`;
  }
  return configured || `http://localhost:${API_PORT}`;
}

const BASE_URL = resolveBaseUrl();
console.log('[API] عنوان السيرفر المُستخدم:', BASE_URL);

const TOKEN_KEY = 'taseer_token';
const CONN_KEY = 'taseer_conn';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.error ||
      (err.code === 'ECONNABORTED'
        ? `انتهت مهلة الاتصال بالسيرفر (${BASE_URL}) — تأكد أن السيرفر يعمل وأنك على نفس الواي‑فاي`
        : `تعذّر الاتصال بالسيرفر (${BASE_URL})`);
    return Promise.reject(new Error(msg));
  }
);

export async function saveToken(token) { await SecureStore.setItemAsync(TOKEN_KEY, token); }
export async function getToken() { return SecureStore.getItemAsync(TOKEN_KEY); }
export async function clearToken() { await SecureStore.deleteItemAsync(TOKEN_KEY); }

export async function saveConn(url, db) { await SecureStore.setItemAsync(CONN_KEY, JSON.stringify({ url, db })); }
export async function getConn() {
  try { const raw = await SecureStore.getItemAsync(CONN_KEY); return raw ? JSON.parse(raw) : null; }
  catch (_) { return null; }
}

const unwrap = (res) => res.data?.data;

export const Api = {
  login: (url, db, email, password) => api.post('/login', { url, db, email, password }).then(unwrap),
  logout: () => api.post('/logout').then(unwrap),
  me: () => api.get('/me').then(unwrap),
  getStats: () => api.get('/stats').then(unwrap),

  getProducts: () => api.get('/products').then(unwrap),
  getCustomers: (search) => api.get('/customers', { params: search ? { search } : {} }).then(unwrap),
  createCustomer: (payload) => api.post('/customers', payload).then(unwrap),

  getOrders: (status) => api.get('/orders', { params: status ? { status } : {} }).then(unwrap),
  getOrder: (id) => api.get(`/orders/${id}`).then(unwrap),
  createOrder: (payload) => api.post('/orders', payload).then(unwrap),
  updateOrder: (id, payload) => api.patch(`/orders/${id}`, payload).then(unwrap),
  sendOrder: (id) => api.post(`/orders/${id}/send`).then(unwrap),
  confirmOrder: (id) => api.post(`/orders/${id}/confirm`).then(unwrap),
  cancelOrder: (id) => api.post(`/orders/${id}/cancel`).then(unwrap),
};

export default Api;
