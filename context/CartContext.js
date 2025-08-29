 // context/CartContext.js
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { smartAdd } from '../lib/cartSmartAdd';

const CartCtx = createContext(null);

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

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const s = localStorage.getItem('cart');
      if (s) setItems(JSON.parse(s));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch {}
  }, [items]);

  const total = useMemo(
    () => items.reduce((s, it) => s + toNum(it?.price ?? it?.preco) * (it?.qtd || 1), 0),
    [items]
  );

  const addItem = (payload) => setItems((prev) => smartAdd(prev, payload));
  const inc = (id) => setItems((prev) => prev.map((x) => (x.id === id ? { ...x, qtd: (x.qtd || 1) + 1 } : x)));
  const dec = (id) =>
    setItems((prev) => prev.flatMap((x) => (x.id === id ? ((x.qtd || 1) > 1 ? [{ ...x, qtd: x.qtd - 1 }] : []) : [x])));
  const clear = () => setItems([]);

  return (
    <CartCtx.Provider value={{ items, total, addItem, inc, dec, clear }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartCtx);
  // fallback seguro se algum componente for avaliado fora do provider
  return ctx ?? { items: [], total: 0, addItem: () => {}, inc: () => {}, dec: () => {}, clear: () => {} };
}
