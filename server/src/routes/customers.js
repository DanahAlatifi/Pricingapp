const express = require('express');
const odoo = require('../odoo/client');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const { url, db, uid, password } = req.odoo;
  const { search, all } = req.query;

  const domain = [];
  if (!all) {
    domain.push('|', ['is_company', '=', true], ['parent_id', '=', false]);
  }
  if (search) {
    domain.push('|', '|',
      ['name', 'ilike', search],
      ['email', 'ilike', search],
      ['phone', 'ilike', search]
    );
  }

  try {
    const rows = await odoo.searchRead(
      url, db, uid, password,
      'res.partner',
      domain,
      ['name', 'email', 'phone', 'customer_rank'],
      { limit: 500, order: 'customer_rank desc, name asc' }
    );
    const customers = rows
      .filter((c) => c.name)
      .map((c) => ({ id: c.id, name: c.name, email: c.email || null, phone: c.phone || null }));
    return res.json({ ok: true, data: customers });
  } catch (e) {
    console.error('[customers] error:', e.message);
    return res.status(502).json({ ok: false, error: 'تعذّر إنشاء العميل: ' + odoo.humanizeError(e) });
  }
});

router.post('/', auth, async (req, res) => {
  const { url, db, uid, password } = req.odoo;
  const { name, email, phone, city, street } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ ok: false, error: 'اسم العميل مطلوب' });
  }

  const vals = { name: name.trim(), customer_rank: 1, company_type: 'company' };
  if (email) vals.email = email.trim();
  if (phone) vals.phone = phone.trim();
  if (city) vals.city = city.trim();
  if (street) vals.street = street.trim();

  try {
    const newId = await odoo.execute(url, db, uid, password, 'res.partner', 'create', [vals]);
    const [created] = await odoo.execute(url, db, uid, password, 'res.partner', 'read', [[newId]], { fields: ['name', 'email', 'phone'] });
    return res.status(201).json({ ok: true, data: { id: newId, name: created.name, email: created.email || null, phone: created.phone || null } });
  } catch (e) {
    console.error('[customers:create] error:', e.message);
    return res.status(502).json({ ok: false, error: 'تعذّر إنشاء العميل في أودو' });
  }
});

module.exports = router;
