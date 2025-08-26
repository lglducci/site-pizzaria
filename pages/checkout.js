 // pages/checkout.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [pagamento, setPagamento] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cart');
      const list = raw ? JSON.parse(raw) : [];
      setItems(list);
      const total = list.reduce((sum, item) => sum + item.preco * item.qtd, 0);
      setTotal(total);
    } catch {
      setItems([]);
    }
  }, []);

  const enviarPedido = async () => {
    if (!nome || !telefone || !endereco || !bairro || !pagamento) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }

    setErro('');
    setLoading(true);

    const payload = {
      cliente: { nome, telefone, endereco, bairro, pagamento },
      items: items.map(i => ({
        id: i.id,
        nome: i.nome,
        qtd: i.qtd,
        preco: i.preco,
        tamanho: i.tamanho
      })),
      total
    };

    try {
      await fetch('https://primary-production-d79b.up.railway.app/webhook/finalizapedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      alert('Pedido enviado com sucesso!');
      localStorage.removeItem('cart');
      router.push('/');
    } catch (e) {
      alert('Erro ao enviar pedido: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
   <main
  style={{
    padding: '20px',
    maxWidth: '420px',
    margin: 'auto',
    width: '100vw',
    minHeight: '100vh',
    background: '#f4f7fb'
  }}
>
      <h2 style={{ textAlign: 'center' }}>🧾 Finalizar Pedido</h2>

      {erro && <div style={{ color: 'red', marginBottom: 10 }}>{erro}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="👤 Seu nome completo" className="input" />
        <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="📞 Telefone com DDD" className="input" />
        <input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="🏠 Rua, número" className="input" />
        <input value={bairro} onChange={e => setBairro(e.target.value)} placeholder="📍 Bairro" className="input" />
        <select value={pagamento} onChange={e => setPagamento(e.target.value)} className="input">
          <option value="">💳 Forma de pagamento</option>
          <option value="Dinheiro">Dinheiro</option>
          <option value="Pix">Pix</option>
          <option value="Cartão de Crédito">Cartão de Crédito</option>
          <option value="Cartão de Débito">Cartão de Débito</option>
        </select>
      </div>

      <hr style={{ margin: '18x 0' }} />

 

<h4>🧺 Seu Pedido</h4>
<div style={{ background: '#f9f9f9', padding: 10, borderRadius: 6 }}>
  {items.map((item, idx) => (
    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
      <span>{item.qtd}x <strong>-{item.id}</strong> {item.nome}</span>
      <span>R$ {(item.preco * item.qtd).toFixed(2)}</span>
    </div>
  ))}
 <div style={{ marginTop: 10 }}>
  <div style={{ fontSize: 14 }}>
    🛵 Taxa de entrega: R$ 3,00
  </div>

  <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #ccc' }} />

  <strong style={{ fontSize: 16 }}>
    Total: R$ {(total + 3).toFixed(2)}
  </strong>
</div>
</div>






         

      <button
        className="btn primary"
        style={{ marginTop: 24, width: '100%', padding: 12, fontSize: 16 }}
        onClick={enviarPedido}
        disabled={loading}
      >
        {loading ? 'Enviando...' : '✅ Confirmar Pedido'}
      </button>
    </main>
  );
}
