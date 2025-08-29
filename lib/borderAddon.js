 // lib/borderAddon.js
const toNum = (x) => {
  if (typeof x === 'number' && isFinite(x)) return x;
  if (x == null) return 0;
  const s = String(x).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  const n = Number(s);
  return isFinite(n) ? n : 0;
};

export function isBorderCombo(it) {
  return it?.type === 'border_combo';
}
export function ensureNoPendingBorders(items) {
  return true;
}
export function makeBorderCombo({ border, target }) {
  const size = String(target.size || 'G').toUpperCase();
  const price = toNum(size === 'M' ? border.preco_medio : border.preco_grande);
  const codeTxt = target.code ? `${String(target.code).replace(/:.*/, '')} - ` : '';
  const pizzaTxt = `${codeTxt}${target.name} (${size})`;
  const name = `Borda ${border.nome}  ${pizzaTxt}`;
  return {
    id: `border-${border.id}:${target.code}:${size}`,
    type: 'border_combo',
    qtd: 1,
    size,
    borderId: border.id,
    borderName: border.nome,
    targetCode: target.code,
    targetName: target.name,
    name,
    price,
    preco: price,
  };
}
