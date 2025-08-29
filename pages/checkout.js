 // pages/checkout.js
import { useEffect, useMemo, useState } from 'react';
import { ensureNoPendingFractions } from '../lib/cartSmartAdd';
import { isHalfCombo, isHalfPending } from '../lib/pizzaFractions';
import { isBorderCombo, ensureNoPendingBorders } from '../lib/borderAddon';

// >>> CONFIGURE <<<
const WHATSAPP_NUMBER = '5599999999999'; // DDI+DDD+NUM (ex.: 5511999999999)
const DELIVERY_FEE = 3.00;               // taxa de entrega

const fmt = (n) => Number(n ?? 0).toFixed(2);
const toNum = (x) => {
  if (typeof x === 'number' && isFinite(x)) return x;
  if (x == null) return 0;
  const s = String(x)
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const n = Number(s);
  return isFinite(n) ? n : 0;
};

export default function Checkout() {
  // --------- FORM ---------
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [ruaNumero, setRuaNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [pagamento, setPagamento] = useState('');
  const [comentarios, setComentarios] = useState('');

  // --------- CART ---------
  const [items, setItems] = useState([]);
  useEffect(() => {
    try {
      const s = localStorage.getItem('cart');
      if (s) setItems(JSON.parse(s));
    } catch {}
  }, []);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + toNum(it?.price ?? it?.preco) * (it?.qtd || 1), 0),
    [items]
  );
  const total = subtotal + DELIVERY_FEE;

  // rótulo de exibição do item
//  const displayLine = (it) => {
   // if (isHalfCombo(it) || isHalfPending(it)) return it.name;
  //  const codeTxt = it?.code ? `${String(it.code).replace(/:.*/, '')}: ` : '';
