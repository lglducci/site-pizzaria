 // SUA URL de cardápio que já abre no navegador:
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

export async function GET(){
  try{
    const r = await fetch(UPSTREAM, { cache:'no-store', headers:{ accept:'application/json' }});
    const text = await r.text();
    if(!r.ok) return new Response(`Upstream ${r.status}: ${text}`, { status: 502 });

    let data; try{ data = JSON.parse(text); } catch { return new Response('Upstream não retornou JSON', { status: 502 }); }
    const arr = pickArray(data);

    const norm = arr.map((v,i)=>({
      id: v.id ?? v.numero ?? i+1,
      nome: v.nome ?? `Item ${i+1}`,
      preco: toNumber(v.preco ?? v.preco_grande ?? v.preco_medio ?? v.valor),
      categoria: String(v.categoria ?? v.tipo ?? 'OUTROS').toUpperCase(),
      descricao: v.descricao ?? '',
      imagem: v.imagem ?? v.imagem_url ?? ''
    }));

    return Response.json(norm);
  }catch(e){
    return new Response('Erro: '+String(e), { status: 500 });
  }
}
