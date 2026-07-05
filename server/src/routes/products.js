const express = require('express');
const odoo = require('../odoo/client');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const { url, db, uid, password } = req.odoo;
  const { search, all } = req.query;

  const domain = [];
  if (!all) {
    domain.push(['sale_ok', '=', true]);
  }
  if (search) {
    domain.push(['name', 'ilike', search]);
  }

  try {
    const rows = await odoo.searchRead(
      url, db, uid, password,
      'product.product',
      domain,
      ['name', 'list_price'],
      { limit: 500, order: 'name asc' }
    );
    const products = rows
      .filter((p) => p.name)
      .map((p) => ({ id: p.id, name: p.name, price: p.list_price }));
    return res.json({ ok: true, data: products });
  } catch (e) {
    console.error('[products] error:', e.message);
    return res.status(502).json({ ok: false, error: 'تعذّر جلب المنتجات من أودو' });
  }
});

module.exports = router;
