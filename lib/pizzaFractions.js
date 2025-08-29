// lib/pizzaFractions.js
// Regras de fração de pizza: meia + meia => 1 item combinado

/** Gera um id simples, com fallback caso randomUUID não exista */
function uid(prefix = 'id') {
  const rnd =
    (globalThis.crypto && globalThis.crypto.randomUUID && globalThis.crypto.randomUUID()) ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}_${rnd}`;
}

/**
 * Calcula o preço do combinado de duas meias.
 * @param {number} a - preço da meia A
 * @param {number} b - preço da meia B
 * @param {'max'|'sum'|'avg'} rule - regra de cálculo (default: 'max')
 */
export function computeFractionPrice(a, b, rule = 'max') {
  const A = Number(a) || 0;
  const B = Number(b) || 0;
  let p = 0;
  switch (rule) {
    case 'sum':
      p = A + B;
      break;
    case 'avg':
      p = (A + B) / 2;
      break;
    case 'max':
    default:
      p = Math.max(A, B);
      break;
  }
  return Math.round(p * 100) / 100; // 2 casas
}

/**
 * Procura a ÚLTIMA meia pendente do mesmo tamanho.
 * @param {{items: any[]}} cart
 * @param {string} size - ex: 'G', 'M', 'P'
 * @returns {any|null}
 */
function findLastPendingHalf(cart, size) {
  if (!cart || !Array.isArray(cart.items)) return null;
  for (let i = cart.items.length - 1; i >= 0; i--) {
    const it = cart.items[i];
    if (it?.type === 'half' && it?.isPending && it?.size === size) {
      return { item: it, index: i };
    }
  }
  return null;
}

/**
 * Adiciona uma MEIA pizza ao carrinho.
 * - Se existir meia pendente do MESMO tamanho, realiza o "pair" e cria 1 item combinado (half_combo)
 * - Se não existir, adiciona meia pendente
 *
 * @param {{items: any[]}} cart - objeto do carrinho { items: [] }
 * @param {{productId: string, name: string, price: number, size: string}} halfItem
 * @param {{priceRule?: 'max'|'sum'|'avg'}} [opts]
 * @returns {{cart: {items:any[]}, action: 'paired'|'pending', created?: any, pairedWith?: any}}
 */
export function addHalfToCart(cart, halfItem, opts = {}) {
  const priceRule = opts.priceRule || 'max';
  const next = { items: Array.isArray(cart?.items) ? [...cart.items] : [] };

  if (!halfItem || !halfItem.size) {
    throw new Error('halfItem inválido: requer { productId, name, price, size }');
  }

  // 1) Tenta parear com a última meia pendente do mesmo tamanho
  const found = findLastPendingHalf(next, halfItem.size);

  if (found) {
    const a = found.item;
    const b = {
      productId: halfItem.productId,
      name: halfItem.name,
      price: Number(halfItem.price) || 0,
      size: halfItem.size,
    };

    // Remove a meia pendente antiga
    next.items.splice(found.index, 1);

    // Cria item combinado (1 linha no carrinho)
    const groupId = a.fractionGroupId || uid('grp');
    const combo = {
      id: groupId,
      type: 'half_combo',
      size: halfItem.size,
      qty: 1,
      price: computeFractionPrice(a.price, b.price, priceRule),
      components: [
        { productId: a.productId, name: a.name, price: a.price },
        { productId: b.productId, name: b.name, price: b.price },
      ],
      isPending: false,
      // metadados úteis para backend/checkout:
      meta: { fractionRule: priceRule },
    };

    next.items.push(combo);
    return { cart: next, action: 'paired', created: combo, pairedWith: a };
  }

  // 2) Não há meia pendente => adiciona meia pendente
  const groupId = uid('grp');
  const pending = {
    id: uid('half'),
    type: 'half',
    size: halfItem.size,
    productId: halfItem.productId,
    name: halfItem.name,
    price: Number(halfItem.price) || 0,
    isPending: true,
    fractionGroupId: groupId,
  };
  next.items.push(pending);
  return { cart: next, action: 'pending', created: pending };
}

/**
 * Valida o carrinho para garantir que não há meias pendentes.
 * @param {{items:any[]}} cart
 * @returns {{ok:true}|{ok:false, pendings:any[], message:string}}
 */
export function validateFractions(cart) {
  const pendings = (cart?.items || []).filter(
    (it) => it?.type === 'half' && it?.isPending
  );
  if (pendings.length > 0) {
    return {
      ok: false,
      pendings,
      message:
        pendings.length === 1
          ? 'Você tem 1/2 pizza sem par. Escolha outra 1/2 do mesmo tamanho.'
          : `Você tem ${pendings.length} meias sem par. Complete as combinações.`,
    };
  }
  return { ok: true };
}

/**
 * Rótulo amigável para exibir um item combinado no carrinho.
 * @param {any} line - item do tipo 'half_combo'
 * @returns {string}
 */
export function formatHalfComboLabel(line) {
  if (!line || line.type !== 'half_combo') return '';
  const a = line.components?.[0]?.name || '1/2 A';
  const b = line.components?.[1]?.name || '1/2 B';
  const size = line.size ? ` (${line.size})` : '';
  return `Meia ${a} + Meia ${b}${size}`;
}

/**
 * (Opcional) Helpers para identificar tipos no front
 */
export function isHalfPending(item) {
  return item?.type === 'half' && item?.isPending === true;
}
export function isHalfCombo(item) {
  return item?.type === 'half_combo';
}
