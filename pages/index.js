// pages/index.js
const UPSTREAM = 'https://primary-production-d79b.up.railway.app/webhook/cardapio_publico';

// helpers
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
      preco: toNumber(v.preco ?? v.valor),                 // preço “unitário” (quando não há tamanhos)
      precoMedio: toNumber(v.preco_medio),
      precoGrande: toNumber(v.preco_grande),
      categoria: String(v.categoria ?? v.tipo ?? 'OUTROS').toUpperCase(),
      descricao: v.descricao ?? '',
      imagem: v.imagem ?? v.imagem_url ?? ''
    }));
    return { props:{ menu } };
  }catch(e){
    return { props:{ menu:[], error:String(e) } };
  }
}

// cart (client)
import { useEffect, useMemo, useState } from 'react';
function useCart(){
  const [items,setItems]=useState([]);
  useEffect(()=>{ try{const s=localStorage.getItem('cart'); if(s) setItems(JSON.parse(s));}catch{} },[]);
  useEffect(()=>{ localStorage.setItem('cart', JSON.stringify(items)); },[items]);
  const total = useMemo(()=> items.reduce((s,it)=> s + it.preco*it.qtd, 0),[items]);
  const add = (p)=> setItems(prev=>{
    const key = p.key;
    const i = prev.findIndex(x=>x.key===key);
    if(i>=0){ const cp=[...prev]; cp[i]={...cp[i], qtd:cp[i].qtd+1}; return cp; }
    return [...prev, {...p, qtd:1}];
  });
  const inc = (key)=> setItems(prev=> prev.map(x=> x.key===key? {...x, qtd:x.qtd+1}:x));
  const dec = (key)=> setItems(prev=> prev.flatMap(x=> x.key===key? (x.qtd>1? [{...x, qtd:x.qtd-1}] : []) : [x]));
  const clear = ()=> setItems([]);
  return { items,total,add,inc,dec,clear };
}

export default function Home({ menu, error }){
  const [cat,setCat]=useState('TODOS');
  const [drawer,setDrawer]=useState(false);
  const { items,total,add,inc,dec,clear } = useCart();



  // formata preço
const fmt = (n) => Number(n || 0).toFixed(2);

// adiciona item “simples” (não-pizza)
const addSimple = (m) => {
  add({
    key: `${m.id}:U`,
    id: m.id,
    nome: m.nome,
    preco: m.preco,
    tamanho: null,
  });
};

// adiciona pizza por tamanho
const addSize = (m, size) => {
  const price = size === 'M' ? m.preco_medio : m.preco_grande;
  if (!price) return;
  add({
    key: `${m.id}:${size}`,
    id: m.id,
    nome: `${m.nome} (${size})`,
    preco: price,
    tamanho: size,
  });
};

// adiciona “meia pizza” (metade do valor do tamanho G)
const addHalf = (m) => {
  if (!m.preco_grande) return;
  const half = m.preco_grande / 2;
  add({
    key: `${m.id}:H`, // usa “H” para identificar 1/2; depois dá pra combinar 2 meias
    id: m.id,
    nome: `${m.nome} (1/2 G)`,
    preco: half,
    tamanho: '1/2',
  });
};


  const cats = useMemo(()=>{
    const set=new Set(menu.map(m=>m.categoria)); return ['TODOS',...Array.from(set)];
  },[menu]);

  const list = useMemo(()=> cat==='TODOS'? menu : menu.filter(m=>m.categoria===cat), [menu,cat]);

  const addItem = (m, tamanho)=>{
    const preco = tamanho==='M' ? (m.precoMedio||m.preco||0) :
                  tamanho==='G' ? (m.precoGrande||m.preco||0) :
                  (m.preco||m.precoMedio||m.precoGrande||0);
    const key = `${m.id}:${tamanho||'U'}`;
    add({ key, id:m.id, nome: m.nome + (tamanho? ` (${tamanho})`:''),
          preco, tamanho: tamanho||null });
  };

  const checkout = async ()=>{
    try{
      const payload = {
        customer: null,  // preencha depois
        items: items.map(i=>({ id:i.id, nome:i.nome, preco:i.preco, qtd:i.qtd, tamanho:i.tamanho })),
        total
      };
      const res = await fetch('/api/checkout',{ method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
      const txt = await res.text();
      if(!res.ok) { alert('Erro no pedido: '+txt); return; }
      try{ const j=JSON.parse(txt); alert('Pedido enviado! #' + (j.pedido_id||'')); }catch{ alert('Pedido enviado!'); }
      clear(); setDrawer(false);
    }catch(e){ alert('Falha: '+e); }
  };

  return (
    <main>
      <div className="header">
        <div className="title">🍕 Cardápio</div>
        <div className="badge">Itens: {menu.length}</div>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="toolbar">
        {cats.map(c=>(
          <button key={c} className={`chip ${cat===c?'active':''}`} onClick={()=>setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="grid">
        {list.map(item=>(
          <div key={item.id} className="card">
            <div className="img" style={{ backgroundImage:`url(${item.imagem || `https://picsum.photos/seed/${item.id}/800/600`})` }} />
            <div className="name">{item.nome}</div>
            <div className="cat">{item.categoria}</div>
            <div style={{ fontSize:13, color:'#444', minHeight:30 }}>{item.descricao}</div>

            <div className="priceRow">
              {/* Tamanhos: se tiver M/G, mostram dois botões; senão, um só */}
              {(item.precoMedio>0 || item.precoGrande>0) ? (
                <>
                  {item.precoMedio>0 && (
                    <button className="btn" onClick={()=>addItem(item,'M')}>Médio · R$ {item.precoMedio.toFixed(2)}</button>
                  )}
                  {item.precoGrande>0 && (
                    <button className="btn primary" onClick={()=>addItem(item,'G')}>Grande · R$ {item.precoGrande.toFixed(2)}</button>
                  )}
                </>
              ) : (
                <button className="btn primary" onClick={()=>addItem(item,null)}>
                  Adicionar · R$ {Number(item.preco||0).toFixed(2)}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* FAB carrinho */}
      <button className="fab" onClick={()=>setDrawer(true)}>🛒 R$ {total.toFixed(2)}</button>

      {/* Drawer carrinho */}
      {drawer && (
        <div className="drawerOverlay" onClick={()=>setDrawer(false)}>
          <div className="drawer" onClick={e=>e.stopPropagation()}>
            <div className="header" style={{marginBottom:8}}>
              <div className="title">Seu pedido</div>
              <button className="btn" onClick={clear}>Limpar</button>
            </div>
            <div style={{ overflow:'auto', flex:1 }}>
              {items.map(it=>(
                <div key={it.key} className="row">
                  <div style={{maxWidth:'60%'}}>
                    <div style={{fontWeight:700}}>{it.nome}</div>
                    <div style={{fontSize:12, color:'#666'}}>R$ {it.preco.toFixed(2)}</div>
                  </div>
                  <div className="qty">
                    <button className="btn small" onClick={()=>dec(it.key)}>-</button>
                    <div>{it.qtd}</div>
                    <button className="btn small" onClick={()=>inc(it.key)}>+</button>
                  </div>
                </div>
              ))}
              {!items.length && <div className="alert">Seu carrinho está vazio.</div>}
            </div>
            <div className="total">
              <div>Total</div>
              <div>R$ {total.toFixed(2)}</div>
            </div>
            <button className="btn primary" style={{marginTop:12}} disabled={!items.length} onClick={checkout}>
              Finalizar pedido
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

