   // lib/pizzaFractions.js
const toNum = (x) => {
  if (typeof x === 'number' && isFinite(x)) return x;
  if (x == null) return 0;
  const s = String(x).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  const n = Number(s);
  return isFinite(n) ? n : 0;
};

// <<< NOVO: normaliza código e “limpa” o nome da meia >>>
const normCode = (c) => (c == null ? '' : String(c).replace(/:.*/, '')); // remove qualquer sufixo (ex.: ":H")
const cleanHalfName = (s) =>
  String(s)
    .replace(/^Meia\s+/i, '')
    .replace(/^\d+[^ ]*\s*/, '')   // remove “24:”, “24:H”, “24-ALGO” até o 1º espaço
    .replace(/\s*\(1\/2\)\s*$/i, '')
    .trim();

function makeHalfPending(half) {
  const id = `half-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const price = toNum(half.price);
  const code = normCode(half.code ?? half.productId ?? '');
  const base = half.name; // nome puro do sabor
  const display = `Meia ${code ? code + ' ' : ''}${base} (1/2)`; // <<< mostra “Meia 24 Confete (1/2)”
  return {
    id,
    type: 'half',
    isPending: true,
    productId: half.productId,
    code,
    name: display,
    baseName: base, // <<< guardo o nome puro para o combo
    size: half.size || 'G',
    price,
    preco: price,
    qtd: 1,
    meta: { ...half.meta },
  };
} 

 function makeHalfCombo(a, b, priceRule = 'max') {
  const id = `combo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const size = a.size || b.size || 'G';

  // preços de cada meia (como vieram no item)
  const halfA = toNum(a.price);
  const halfB = toNum(b.price);

  // preço CHEIO de cada sabor (preferir o enviado; fallback = meia*2)
  const fullA = toNum(a.fullPrice ?? halfA * 2);
  const fullB = toNum(b.fullPrice ?? halfB * 2);

  // code normalizado e nome “limpo”
  const codeA = normCode(a.code ?? a.productId ?? '');
  const codeB = normCode(b.code ?? b.productId ?? '');
  const nameA = cleanHalfName(a.baseName ?? a.name);
  const nameB = cleanHalfName(b.baseName ?? b.name);

  // preço do combo de meias
  let price = 0;
  // Regra de pizzaria: COBRAR O VALOR CHEIO da mais cara
  if (priceRule === 'max') price = Math.max(fullA, fullB);
  else if (priceRule === 'sum') price = halfA + halfB;
  else if (priceRule === 'avg') price = (halfA + halfB) / 2;
  else price = Math.max(fullA, fullB);

  const pretty =
    `Meia ${codeA ? codeA + ' ' : ''}${nameA} (1/2) + ` +
    `Meia ${codeB ? codeB + ' ' : ''}${nameB} (1/2) (${size})`;

  return {
    id,
    type: 'half_combo',
    qtd: 1,
    size,
    halves: [
      { productId: a.productId, code: codeA, name: nameA, price: halfA },
      { productId: b.productId, code: codeB, name: nameB, price: halfB },
    ],
    name: pretty,
    price,
    preco: price,
    meta: {},
  };
}

export function isHalfCombo(it) { return it && it.type === 'half_combo'; }
export function isHalfPending(it) { return it && it.type === 'half' && it.isPending; }
export function formatHalfComboLabel(it) { return it?.name || ''; } // já vem pronto

export function addHalfToCart(cart, half, opts = {}) {
  const priceRule = opts.priceRule || 'max';
  const items = Array.isArray(cart.items) ? [...cart.items] : [];

  const idx = items.findIndex((it) => isHalfPending(it) && (it.size || 'G') === (half.size || 'G'));
  if (idx >= 0) {
    const pending = items[idx];
    const combo = makeHalfCombo(
      {
        productId: pending.productId,
        code: pending.code,
        name: pending.name,
        baseName: pending.baseName,
        price: pending.price,
        size: pending.size,
      },
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



