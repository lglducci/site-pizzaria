 // pages/confirmacao.js
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Confirmacao() {
  const [data, setData] = useState(null);

  useEffect(() => {
    try {
      const s = sessionStorage.getItem('pedido_confirmacao');
      if (s) setData(JSON.parse(s));
    } catch {}
  }, []);

  if (!data) {
    return (
      <main style={{ maxWidth: 760, margin: '24px auto', padding: 16 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#0f172a' }}>
          <span role="img" aria-label="check">✅</span> Confirmação de Pedido
        </h2>
        <div style={{
          background: '#fff',
          border: '1px solid #e5e5e5',
          borderRadius: 8,
          padding: 16
        }}>
          <p style={{ color: '#0f172a' }}>
            Não encontrei dados deste pedido. Volte para o <Link href="/checkout">checkout</Link> e envie novamente.
          </p>
        </div>
      </main>
    );
  }

  const { resposta, payloadEnviado, timestamp } = data;
  const cliente = payloadEnviado?.cliente || {};
 const enderecoStr = [cliente?.endereco, cliente?.bairro].filter(Boolean).join(' — ');

  const valores = {
    subtotal: payloadEnviado?.subtotal ?? 0,
    taxaEntrega: payloadEnviado?.taxaEntrega ?? 0,
    total: payloadEnviado?.total ?? 0,
  };






 // const pedidoId = resposta?.id || resposta?.pedidoId || resposta?.numero || resposta?.raw;


// tenta achar o número do pedido em campos comuns do backend
const extraiNumeroPedido = (r) => {
  if (!r) return '';
  const candidatos = [
    r.numero, r.pedidoNumero, r.pedidoId, r.pedido_id, r.id,
    r.orderNumber, r.order_id, r.order, r?.data?.numero, r?.data?.id
  ].filter(Boolean);

  if (!candidatos.length && typeof r?.raw === 'string') {
    const m = r.raw.match(/\d{3,}/); // pega dígitos se vier em texto
    if (m) return m[0];
  }
  return String(candidatos[0] ?? '').trim();
};

const pedidoId = extraiNumeroPedido(resposta);







  return (
    <main style={{ maxWidth: 760, margin: '24px auto', padding: 16 }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#0f172a' }}>
        <span role="img" aria-label="check">✅</span> Pedido confirmado
      </h2>

      <div style={{
        background: '#fff',
        border: '1px solid #e5e5e5',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16
      }}>
        <p style={{ margin: 0, color: '#0f172a' }}>
          Obrigado, <strong>{cliente.nome || 'cliente'}</strong>!
        </p>
        {pedidoId ? (
          <p style={{ marginTop: 8, color: '#0f172a' }}>
            Número/Retorno do pedido: <strong>{String(pedidoId)}</strong>
          </p>
        ) : null}
        <p style={{ marginTop: 8, color: '#0f172a' }}>
          Total: <strong>R$ {Number(valores.total).toFixed(2)}</strong>
        </p>
        <p style={{ marginTop: 8, color: '#0f172a' }}>
          Enviado em: {new Date(timestamp).toLocaleString()}
        </p>
      </div>

      <div style={{
        background: '#fff',
        border: '1px solid #e5e5e5',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16
      }}>
        <h3 style={{ marginTop: 0, color: '#0f172a' }}>Resumo do pedido</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, color: '#0f172a' }}>
          <div>Subtotal</div>
          <div>R$ {Number(valores.subtotal).toFixed(2)}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, color: '#0f172a' }}>
          <div>Taxa de entrega</div>
          <div>R$ {Number(valores.taxaEntrega).toFixed(2)}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontWeight: 700, fontSize: 18, color: '#0f172a' }}>
          <div>Total</div>
          <div>R$ {Number(valores.total).toFixed(2)}</div>
        </div>

        <ul style={{ marginTop: 12, paddingLeft: 18, color: '#0f172a' }}>
          {(payloadEnviado?.itens || []).map((l, i) => (
            <li key={i}>{l.qtd}x {l.descricao} — R$ {Number(l.preco).toFixed(2)}</li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 16 }}>
        <Link href="/"><button style={{
          background: '#dc2626', color: '#fff',
          padding: '10px 16px', border: 0, borderRadius: 8, cursor: 'pointer'
        }}>Novo Pedido</button></Link>
      </div>

      <style jsx global>{` body { background: #f5f5f5; } `}</style>
 

      {/* Rodapé / Mensagens finais */}
      <footer style={{ textAlign: 'center', marginTop: 24, color: '#0f172a' }}>
        <div style={{ marginBottom: 6 }}>
          Seu pedido foi enviado para o seu WhatsApp
          {cliente?.telefone ? ` (${cliente.telefone})` : ''}.
        </div>

        {pedidoId ? (
          <div style={{ marginBottom: 10 }}>
            Número do pedido: <strong>{pedidoId}</strong>
          </div>
        ) : null}

        <div style={{ whiteSpace: 'pre-wrap', opacity: 0.9 }}>
          {'Muito Obrigado!!\n© 2025 Luis Gustavo Landucci — Right by LG™'}
          <p style={{ marginTop: 8, color: '#0f172a' }}>
           Entrega para: <strong>{enderecoStr || '—'}</strong>
         </p>
        </div>
      </footer>




         
    </main>
  );
}
