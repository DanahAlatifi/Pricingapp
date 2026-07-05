import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Api from '../api/client';
import { colors, radius, FONT, fmt } from '../theme';
import { SearchIcon } from '../components/Icon';
import { Screen, Loader } from '../components/ui';

export default function NewOrderScreen({ route, navigation }) {
  const editId = route?.params?.editId || null;

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState(null);
  const [selectedCustomerObj, setSelectedCustomerObj] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [customerPicker, setCustomerPicker] = useState(false);
  const [productPicker, setProductPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  const [newCustomer, setNewCustomer] = useState(false);
  const [ncName, setNcName] = useState('');
  const [ncEmail, setNcEmail] = useState('');
  const [ncPhone, setNcPhone] = useState('');
  const [ncCity, setNcCity] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [cs, ps] = await Promise.all([Api.getCustomers(), Api.getProducts()]);
      setCustomers(cs || []);
      setProducts(ps || []);
    } catch (e) {
      Alert.alert('خطأ', e.message);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadData();
      if (editId) {
        try {
          const o = await Api.getOrder(editId);
          setCustomerId(o.customerId);
          if (o.customerId && o.customer) setSelectedCustomerObj({ id: o.customerId, name: o.customer });
          setLines(o.lines.map((l) => ({ productId: l.productId, qty: l.qty })));
        } catch (_) {}
      }
      setLoading(false);
    })();
  }, [editId, loadData]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  useEffect(() => {
    if (route?.params?.openNewCustomer) {
      setNewCustomer(true);
      navigation.setParams({ openNewCustomer: false });
    }
  }, [route?.params?.openNewCustomer]);

  const productById = (pid) => products.find((p) => p.id === pid);
  const customerById = (cid) => customers.find((c) => c.id === cid);
  const subtotal = lines.reduce((a, l) => a + (productById(l.productId)?.price || 0) * l.qty, 0);
  const vat = Math.round(subtotal * 0.15);
  const total = subtotal + vat;

  const inc = (i) => setLines((p) => p.map((l, idx) => idx === i ? { ...l, qty: l.qty + 1 } : l));
  const dec = (i) => setLines((p) => p.map((l, idx) => idx === i ? { ...l, qty: Math.max(1, l.qty - 1) } : l));
  const removeLine = (i) => setLines((p) => p.filter((_, idx) => idx !== i));

  function onPickProduct(pid) {
    if (productPicker === 'new') setLines((p) => [...p, { productId: pid, qty: 1 }]);
    else if (typeof productPicker === 'number') setLines((p) => p.map((l, idx) => idx === productPicker ? { ...l, productId: pid } : l));
    setProductPicker(false);
    setPickerSearch('');
  }

  async function createCustomer() {
    if (!ncName.trim()) { Alert.alert('تنبيه', 'اسم العميل مطلوب'); return; }
    setCreatingCustomer(true);
    try {
      const created = await Api.createCustomer({ name: ncName, email: ncEmail, phone: ncPhone, city: ncCity });
      setCustomers((prev) => {
        const without = prev.filter((c) => c.id !== created.id);
        return [created, ...without];
      });
      setCustomerId(created.id);
      setSelectedCustomerObj(created);
      setPickerSearch('');
      setNewCustomer(false);
      setCustomerPicker(false);
      setNcName(''); setNcEmail(''); setNcPhone(''); setNcCity('');
      loadData();
    } catch (e) {
      Alert.alert('تعذّر إنشاء العميل', e.message);
    } finally {
      setCreatingCustomer(false);
    }
  }

  async function save() {
    if (!customerId) { Alert.alert('تنبيه', 'اختر العميل'); return; }
    if (lines.length === 0) { Alert.alert('تنبيه', 'أضف بنداً واحداً على الأقل'); return; }
    setSaving(true);
    try {
      const payload = { customerId, lines };
      if (editId) await Api.updateOrder(editId, payload);
      else await Api.createOrder(payload);
      navigation.navigate('Tabs', { screen: 'OrdersTab' });
    } catch (e) {
      Alert.alert('تعذّر الحفظ', e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Screen title={editId ? 'تعديل العرض' : 'طلب جديد'}><Loader /></Screen>;

  const selectedCustomer = customerById(customerId) || (selectedCustomerObj && selectedCustomerObj.id === customerId ? selectedCustomerObj : null);
  const filteredCustomers = pickerSearch
    ? customers.filter((c) =>
        (c.name || '').toLowerCase().includes(pickerSearch.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(pickerSearch.toLowerCase()))
    : customers;
  const filteredProducts = pickerSearch
    ? products.filter((p) => (p.name || '').toLowerCase().includes(pickerSearch.toLowerCase()))
    : products;

  return (
    <Screen title={editId ? 'تعديل العرض' : 'طلب جديد'}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
        <View>
          <Text style={sectionLabel}>العميل</Text>
          <TouchableOpacity
            onPress={() => { setPickerSearch(''); setCustomerPicker(true); }}
            style={{ backgroundColor: colors.surface, borderRadius: radius.field, padding: 16, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border }}
          >
            <Text style={{ fontFamily: FONT, fontSize: 15, color: selectedCustomer ? colors.ink : colors.muted }}>
              {selectedCustomer ? selectedCustomer.name : 'اختر العميل'}
            </Text>
            <Text style={{ fontFamily: FONT, fontSize: 13, color: colors.muted }}>تغيير ▾</Text>
          </TouchableOpacity>
        </View>

        <View>
          <Text style={sectionLabel}>البنود</Text>
          <View style={{ gap: 10 }}>
            {lines.map((l, i) => {
              const p = productById(l.productId);
              return (
                <View key={i} style={{ backgroundColor: colors.surface, borderRadius: radius.field, padding: 14, borderWidth: 1, borderColor: colors.border, gap: 12 }}>
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <TouchableOpacity onPress={() => { setPickerSearch(''); setProductPicker(i); }} style={{ flex: 1 }}>
                      <Text style={{ fontFamily: FONT, fontSize: 15, fontWeight: '600', color: colors.ink, textAlign: 'right' }}>{p?.name || 'اختر منتجاً'}</Text>
                      <Text style={{ fontFamily: FONT, fontSize: 12, color: colors.muted, textAlign: 'right', marginTop: 3 }}>{fmt(p?.price)} ر.س للوحدة · اضغط للتغيير</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeLine(i)} style={{ padding: 4 }}>
                      <Text style={{ fontFamily: FONT, fontSize: 13, color: '#B07474' }}>حذف</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stepper onMinus={() => dec(i)} onPlus={() => inc(i)} value={l.qty} />
                    <Text style={{ fontFamily: FONT, fontSize: 15, fontWeight: '700', color: colors.ink }}>{fmt((p?.price || 0) * l.qty)} ر.س</Text>
                  </View>
                </View>
              );
            })}
            <TouchableOpacity onPress={() => { setPickerSearch(''); setProductPicker('new'); }} style={{ paddingVertical: 14, alignItems: 'center', borderRadius: radius.field, borderWidth: 1.5, borderColor: colors.ink, borderStyle: 'dashed' }}>
              <Text style={{ fontFamily: FONT, fontSize: 14, fontWeight: '600', color: colors.ink }}>+ إضافة منتج</Text>
            </TouchableOpacity>
          </View>
        </View>

        {lines.length > 0 && (
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.card, padding: 18, gap: 10 }}>
            <Row label="المجموع الفرعي" value={`${fmt(subtotal)} ر.س`} />
            <Row label="الضريبة (١٥٪ تقديرية)" value={`${fmt(vat)} ر.س`} />
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <Row label="الإجمالي" value={`${fmt(total)} ر.س`} bold />
          </View>
        )}

        <TouchableOpacity onPress={save} disabled={saving} style={{ height: 54, borderRadius: radius.field, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ fontFamily: FONT, color: '#fff', fontSize: 16, fontWeight: '700' }}>{editId ? 'حفظ التعديلات' : 'حفظ العرض'}</Text>}
        </TouchableOpacity>
      </ScrollView>

      <PickerModal
        visible={customerPicker}
        title="اختر العميل"
        search={pickerSearch} setSearch={setPickerSearch}
        items={filteredCustomers}
        onPick={(c) => { setCustomerId(c.id); setSelectedCustomerObj(c); setCustomerPicker(false); setPickerSearch(''); }}
        onClose={() => { setCustomerPicker(false); setPickerSearch(''); }}
        headerAction={{ label: '+ عميل جديد', onPress: () => { setCustomerPicker(false); setNewCustomer(true); } }}
        renderItem={(c) => (
          <>
            <Text style={{ fontFamily: FONT, fontSize: 15, color: colors.ink, textAlign: 'right' }}>{c.name}</Text>
            {c.email ? <Text style={{ fontFamily: FONT, fontSize: 12, color: colors.muted, textAlign: 'right', marginTop: 2 }}>{c.email}</Text> : null}
          </>
        )}
      />

      <PickerModal
        visible={productPicker !== false}
        title="اختر المنتج"
        search={pickerSearch} setSearch={setPickerSearch}
        items={filteredProducts}
        onPick={(p) => onPickProduct(p.id)}
        onClose={() => { setProductPicker(false); setPickerSearch(''); }}
        renderItem={(p) => (
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT, fontSize: 15, color: colors.ink, textAlign: 'right', flex: 1 }}>{p.name}</Text>
            <Text style={{ fontFamily: FONT, fontSize: 14, fontWeight: '700', color: colors.inkSoft }}>{fmt(p.price)} ر.س</Text>
          </View>
        )}
      />

      <Modal visible={newCustomer} animationType="slide" transparent onRequestClose={() => setNewCustomer(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '82%', paddingTop: 8 }}>
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
            </View>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 6 }}>
              <Text style={{ fontFamily: FONT, fontSize: 18, fontWeight: '700', color: colors.ink }}>عميل جديد</Text>
              <TouchableOpacity onPress={() => setNewCustomer(false)}><Text style={{ fontFamily: FONT, fontSize: 15, color: colors.muted }}>إلغاء</Text></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
              <NcField label="الاسم *" value={ncName} onChange={setNcName} placeholder="اسم العميل أو الشركة" />
              <NcField label="البريد الإلكتروني" value={ncEmail} onChange={setNcEmail} placeholder="email@example.com" keyboardType="email-address" />
              <NcField label="الجوال" value={ncPhone} onChange={setNcPhone} placeholder="05xxxxxxxx" keyboardType="phone-pad" />
              <NcField label="المدينة" value={ncCity} onChange={setNcCity} placeholder="الرياض" />
              <TouchableOpacity onPress={createCustomer} disabled={creatingCustomer} style={{ height: 52, borderRadius: radius.field, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginTop: 6, opacity: creatingCustomer ? 0.7 : 1 }}>
                {creatingCustomer ? <ActivityIndicator color="#fff" /> : <Text style={{ fontFamily: FONT, color: '#fff', fontSize: 16, fontWeight: '700' }}>حفظ العميل</Text>}
              </TouchableOpacity>
              <Text style={{ fontFamily: FONT, fontSize: 11, color: colors.muted, textAlign: 'center' }}>يُحفظ في أودو ويظهر بالنظام مباشرة</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function NcField({ label, value, onChange, placeholder, keyboardType }) {
  return (
    <View>
      <Text style={{ fontFamily: FONT, fontSize: 13, color: colors.inkSoft, marginBottom: 7, textAlign: 'right', fontWeight: '600' }}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.muted} keyboardType={keyboardType || 'default'} autoCapitalize="none"
        style={{ height: 50, borderWidth: 1, borderColor: colors.border, borderRadius: radius.field, backgroundColor: colors.surface, paddingHorizontal: 14, fontSize: 15, color: colors.ink, fontFamily: FONT, textAlign: 'right' }} />
    </View>
  );
}

