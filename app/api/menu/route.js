 
// app/api/menu/route.js
export async function GET() {
  try {
    const url = process.env.N8N_MENU_URL;
    if (!url) return new Response('N8N_MENU_URL ausente', { status: 500 });

    const r = await fetch(url, { cache: 'no-store', headers: { accept: 'application/json' } });
    const text = await r.text(); // pega conteúdo mesmo se não for JSON
    if (!r.ok) {
      console.error('n8n upstream error', r.status, text);
      return new Response(`Upstream falhou (${r.status}): ${text}`, { status: 502 });
    }
    try {
      const data = JSON.parse(text);
      return Response.json(data);
    } catch {
      // upstream não retornou JSON válido
      return new Response(`Upstream não retornou JSON: ${text}`, { status: 502 });
    }
  } catch (e) {
    console.error('proxy error', e);
    return new Response('Erro: ' + String(e), { status: 500 });
  }
}
