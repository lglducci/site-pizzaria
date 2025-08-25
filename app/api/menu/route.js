 // app/api/menu/route.js
import { headers } from 'next/headers';

export async function GET() {
  try {
    const h = headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    const proto = h.get('x-forwarded-proto') ?? 'https';
    const url = `${proto}://${host}/menu.json`;

    const r = await fetch(url, { cache: 'no-store', headers: { accept: 'application/json' } });
    if (!r.ok) return new Response('menu.json não encontrado', { status: 500 });

    const data = await r.json();
    const arr = Array.isArray(data) ? data : [data];
    return Response.json(arr);
  } catch (e) {
    return new Response('Erro: ' + String(e), { status: 500 });
  }
}