function PickerModal({ visible, title, items, search, setSearch, onPick, onClose, renderItem, headerAction }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', paddingTop: 8 }}>
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 }}>
            <Text style={{ fontFamily: FONT, fontSize: 18, fontWeight: '700', color: colors.ink }}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Text style={{ fontFamily: FONT, fontSize: 15, color: colors.muted }}>إغلاق</Text></TouchableOpacity>
          </View>
          {headerAction && (
            <TouchableOpacity onPress={headerAction.onPress} style={{ marginHorizontal: 16, marginBottom: 8, height: 44, borderRadius: radius.field, borderWidth: 1.5, borderColor: colors.ink, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: FONT, fontSize: 14, fontWeight: '600', color: colors.ink }}>{headerAction.label}</Text>
            </TouchableOpacity>
          )}
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: radius.field, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: colors.border }}>
              <SearchIcon color={colors.muted} size={18} />
              <TextInput value={search} onChangeText={setSearch} placeholder="ابحث" placeholderTextColor={colors.muted} style={{ flex: 1, fontFamily: FONT, fontSize: 14, color: colors.ink, textAlign: 'right' }} />
            </View>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 8 }} keyboardShouldPersistTaps="handled">
            {items.length === 0 ? (
              <Text style={{ fontFamily: FONT, fontSize: 14, color: colors.muted, textAlign: 'center', paddingVertical: 20 }}>لا نتائج</Text>
            ) : items.map((it) => (
              <TouchableOpacity key={it.id} onPress={() => onPick(it)} style={{ backgroundColor: colors.surface, borderRadius: radius.field, padding: 15, borderWidth: 1, borderColor: colors.border }}>
                {renderItem(it)}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Stepper({ onMinus, onPlus, value }) {
  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 16, backgroundColor: colors.field, borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 5 }}>
      <TouchableOpacity onPress={onPlus} style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: FONT, fontSize: 20, color: colors.ink }}>+</Text></TouchableOpacity>
      <Text style={{ fontFamily: FONT, fontSize: 16, fontWeight: '700', color: colors.ink, minWidth: 24, textAlign: 'center' }}>{value}</Text>
      <TouchableOpacity onPress={onMinus} style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: FONT, fontSize: 20, color: colors.ink }}>−</Text></TouchableOpacity>
    </View>
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

const sectionLabel = { fontFamily: FONT, fontSize: 13, color: colors.inkSoft, marginBottom: 10, textAlign: 'right', fontWeight: '600' };
