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
  // Se você quiser implementar "borda pendente", valide aqui.
  return true;
}

/**
 * Monta um item "combo de borda" associado a uma pizza alvo.
 * @param {Object} params
 *   - border: { id, nome, preco_medio, preco_grande }
 *   - target: { code, name, size }  // pizza escolhida pelo usuário
 */
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
    name,          // mostrado no checkout
    price,
    preco: price,  // compatível com o resto do app
  };
}
