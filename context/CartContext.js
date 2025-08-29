// context/CartContext.js
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { smartAdd } from '../lib/cartSmartAdd';

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  // carrega do localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem('cart');
      if (s) setItems(JSON.parse(s));
    } catch {}
  }, []);
  // salva no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch {}
  }, [items]);

  const total = useMemo(
    () => items.reduce((s, it) => s + Number(it.price ?? it.preco) * (it.qtd || 1), 0),
    [items]
  );

  // adiciona (passa pelo smartAdd)
  const addItem = (payload) => {
    setItems((prev) => smartAdd(prev, payload));
  };

  const inc = (id) =>
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, qtd: (x.qtd || 1) + 1 } : x))
    );

  const dec = (id) =>
    setItems((prev) =>
      prev.flatMap((x) =>
        x.id === id ? ((x.qtd || 1) > 1 ? [{ ...x, qtd: x.qtd - 1 }] : []) : [x]
      )
    );

  const clear = () => setItems([]);

  const value = { items, total, addItem, inc, dec, clear };
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
