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

  // Carrega carrinho do localStorage
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
      alert('Preencha todos os campos.');
      return;
    }

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
    }
  };

  return (
    <main style={{ padding: '20px', maxWidth: 500, margin: 'auto' }}>
      <h2>📝 Finalizar Pedido</h2>

      <label>Nome:</label>
      <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" />

      <label>Telefone:</label>
      <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(DDD) 90000-0000" />

      <label>Endereço:</label>
      <input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua e número" />

      <label>Bairro:</label>
      <input value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Bairro" />

      <label>Forma de pagamento:</label>
      <select value={pagamento} onChange={e => setPagamento(e.target.value)}>
        <option value="">Selecione</option>
        <option value="Dinheiro">Dinheiro</option>
        <option value="Pix">Pix</option>
        <option value="Cartão de Crédito">Cartão de Crédito</option>
        <option value="Cartão de Débito">Cartão de Débito</option>
      </select>

      <div style={{ marginTop: 20 }}>
        <strong>Total: R$ {total.toFixed(2)}</strong>
      </div>

      <button style={{ marginTop: 20 }} className="btn primary" onClick={enviarPedido}>
        Confirmar Pedido
      </button>
    </main>
  );
}
