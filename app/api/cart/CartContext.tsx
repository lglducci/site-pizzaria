"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = { id: string|number; nome: string; preco: number; qtd: number };

type Cart = {
  items: CartItem[];
  add: (p: Omit<CartItem, "qtd">) => void;
  inc: (id: any) => void;
  dec: (id: any) => void;
  clear: () => void;
  total: number;
};
const Ctx = createContext<Cart>(null!);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => { try { const s = localStorage.getItem("cart"); if (s) setItems(JSON.parse(s)); } catch {} }, []);
  useEffect(() => { localStorage.setItem("cart", JSON.stringify(items)); }, [items]);

  const api = useMemo(() => ({
    items,
    add: (p: Omit<CartItem, "qtd">) => setItems(prev => {
      const i = prev.findIndex(it => it.id === p.id);
      if (i >= 0) { const cp = [...prev]; cp[i] = { ...cp[i], qtd: cp[i].qtd + 1 }; return cp; }
      return [...prev, { ...p, qtd: 1 }];
    }),
    inc: (id: any) => setItems(prev => prev.map(it => it.id === id ? { ...it, qtd: it.qtd + 1 } : it)),
    dec: (id: any) => setItems(prev => prev.flatMap(it => it.id === id ? (it.qtd > 1 ? [{ ...it, qtd: it.qtd - 1 }] : []) : [it])),
    clear: () => setItems([]),
    total: items.reduce((s, it) => s + it.preco * it.qtd, 0),
  }), [items]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
export const useCart = () => useContext(Ctx);
