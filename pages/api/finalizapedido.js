 // pages/api/finalizapedido.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const upstream = await fetch(
      'https://webhook.lglducci.com.br/webhook/finalizapedido',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      }
    );

    const contentType = upstream.headers.get('content-type') || 'text/plain';
    const text = await upstream.text();

    res.status(upstream.status);
    res.setHeader('content-type', contentType);
    return res.send(text);
  } catch (e) {
    return res.status(502).json({ error: 'Upstream error', detail: String(e?.message || e) });
  }
}
