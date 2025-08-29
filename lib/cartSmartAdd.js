 // lib/cartSmartAdd.js
import { addHalfToCart, validateFractions } from './pizzaFractions';

function toHalfItem(payload) {
  return {
    productId: payload.id || payload.productId,
    name: payload.name || payload.title || payload.sabor,
    price: Number(payload.price ?? payload.preco ?? payload.variantPrice ?? payload.meiaPrice ?? 0),
    size: payload.size || payload.tamanho || payload.sizeCode || 'G',
  };
}

function isHalf(payload) {
  const flags = [
    payload.isHalf,
    /meia/i.test(String(payload?.sizeName || '')),
    /1\/2/i.test(String(payload?.variantLabel || '')),
    String(payload?.sizeCode || '').toUpperCase() === 'MEIA',
  ];
  return flags.some(Boolean);
}

export function smartAdd(currentItems, payload, opts = {}) {
  const cart = { items: Array.isArray(currentItems) ? currentItems : [] };

  if (isHalf(payload)) {
    const half = toHalfItem(payload);
    const { cart: next } = addHalfToCart(cart, half, { priceRule: opts.priceRule || 'max' });
    return next.items;
  }

  const line = {
    id: payload.lineId || payload.id || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'single',
    productId: payload.id || payload.productId,
    name: payload.name || payload.title,
    size: payload.size || payload.tamanho || payload.sizeCode || null,
    price: Number(payload.price ?? payload.preco ?? payload.variantPrice ?? 0),
    qtd: 1,
    addons: payload.addons || [],
    meta: payload.meta || {},
  };
  return [...cart.items, line];
}

export function ensureNoPendingFractions(items) {
  const res = validateFractions({ items });
  if (!res.ok) {
    const err = new Error(res.message);
    err.code = 'PENDING_HALVES';
    err.pendings = res.pendings;
    throw err;
  }
  return true;
}
