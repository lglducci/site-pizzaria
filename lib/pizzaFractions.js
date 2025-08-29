  // lib/pizzaFractions.js
const toNum = (x) => {
  if (typeof x === 'number' && isFinite(x)) return x;
  if (x == null) return 0;
  const s = String(x)
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const n = Number(s);
  return isFinite(n) ? n : 0;
};

function makeHalfPending(half) {
  const id = `half-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const price = toNum(half.price);
  return {
    id,
    type: 'half',
    isPending: true,
    productId: half.productId,
    name: half.name,
    size: half.size || 'G',
    price,
    preco: price, // compat
    qtd: 1,
    meta: { ...half.meta },
  };
}

function makeHalfCombo(a, b, priceRule = 'max') {
  const id = `combo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const size = a.size || b.size || 'G';
  const pA = toNum(a.price);
  const pB = toNum(b.price);

  let price = 0;
  if (priceRule === 'sum') price = pA + pB;
  else if (priceRule === 'avg') price = (pA + pB) / 2;
  else price = Math.max(pA, pB); // default 'max'

  return {
    id,
    type: 'half_combo',
    qtd: 1,
    size,
    halves: [
      { productId: a.productId, name: a.name, price: pA },
      { productId: b.productId, name: b.name, price: pB },
    ],
    name: `Meia ${a.name} + Meia ${b.name} (${size})`,
    price,
    preco: price, // compat
    meta: {},
  };
}

export function isHalfCombo(it) { return it && it.type === 'half_combo'; }
export function isHalfPending(it) { return it && it.type === 'half' && it.isPending; }
export function formatHalfComboLabel(it) {
  if (!isHalfCombo(it)) return it?.name || '';
  const a = it.halves?.[0]?.name || '';
  const b = it.halves?.[1]?.name || '';
  const sz = it.size || 'G';
  return `Meia ${a} + Meia ${b} (${sz})`;
}

export function addHalfToCart(cart, half, opts = {}) {
  const priceRule = opts.priceRule || 'max';
  const items = Array.isArray(cart.items) ? [...cart.items] : [];

  const idx = items.findIndex((it) => isHalfPending(it) && (it.size || 'G') === (half.size || 'G'));
  if (idx >= 0) {
    const pending = items[idx];
    const combo = makeHalfCombo(
      { productId: pending.productId, name: pending.name, price: pending.price, size: pending.size },
      half,
      priceRule
    );
    items.splice(idx, 1, combo);
    return { cart: { ...cart, items } };
  }

  items.push(makeHalfPending(half));
  return { cart: { ...cart, items } };
}

export function validateFractions(cart) {
  const items = Array.isArray(cart.items) ? cart.items : [];
  const pendings = items.filter(isHalfPending);
  if (pendings.length > 0) {
    return { ok: false, pendings, message: 'Há meias pizzas pendentes. Complete as frações antes de finalizar.' };
  }
  return { ok: true, pendings: [] };
}
