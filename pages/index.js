 // pages/index.js
import { useMemo, useState } from 'react';
import { useCart } from '../context/CartContext';
import MenuItemCard from '../components/MenuItemCard';

// endpoint do cardápio
const UPSTREAM = 'https://primary-production-d79b.up.railway.app/webhook/cardapio_publico';

// helpers
function toNumber(x) {
  if (typeof x === 'number' && isFinite(x)) return x;
  if (x == null) return 0;
  const s = String(x)
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const n = Number(s);
  return isFinite(n) ? n : 0;
}
function pickArray(x) {
  if (Array.isArray(x)) return x;
  if (x && typeof x === 'object') {
    const keys = ['items','itens','data','rows','result','results','records','menu','cardapio','payload'];
    for (const k of keys) if (Array.isArray(x[k])) return x[k];
    const anyArr = Object.values(x).find((v) => Array.isArray(v));
    if (anyArr) return anyArr;
  }
  return [x];
}

// SSR: busca o cardápio
export async function getServerSideProps() {
  try {
    const r = await fetch(UPSTREAM, { headers: { accept: 'application/json' } });
    const text = await r.text();
    if (!r.ok) throw new Error(`Upstream ${r.status}: ${text}`);
    let data; try { data = JSON.parse(text); } catch { throw new Error('JSON inválido do upstream'); }
    const arr = pickArray(data);
    const menu = arr.map((v, i) => {
      const nome = v?.nome ?? v?.descricao ?? `Item ${i + 1}`;
      const categoria = String(v?.categoria ?? v?.tipo ?? 'OUTROS').toUpperCase();
      const imagem = v?.imagem || v?.imagem_url || '';

      const precoBase = v?.preco ?? v?.valor ?? v?.preco_venda ?? v?.precoUnitario ?? v?.price;
      return {
        id: v?.id ?? v?.numero ?? i + 1,
        nome,
        preco: toNumber(precoBase),
        preco_medio: toNumber(v?.preco_medio),
        preco_grande:
