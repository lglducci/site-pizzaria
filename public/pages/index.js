// pages/index.js  —  página única que renderiza seu cardápio direto do n8n

const UPSTREAM = 'https://primary-production-d79b.up.railway.app/webhook/cardapio_publico';

function toNumber(x){ if(typeof x==='number') return x; if(typeof x==='string') return Number(x.replace(/\./g,'').replace(',','.'))||0; return 0; }
function pickArray(x){
  if(Array.isArray(x)) return x;
  if(x && typeof x==='object'){
    const keys = ['items','itens','data','rows','result','results','records','menu','cardapio','payload'];
    for(const k of keys) if(Array.isArray(x[k])) return x[k];
    const anyArr = Object.values(x).find(v => Array.isArray(v));
    if(anyArr) return anyArr;
  }
  return [x];
}

export async function getServerSideProps() {
  try {
    const r = await fetch(UPSTREAM, { headers: { accept: 'application/json' } });
    const text = await r.text();
    if (!r.ok) throw new Error(`Upstream ${r.status}: ${text}`);
    let data; try { data = JSON.parse(text); } catch { throw new Error('Upstream não retornou JSON'); }
    const arr = pickArray(data);
    const menu = arr.map((v,i)=>({
      id: v.id ?? v.numero ?? i+1,
      nome: v.nome ?? `Item ${i+1}`,
      preco: toNumber(v.preco ?? v.preco_grande ?? v.preco_medio ?? v.valor),
      categoria: String(v.categoria ?? v.tipo ?? 'OUTROS').toUpperCase(),
      descricao: v.descricao ?? '',
      imagem: v.imagem ?? v.imagem_url ?? ''
    }));
    return { props: { menu } };
  } catch (e) {
    return { props: { menu: [], error: String(e) } };
  }
}

export default function Home({ menu, error }) {
  return (
    <main style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ margin: 0, marginBottom: 16 }}>Cardápio</h1>
      {error && (
        <div style={{ background:'#fee', border:'1px solid #f99', padding:10, borderRadius:8, marginBottom:12 }}>
          Falha ao carregar cardápio: {error}
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:16 }}>
        {menu.map((item) => (
          <div key={item.id} style={{ border:'1px solid #eee', borderRadius:12, padding:12 }}>
            <div
              style={{
                aspectRatio:'4/3',
                borderRadius:8,
                marginBottom:8,
                backgroundImage:`url(${item.imagem || `https://picsum.photos/seed/${item.id}/800/600`})`,
                backgroundSize:'cover',
                backgroundPosition:'center',
                backgroundColor:'#f4f4f4'
              }}
            />
            <div style={{ fontWeight:700 }}>{item.nome}</div>
            <div>R$ {Number(item.preco || 0).toFixed(2)}</div>
            <div style={{ fontSize:12, color:'#666' }}>{item.categoria}</div>
          </div>
        ))}
      </div>
      {!menu.length && <div style={{ marginTop:12, color:'#666' }}>Sem itens.</div>}
    </main>
  );
}