//    const sizeTxt = it?.size ? ` (${it.size})` : '';
//    return `${codeTxt}${it?.name || it?.nome || 'Item'}${sizeTxt}`;
//  };



 const displayLine = (it) => {
 //   if (isHalfCombo(it) || isHalfPending(it)) return it.name; // combos/meias já vêm prontos
    if (isHalfCombo(it) || isHalfPending(it) || isBorderCombo(it)) return it.name;
    const codeTxt = it?.code ? `${String(it.code).replace(/:.*/, '')} - ` : '';
   // remove (G|M|P) que já venha dentro do name
   const base = String(it?.name || it?.nome || 'Item').replace(/\s*\((G|M|P)\)\s*$/i, '');
    const sizeTxt = it?.size ? ` (${String(it.size).toUpperCase()})` : '';
    return `${codeTxt}${base}${sizeTxt}`;
 };

  // linhas para payload
  const linhas = useMemo(() => {
    return items.map((it) => ({
      descricao: displayLine(it),
      qtd: it?.qtd || 1,
      preco: toNum(it?.price ?? it?.preco),
    }));
  }, [items]);

  const validar = () => {
    if (!nome.trim()) return 'Informe seu nome.';
    if (!telefone.trim()) return 'Informe seu telefone.';
    if (!ruaNumero.trim()) return 'Informe rua e número.';
    if (!bairro.trim()) return 'Informe o bairro.';
    if (!pagamento.trim()) return 'Escolha a forma de pagamento.';
    try {
      ensureNoPendingFractions(items);
    } catch (e) {
      return e.message || 'Há meias pizzas pendentes. Complete as frações.';
    }
    if (!items.length) return 'Seu carrinho está vazio.';
    return null;
  };

 /// const confirmar = () => {
 const confirmar = async () => {
    const erro = validar();
    if (erro) { alert(erro); return; }

    const cabecalho =
      `*Novo pedido*\n` +
      `Nome: ${nome}\n` +
      `Telefone: ${telefone}\n` +
      `Endereço: ${ruaNumero} - ${bairro}\n` +
      `Pagamento: ${pagamento}\n` +
      (comentarios.trim() ? `Observações: ${comentarios.trim()}\n` : '') +
      `\n*Itens:*`;
   // Webhook
fetch('https://primary-production-d79b.up.railway.app/webhook/finalizapedido', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cliente: {
      nome,
      telefone,
      endereco: `${ruaNumero} - ${bairro}`,
      pagamento,
      comentarios: (comentarios || '').trim() || null,
    },
    itens: linhas,               // [{ descricao, qtd, preco }]
    subtotal: Number(subtotal),  // número
    taxaEntrega: DELIVERY_FEE,   // número
    total: Number(total),        // número
  }),
})
.then(async (res) => {
  if (!res.ok) throw new Error('HTTP ' + res.status);
  alert('Pedido enviado com sucesso!');
})
.catch((err) => {
  alert('Erro ao enviar pedido: ' + err.message);
});

    const linhasTxt = linhas
      .map(l => `• ${l.qtd}x ${l.descricao} — R$ ${fmt(l.preco)}`)
      .join('\n');

    const rodape =
      `\n\nTaxa de entrega: R$ ${fmt(DELIVERY_FEE)}` +
      `\n*Total: R$ ${fmt(total)}*`;

    const msg = `${cabecalho}\n${linhasTxt}${rodape}`;

    // WhatsApp
    const url = `https://primary-production-d79b.up.railway.app/webhook/finalizapedido`;
    window.open(url, '_blank');
  };

  return (
    <main className="container" style={{ maxWidth: 760, margin: '24px auto' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span role="img" aria-label="note">🧾</span> Finalizar Pedido
      </h2>

      {/* FORM */}
      <div style={{ background: '#c9eceb', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <input
          value={nome} onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome completo"
          style={inputStyle}
        />
        <input
          value={telefone} onChange={(e) => setTelefone(e.target.value)}
          placeholder="Telefone com DDD"
          style={inputStyle}
        />
        <input
          value={ruaNumero} onChange={(e) => setRuaNumero(e.target.value)}
          placeholder="Rua, número"
          style={inputStyle}
        />
        <input
          value={bairro} onChange={(e) => setBairro(e.target.value)}
          placeholder="Bairro"
          style={inputStyle}
        />

        <select value={pagamento} onChange={(e) => setPagamento(e.target.value)} style={inputStyle}>
          <option value="">Forma de pagamento</option>
          <option value="Pix">Pix</option>
          <option value="Crédito">Cartão de Crédito</option>
          <option value="Débito">Cartão de Débito</option>
          <option value="Dinheiro">Dinheiro</option>
        </select>

        <div style={{ marginTop: 8, marginBottom: 4, fontWeight: 600 }}>Comentários:</div>
        <textarea
          value={comentarios} onChange={(e) => setComentarios(e.target.value)}
          placeholder="Ex: sem cebola, entrega no portão, troco para R$ 50,00"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {/* CART PREVIEW */}
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span role="img" aria-label="cart">🧺</span> Seu pedido
      </h3>
       
     <div style={{ background: '#d9ece9', padding: 16, borderRadius: 8 }}>
  <div>
    {items.map((it) => (
      <div
        key={it.id}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 0',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
     
        <div style={{ maxWidth: '70%', fontWeight: 700 }}>
          {`${it.qtd || 1} x ${displayLine(it)}`}
          {isHalfPending(it) ? (
            <span style={{ marginLeft: 6, color: '#d97706', fontWeight: 400 }}>
              (aguardando outra 1/2)
            </span>
          ) : null}
        </div> 
        <div style={{ fontWeight: 700 }}>
          <strong>R$ {fmt(toNum(it?.price ?? it?.preco))}</strong>
        </div>
      </div>
    ))}
  </div>
</div>



       

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <div>Subtotal</div>
          <div>R$ {fmt(subtotal)}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <div>Taxa de entrega</div>
          <div>R$ {fmt(DELIVERY_FEE)}</div>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: 8, fontWeight: 700, fontSize: 18
        }}>
          <div>Total</div>
          <div>R$ {fmt(total)}</div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
          <button className="btn primary" onClick={confirmar}
            style={{
              background: '#3b82f6', color: '#fff', padding: '10px 18px',
              borderRadius: 8, border: 0, cursor: 'pointer'
            }}
          >
            Confirmar Pedido
          </button>
        </div>
 
    </main>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  outline: 'none',
  marginBottom: 10,
  background: '#fff'
};
