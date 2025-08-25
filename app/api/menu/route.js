// SEM usar variável. Coloque aqui a URL que já abre o JSON no navegador.
const UPSTREAM = 'https://primary-production-d79b.up.railway.app/webhook/cardapio_publico';

export async function GET() {
  try {
    const r = await fetch(UPSTREAM, { cache: 'no-store', headers: { accept: 'application/json' } });
    const text = await r.text();
    if (!r.ok) return new Response(`Upstream ${r.status}: ${text}`, { status: 502 });

    let data;
    try { data = JSON.parse(text); } catch { return new Response('Upstream não retornou JSON', { status: 502 }); }

    // garante um array
    const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [data]);
    return Response.json(arr);
  } catch (e) {
    return new Response('Erro: ' + String(e), { status: 500 });
  }
}
