 // lib/pizzaFractions.js

// cria uma meia pendente
function makeHalfPending(half) {
  const id = `half-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    type: 'half',
    isPending: true,
    productId: half.productId,
    name: half.name,
    size: half.size || 'G',
    price: Number(half.price ?? 0),
    qtd: 1,
    meta: { ...half.meta },
  };
}

// combina duas meias
function makeHalfCombo(a, b, priceRule = 'max') {
  const id = `combo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const size = a.size || b.size || 'G';
  const pA = Number(a.price ?? 0);
  const pB = Number(b.price ?? 0);

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
    name: `${a.name} + ${b.name} (1/2)`,
    price,
    meta: {},
  };
}

export function isHalfCombo(it) {
  return it && it.type === 'half_combo';
}
export function isHalfPending(it) {
  return it && it.type === 'half' && it.isPending;
}
export function formatHalfComboLabel(it) {
  if (!isHalfCombo(it)) return it?.name || '';
  const a = it.halves?.[0]?.name || '';
  const b = it.halves?.[1]?.name || '';
  const sz = it.size || 'G';
  return `Meia ${a} + Meia ${b} (${sz})`;
}

/**
 * Adiciona meia ao carrinho com pareamento automático
 * @param {{items: Array}} cart
 * @param {{productId,name,price,size}} half
 * @param {{priceRule?: 'max'|'sum'|'avg'}} opts
 */
export function addHalfToCart(cart, half, opts = {}) {
  const priceRule = opts.priceRule || 'max';
  const items = Array.isArray(cart.items) ? [...cart.items] : [];

  // procura uma meia pendente com o mesmo tamanho
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

  // senão cria uma meia pendente
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
