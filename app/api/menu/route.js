export async function GET() {
  try {
    // Lê do env no servidor (não expõe no cliente)
    const url = process.env.N8N_MENU_URL;
    if (!url) return new Response('N8N_MENU_URL ausente', { status: 500 });

    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return new Response('Upstream n8n falhou', { status: 502 });

    const data = await r.json();
    return Response.json(data); // devolve JSON pro navegador
  } catch (e) {
    return new Response('Erro: ' + String(e), { status: 500 });
  }
}
