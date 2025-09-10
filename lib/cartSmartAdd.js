 // lib/cartSmartAdd.js
import { addHalfToCart, validateFractions } from './pizzaFractions';

const toNum = (x) => {
  if (typeof x === 'number' && isFinite(x)) return x;
  if (x == null) return 0;
  const s = String(x).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  const n = Number(s);
  return isFinite(n) ? n : 0;
};

function toHalfItem(payload) {
  return {
    productId: payload.id || payload.productId,
    code: payload.codigo ?? payload.numero ?? payload.id, // <<< pega o número para exibir
    name: payload.name || payload.title || payload.sabor,
    price: toNum(payload.price ?? payload.preco ?? payload.variantPrice ?? payload.meiaPrice ?? 0),
    size: payload.size || payload.tamanho || payload.sizeCode || 'G',
    categoria: payload.categoria, // ✅ Adicionar isso
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

  const price = toNum(payload.price ?? payload.preco ?? payload.valor ?? payload.variantPrice ?? 0);
 const line = {
  ...payload, // ✅ isso garante que campos como categoria, descricao, etc. sejam mantidos
  id: payload.lineId || payload.id || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  type: 'single',
  productId: payload.id || payload.productId,
  code: payload.codigo ?? payload.numero ?? payload.id ?? null,
  name: payload.name || payload.title,
  size: payload.size || payload.tamanho || payload.sizeCode || null,
  price,
  preco: price,
  qtd: 1,
  addons: payload.addons || [],
  meta: payload.meta || {},
  categoria: payload.categoria || null,
};

// 🔁 Se já existir uma linha do mesmo produto/tamanho/categoria, soma a quantidade
const sameKey = (a, b) => {
  const keyA = String(a.code ?? a.productId ?? a.name).toLowerCase().trim();
  const keyB = String(b.code ?? b.productId ?? b.name).toLowerCase().trim();
  const sizeA = String(a.size ?? '').toLowerCase().trim();
  const sizeB = String(b.size ?? '').toLowerCase().trim();
  const catA  = String(a.categoria ?? a.category ?? '').toLowerCase().trim();
  const catB  = String(b.categoria ?? b.category ?? '').toLowerCase().trim();
  return keyA === keyB && sizeA === sizeB && catA === catB;
};

const idx = cart.items.findIndex(it => it.type === 'single' && sameKey(it, line));
if (idx !== -1) {
  const copy = [...cart.items];
  const cur = copy[idx];
  copy[idx] = { ...cur, qtd: (cur.qtd || 1) + (line.qtd || 1) };
  return copy;
}









 

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
