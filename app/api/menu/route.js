 // app/api/menu/route.js
// Coloque aqui a SUA URL que já abre JSON no navegador (a que devolveu a Fanta)
const UPSTREAM = 'https://primary-production-d79b.up.railway.app/webhook/cardapio_publico';

function toNumber(x) {
  if (typeof x === 'number') return x;
  if (typeof x === 'string') {
    // 12,50  -> 12.50 ; 1.234,56 -> 1234.56
    return Number(x.replace(/\./g, '').replace(',', '.')) || 0;
  }
  return 0;
}

export async function GET() {
  try {
    const r = await fetch(UPSTREAM, { cache: 'no-store', headers: { accept: 'application/json' } });
    const text = await r.text();
    if (!r.ok) return new Response(`Upstream ${r.status}: ${text}`, { status: 502 });

    let data; try { data = JSON.parse(text); } catch { return new Response('Upstream não retornou JSON', { status: 502 }); }

    // aceita: array, {data:[...]}, ou item único
    const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [data]);

    // mapeia seus campos para o formato da UI
    const norm = arr.map((v, i) => ({
      id: v.id ?? v.numero ?? v.item_id ?? (i + 1),
      nome: v.nome ?? v.titulo ?? `Item ${i + 1}`,
      preco: toNumber(v.preco ?? v.preco_grande ?? v.preco_medio ?? v.valor),
      categoria: String(v.categoria ?? v.tipo ?? 'OUTROS').toUpperCase(),
      descricao: v.descricao ?? '',
      imagem: v.imagem ?? v.imagem_url ?? '' // se vazio, a UI usa placeholder
    }));

    return Response.json(norm);
  } catch (e) {
    return new Response('Erro: ' + String(e), { status: 500 });
  }
}
