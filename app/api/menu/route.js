 // app/api/menu/route.js
// Cole aqui a SUA URL que já abre JSON no navegador:
const UPSTREAM = 'https://primary-production-d79b.up.railway.app/webhook/cardapio_publico';

function toNumber(x) {
  if (typeof x === 'number') return x;
  if (typeof x === 'string') return Number(x.replace(/\./g, '').replace(',', '.')) || 0;
  return 0;
}

function firstArray(x) {
  if (Array.isArray(x)) return x;
  if (x && typeof x === 'object') {
    const keys = ['data','result','results','rows','records','items','itens','produtos','menu','cardapio','payload'];
    for (const k of keys) {
      const v = x[k];
      if (Array.isArray(v)) return v;
      if (v && typeof v === 'object') {
        for (const kk of keys) if (Array.isArray(v[kk])) return v[kk];
      }
    }
    const anyArr = Object.values(x).find(v => Array.isArray(v));
    if (anyArr) return anyArr;
  }
  return [x]; // objeto único
}

function normalize(arr) {
  return arr.map((v, i) => ({
    id: v.id ?? v.numero ?? v.item_id ?? (i + 1),
    nome: v.nome ?? v.titulo ?? `Item ${i + 1}`,
    preco: toNumber(v.preco ?? v.preco_grande ?? v.preco_medio ?? v.valor),
    categoria: String(v.categoria ?? v.tipo ?? 'OUTROS').toUpperCase(),
    descricao: v.descricao ?? '',
    imagem: v.imagem ?? v.imagem_url ?? '', // se vazio, a UI usa placeholder
  }));
}

export async function GET(req) {
  try {
    const r = await fetch(UPSTREAM, { cache: 'no-store', headers: { accept: 'application/json' } });
    const text = await r.text();
    if (!r.ok) return new Response(`Upstream ${r.status}: ${text}`, { status: 502 });

    let data; try { data = JSON.parse(text); } catch { return new Response('Upstream não retornou JSON', { status: 502 }); }
    const arr = firstArray(data);
    const norm = normalize(arr);

    // modo debug: /api/menu?debug=1
    const dbg = new URL(req.url).searchParams.get('debug');
    if (dbg === '1') {
      const keys = Array.isArray(data) ? [] : Object.keys(data || {});
      return Response.json({
        upstream: UPSTREAM,
        rawType: Array.isArray(data) ? 'array' : typeof data,
        rawKeys: keys,
        count: norm.length,
        sample: norm.slice(0, 5),
      });
    }

    return Response.json(norm);
  } catch (e) {
    return new Response('Erro: ' + String(e), { status: 500 });
  }
}
