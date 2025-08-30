 // pages/index.js
import { useMemo, useState } from 'react';
import { CartProvider, useCart } from '../context/CartContext';
import MenuItemCard from '../components/MenuItemCard';
import CartDrawer from '../components/CartDrawer'; 
import { useCart } from '../context/CartContext';


   
const UPSTREAM = 'https://primary-production-d79b.up.railway.app/webhook/cardapio_publico';

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
        preco_grande: toNumber(v?.preco_grande),
        categoria,
        descricao: v?.descricao ?? '',
        imagem,
      };
    });
    return { props: { menu } };
  } catch (e) {
    return { props: { menu: [], error: String(e) } };
  }
}

function HomeInner({ menu, error }) {
  const [cat, setCat] = useState('TODOS');
  const [drawer, setDrawer] = useState(false);
  const { total } = useCart();

  const cats = useMemo(() => {
    const set = new Set(menu.map((m) => m.categoria));
    return ['TODOS', ...Array.from(set)];
  }, [menu]);

  const list = useMemo(() => (cat === 'TODOS' ? menu : menu.filter((m) => m.categoria === cat)), [menu, cat]);

  return (
    <main>
      <div className="header">
        <strong style={{ fontSize: 32 }}><div className="title">🍕 Cardápio</div></strong>
        <div className="badge">Itens: {menu.length}</div>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="toolbar">
        {cats.map((c) => (
          <button key={c} className={`chip ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {list.map((item) => <MenuItemCard key={item.id} item={item} />)}
      </div>

      <button className="fab" onClick={() => setDrawer(true)}>🛒 R$ {Number(total ?? 0).toFixed(2)}</button>
      <CartDrawer open={drawer} onClose={() => setDrawer(false)} />
    </main>
  );
}

 
export default function Home(props) {
  return <HomeInner {...props} />;



