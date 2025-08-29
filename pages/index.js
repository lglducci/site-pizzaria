 


// pages/index.js
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CartProvider, useCart } from '../context/CartContext';
import MenuItemCard from '../components/MenuItemCard';
import CartDrawer from '../components/CartDrawer';

const UPSTREAM = 'https://primary-production-d79b.up.railway.app/webhook/cardapio_publico';

// helpers iguais aos seus
function toNumber(x){ if(typeof x==='number') return x; if(typeof x==='string') return Number(x.replace(/\./g,'').replace(',','.'))||0; return 0; }
function pickArray(x){
  if(Array.isArray(x)) return x;
  if(x && typeof x==='object'){
    const keys=['items','itens','data','rows','result','results','records','menu','cardapio','payload'];
    for(const k of keys) if(Array.isArray(x[k])) return x[k];
    const anyArr=Object.values(x).find(v=>Array.isArray(v)); if(anyArr) return anyArr;
  }
  return [x];
}

export async function getServerSideProps(){
  try{
    const r = await fetch(UPSTREAM,{ headers:{ accept:'application/json' }});
    const text = await r.text();
    if(!r.ok) throw new Error(`Upstream ${r.status}: ${text}`);
    let data; try{ data=JSON.parse(text);}catch{ throw new Error('JSON inválido do upstream'); }
    const arr = pickArray(data);
    const menu = arr.map((v,i)=>({
      id: v.id ?? v.numero ?? i+1,
      nome: v.nome ?? `Item ${i+1}`,
      preco: toNumber(v.preco ?? v.valor),
      preco_medio: toNumber(v.preco_medio),
      preco_grande: toNumber(v.preco_grande),
      categoria: String(v.categoria ?? v.tipo ?? 'OUTROS').toUpperCase(),
      descricao: v.descricao ?? '',
      imagem: v.imagem ?? v.imagem_url ?? ''
    }));
    return { props:{ menu } };
  }catch(e){
    return { props:{ menu:[], error:String(e) } };
  }
}

function HomeInner({ menu, error }) {
  const [cat,setCat]=useState('TODOS');
  const [drawer,setDrawer]=useState(false);
  const { total } = useCart();

  const cats = useMemo(()=>{
    const set=new Set(menu.map(m=>m.categoria)); return ['TODOS',...Array.from(set)];
  },[menu]);
  const list = useMemo(()=> cat==='TODOS'? menu : menu.filter(m=>m.categoria===cat), [menu,cat]);

  return (
    <main>
      <div className="header">
        <strong style={{ fontSize:48 }}>
          <div className="title">🍕 Cardápio</div>
        </strong>
        <div className="badge">Itens: {menu.length}</div>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="toolbar">
        {cats.map(c=>(
          <button key={c} className={`chip ${cat===c?'active':''}`} onClick={()=>setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {list.map(item=>(
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>

      {/* FAB carrinho */}
      <button className="fab" onClick={()=>setDrawer(true)}>🛒 R$ {Number(total).toFixed(2)}</button>

      {/* Drawer carrinho */}
      <CartDrawer open={drawer} onClose={()=>setDrawer(false)} />
    </main>
  );
}

export default function Home(props){
  return (
    <CartProvider>
      <HomeInner {...props} />
    </CartProvider>
  );
}

