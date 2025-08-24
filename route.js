export async function POST(req) {
  try {
    const body = await req.json();
    const url  = process.env.N8N_ORDER_URL;
    const key  = process.env.N8N_ORDER_API_KEY;

    if(!url) return new Response(JSON.stringify({error:'N8N_ORDER_URL ausente'}), { status: 500 });

    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(key ? {'x-api-key': key} : {}),
      },
      body: JSON.stringify(body),
      // sem cache; n8n precisa receber sempre
      cache: 'no-store',
    });

    if(!r.ok){
      const txt = await r.text();
      return new Response(JSON.stringify({error:'n8n', status:r.status, body:txt}), { status: 502 });
    }

    const data = await r.json().catch(()=>({ok:true}));
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({error:String(e)}), { status: 500 });
  }
}
