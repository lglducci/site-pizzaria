 // app/api/menu/route.js

// SUA URL do n8n (a que você abriu no navegador e mostrou um monte de itens)
const UPSTREAM = 'https://primary-production-d79b.up.railway.app/webhook/cardapio_publico';

// -------- utilidades
function toNumber(x){
  if (typeof x === 'number') return x;
  if (typeof x === 'string') return Number(x.replace(/\./g,'').replace(',','.')) || 0;
  return 0;
}

// aceita array direto, {items:[...]}, {data:[...]}, etc.
function pickArray(x){
  if (Array.isArray(x)) return x;
  if (x && typeof x === 'object'){
    const keys = ['items','itens','data','rows','result','results','records','menu','cardapio','payload'];
    for (const k of keys) if (Array.isArray(x[k])) return x[k];
    const anyArr = Object.values(x).find(v => Array.isArray(v));
    if (anyArr) return anyArr;
  }
  return [x];
}

async function getUpstream() {
  const r = await fetch(UPSTREAM, {
    cache: 'no-store',
    headers: { accept: 'application/json' }
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Upstream ${r.status}: ${text}`);
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Upstream não retornou JSON'); }
  return pickArray(data);
}

async function getFallback() {
  // fallback: /public/menu.json (se existir)
  const r = await fetch(new URL('/menu.json', process.env.NEXT_PUBLIC_SITE_ORIGIN || 'http://localhost'), {
    // em produção, URL absoluta não existe; usamos caminho relativo:
    cache: 'no-store'
  }).catch(() => null);

  // caminho relativo (produção)
  if (!r || !r.ok) {
    try {
      const rr = await fetch('/menu.json', { cache: 'no-store' });
      if (!rr.ok) throw new Error('sem fallback');
      return await rr.json();
    } catch {
      return [];
    }
  }
  return await r.json();
}

export async function GET() {
  try {
    let arr;
    try {
      arr = await getUpstream();       // 1ª tentativa: n8n
    } catch {
      arr = await getFallback();       // fallback: public/menu.json (se quiser usar)
    }

    // normaliza para o formato que a UI espera
    const norm = arr.map((v, i) => ({
      id: v.id ?? v.numero ?? i + 1,
      nome: v.nome ?? `Item ${i + 1}`,
      preco: toNumber(v.preco ?? v.preco_grande ?? v.preco_medio ?? v.valor),
      categoria: String(v.categoria ?? v.tipo ?? 'OUTROS').toUpperCase(),
      descricao: v.descricao ?? '',
      imagem: v.imagem ?? v.imagem_url ?? ''
    }));

    return Response.json(norm);
  } catch (e) {
    return new Response('Erro: ' + String(e), { status: 500 });
  }
}
