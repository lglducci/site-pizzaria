 

// app/api/menu/route.js
// Proxy robusto: busca do endpoint externo, trata CORS, normaliza formato
export async function GET() {
  try {
    const upstream = process.env.N8N_MENU_URL; // URL que já funciona no seu navegador
    if (!upstream) return new Response('N8N_MENU_URL ausente', { status: 500 });

    const r = await fetch(upstream, { cache: 'no-store', headers: { accept: 'application/json' } });
    const text = await r.text();
    if (!r.ok) return new Response(`Upstream ${r.status}: ${text}`, { status: 502 });

    // tenta ler JSON; se vier objeto {data:[...]} ou item único, normaliza
    let raw;
    try { raw = JSON.parse(text); } catch { return new Response(`Upstream não retornou JSON: ${text}`, { status: 502 }); }
    const arr = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : [raw]);

    // mapeia campos comuns para o formato esperado pelo site
    const norm = arr.map((v, i) => {
      const id =
        v.id ?? v.numero ?? v.item_id ?? i + 1;

      // converte preço (string com vírgula ou número)
      let preco = v.preco ?? v.preco_grande ?? v.preco_medio ?? v.valor ?? 0;
      if (typeof preco === 'string') preco = Number(preco.replace(/\./g, '').replace(',', '.'));
      preco = Number(preco) || 0;

      const categoria = String(v.categoria ?? v.tipo ?? 'OUTROS').toUpperCase();

      return {
        id,
        nome: v.nome ?? v.titulo ?? `Item ${id}`,
        preco,
        categoria,
        descricao: v.descricao ?? '',
        imagem: v.imagem ?? v.imagem_url ?? '' // deixe vazio se não tiver URL pública
      };
    });

    return Response.json(norm);
  } catch (e) {
    return new Response('Erro: ' + String(e), { status: 500 });
  }
}
