 // pages/api/checkout.js
const N8N_ORDER_URL = 'https://primary-production-d79b.up.railway.app/webhook/pedido_novo'; // ajuste se o seu path for outro
const N8N_API_KEY = ''; // se você exigir header no n8n, preencha aqui

export default async function handler(req, res){
  if(req.method!=='POST') return res.status(405).end('Method not allowed');
  try{
    const payload = req.body || {};
    const r = await fetch(N8N_ORDER_URL, {
      method:'POST',
      headers:{ 'content-type':'application/json', ...(N8N_API_KEY? {'x-api-key':N8N_API_KEY}: {}) },
      body: JSON.stringify(payload)
    });
    const text = await r.text();
    res.status(r.status).setHeader('content-type', r.headers.get('content-type') || 'application/json').send(text);
  }catch(e){
    res.status(500).send(String(e));
  }
}
