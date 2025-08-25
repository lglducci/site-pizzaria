 // app/api/menu/route.js
export async function GET() {
  const url = process.env.N8N_MENU_URL;
  if (!url) return new Response('N8N_MENU_URL ausente', { status: 500 });

  const r = await fetch(url, { cache: 'no-store', headers: { accept: 'application/json' } });
  if (!r.ok) return new Response('Upstream ' + r.status, { status: 502 });

  const data = await r.json().catch(() => null);
  if (!data) return new Response('Upstream não retornou JSON', { status: 502 });

  // garante array (se vier objeto único ou {data:[...]})
  const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [data]);
  return Response.json(arr);
}
