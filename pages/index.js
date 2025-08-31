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
        numero: v?.numero ?? v?.id ?? i + 1,
        nome,
        descricao: v?.descricao ?? '',
        categoria,
        imagem,
        preco: toNumber(precoBase),
        preco_medio: toNumber(v?.preco_medio),
        preco_grande: toNumber(v?.preco_grande),
      };
    });
    return { props: { menu } };
  } catch (e) {
    return { props: { menu: [], error: String(e) } };
  }
}

function HomeInner({ menu, error }) {
  const [cat, setCat] = useState('TODOS');
  const { total } = useCart();

  const cats = useMemo(() => {
    const set = new Set(menu.map((m) => m.categoria));
    return ['TODOS', ...Array.from(set)];
  }, [menu]);

  const list = useMemo(() => (cat === 'TODOS' ? menu : menu.filter((m) => m.categoria === cat)), [menu, cat]);

  return (
    <main style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 28 }}>🍕 Cardápio</div>
        <span style={{ background: '#eee', padding: '2px 8px', borderRadius: 999 }}>
          Itens: {menu.length}
        </span>
        <span style={{ marginLeft: 'auto' }}>🛒 R$ {Number(total ?? 0).toFixed(2)}</span>
      </div>

      {error ? (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8, marginBottom: 12 }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {cats.map((c) => (
          <button
            key={c}
            className={`chip ${cat === c ? 'active' : ''}`}
            onClick={() => setCat(c)}
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              border: '1px solid #ddd',
              background: cat === c ? '#111' : '#fff',
              color: cat === c ? '#fff' : '#111',
              cursor: 'pointer',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {list.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}

export default function Home(props) {
  return <HomeInner {...props} />;
}
