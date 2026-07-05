// ───────────────────────────────────────────────────────────────
// مسار عروض الأسعار — sale.order
//   GET /api/orders?status=...   GET /api/orders/:id
//   POST /api/orders   PATCH /api/orders/:id
//   POST /api/orders/:id/(send|confirm|cancel)
// ───────────────────────────────────────────────────────────────
const express = require('express');
const odoo = require('../odoo/client');
const auth = require('../middleware/auth');
const {
  appStatusFromOdoo, odooStateFromApp, statusArabic, relId, relName,
} = require('../odoo/mappers');

const router = express.Router();
router.use(auth);

const ORDER_FIELDS = [
  'name', 'partner_id', 'date_order', 'validity_date',
  'state', 'amount_untaxed', 'amount_tax', 'amount_total',
];

function toOrderSummary(o) {
  const app = appStatusFromOdoo(o.state);
  return {
    id: o.id,
    ref: o.name,
    customer: relName(o.partner_id),
    customerId: relId(o.partner_id),
    date: o.date_order ? o.date_order.slice(0, 10) : null,
    validUntil: o.validity_date || null,
    status: app,
    statusAr: statusArabic(app),
    subtotal: o.amount_untaxed,
    vat: o.amount_tax,
    total: o.amount_total,
  };
}

// قائمة
router.get('/', async (req, res) => {
  const { url, db, uid, password } = req.odoo;
  const { status } = req.query;
  const domain = [];
  if (status && status !== 'all') {
    const odooState = odooStateFromApp(status);
    if (odooState) domain.push(['state', '=', odooState]);
  }
  try {
    const rows = await odoo.searchRead(
      url, db, uid, password, 'sale.order', domain, ORDER_FIELDS,
      { limit: 200, order: 'date_order desc' }
    );
    return res.json({ ok: true, data: rows.map(toOrderSummary) });
  } catch (e) {
    console.error('[orders:list] error:', e.message);
    return res.status(502).json({ ok: false, error: 'تعذّر جلب عروض الأسعار' });
  }
});

// تفاصيل
router.get('/:id', async (req, res) => {
  const { url, db, uid, password } = req.odoo;
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ ok: false, error: 'رقم العرض غير صالح' });
  try {
    const [order] = await odoo.execute(
      url, db, uid, password, 'sale.order', 'read', [[id]], { fields: ORDER_FIELDS }
    );
    if (!order) return res.status(404).json({ ok: false, error: 'العرض غير موجود' });

    const lines = await odoo.searchRead(
      url, db, uid, password, 'sale.order.line',
      [['order_id', '=', id]],
      ['product_id', 'name', 'product_uom_qty', 'price_unit', 'price_subtotal'],
      { order: 'sequence asc' }
    );

    const detail = {
      ...toOrderSummary(order),
      lines: lines.map((l) => ({
        productId: relId(l.product_id),
        name: l.name || relName(l.product_id),
        qty: l.product_uom_qty,
        price: l.price_unit,
        lineTotal: l.price_subtotal,
      })),
    };
    return res.json({ ok: true, data: detail });
  } catch (e) {
    console.error('[orders:detail] error:', e.message);
    return res.status(502).json({ ok: false, error: 'تعذّر جلب تفاصيل العرض' });
  }
});

// إنشاء
router.post('/', async (req, res) => {
  const { url, db, uid, password } = req.odoo;
  const { customerId, lines, validUntil } = req.body || {};
  if (!customerId || !Array.isArray(lines) || lines.length === 0) {
    return res.status(400).json({ ok: false, error: 'العميل وبند واحد على الأقل مطلوبان' });
  }
  const orderLines = lines.map((l) => [
    0, 0, { product_id: l.productId, product_uom_qty: l.qty || 1 },
  ]);
  const vals = { partner_id: customerId, order_line: orderLines };
  if (validUntil) vals.validity_date = validUntil;
  try {
    const newId = await odoo.execute(url, db, uid, password, 'sale.order', 'create', [vals]);
    const [created] = await odoo.execute(
      url, db, uid, password, 'sale.order', 'read', [[newId]], { fields: ['name'] }
    );
    return res.status(201).json({ ok: true, data: { id: newId, ref: created.name } });
    } catch (e) {
    console.error('[orders:create] FULL ERROR >>>', e.faultString || e.message || e);
    console.error('[orders:create] payload >>>', JSON.stringify(vals));
    return res.status(502).json({ ok: false, error: 'تعذّر إنشاء العرض: ' + odoo.humanizeError(e) });
  }
});

// تعديل
router.patch('/:id', async (req, res) => {
  const { url, db, uid, password } = req.odoo;
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ ok: false, error: 'رقم العرض غير صالح' });
  const { customerId, lines, validUntil } = req.body || {};
  const vals = {};
  if (customerId) vals.partner_id = customerId;
  if (validUntil) vals.validity_date = validUntil;
  if (Array.isArray(lines)) {
    vals.order_line = [[5, 0, 0], ...lines.map((l) => [
      0, 0, { product_id: l.productId, product_uom_qty: l.qty || 1 },
    ])];
  }
  if (Object.keys(vals).length === 0) {
    return res.status(400).json({ ok: false, error: 'لا يوجد ما يُعدّل' });
  }
  try {
    await odoo.execute(url, db, uid, password, 'sale.order', 'write', [[id], vals]);
    return res.json({ ok: true, data: { id } });
  } catch (e) {
    console.error('[orders:update] error:', e.message);
    return res.status(502).json({ ok: false, error: 'تعذّر تعديل العرض' });
  }
});

// إجراءات الحالة
function actionRoute(path, method, label) {
  router.post(`/:id/${path}`, async (req, res) => {
    const { url, db, uid, password } = req.odoo;
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ ok: false, error: 'رقم العرض غير صالح' });
    try {
      await odoo.execute(url, db, uid, password, 'sale.order', method, [[id]]);
      return res.json({ ok: true, data: { id } });
    } catch (e) {
      console.error(`[orders:${path}] error:`, e.message);
      return res.status(502).json({ ok: false, error: `تعذّر ${label} العرض` });
    }
  });
}
actionRoute('send', 'action_quotation_send', 'إرسال');
actionRoute('confirm', 'action_confirm', 'تأكيد');
actionRoute('cancel', 'action_cancel', 'إلغاء');

module.exports = router;
