// lib/cart.js
// Normaliza qualquer campo de categoria vindo do cardápio
export const normalizeCategory = (src) => {
  const v = String(src || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim();
  if (!v) return '';
  if (['borda','bordas','borda recheada','recheio','recheios'].includes(v)) return 'borda';
  if (v.startsWith('pizza')) return 'pizza';
  if (v.includes('bebida') || ['refri','refrigerante'].includes(v)) return 'bebida';
  if (v.includes('esfirra')) return 'esfirra';
  return v;
};

// Adiciona item ao carrinho GARANTINDO category/categoria
export function addToCart(rawItem, overrides = {}) {
  const cat = normalizeCategory(
    overrides.category ??
    rawItem.categoria ?? rawItem.category ?? rawItem.tipo ?? rawItem.grupo ?? rawItem.cat
  );

  const cartItem = {
    id: rawItem.id,
    code: rawItem.codigo ?? rawItem.code ?? null,
    name: rawItem.nome ?? rawItem.name ?? 'Item',
    size: overrides.size ?? rawItem.tamanho ?? rawItem.size ?? null,
    price: +(
      overrides.price ??
      rawItem.preco ??
      rawItem.price ??
      0
    ),
    qtd: +(overrides.qtd ?? rawItem.qtd ?? 1),
    category: cat,    // << ESSENCIAL
    categoria: cat,   // duplica por segurança
    // copie aqui quaisquer outros campos que você já usa no checkout
  };

  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  cart.push(cartItem);
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Rodar uma vez para MIGRAR carrinhos antigos que estão sem categoria
export function migrateCartCategories() {
  try {
    const s = localStorage.getItem('cart');
    if (!s) return;
    const arr = JSON.parse(s);
    if (!Array.isArray(arr)) return;
    const fixed = arr.map(it => {
      const cat = normalizeCategory(it.category ?? it.categoria ?? it.tipo ?? it.grupo ?? it.cat);
      return { ...it, category: cat, categoria: cat };
    });
    localStorage.setItem('cart', JSON.stringify(fixed));
  } catch {}
}
