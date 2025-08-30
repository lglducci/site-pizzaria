 // pages/checkout.js
import { useEffect, useMemo, useState } from 'react';
import { ensureNoPendingFractions } from '../lib/cartSmartAdd';
import { isHalfCombo, isHalfPending } from '../lib/pizzaFractions';
import { isBorderCombo, ensureNoPendingBorders } from '../lib/borderAddon';

// >>> CONFIGURE <<<
const WHATSAPP_NUMBER = '5599999999999'; // DDI+DDD+NUM (ex.: 5511999999999)
const DELIVERY_FEE = 3.00;               // taxa de entrega

// CHANGE: formatação consistente (sem depender de locale da máquina)
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

// ===================== THEME / STYLES =====================
// CHANGE: centraliza o tema e estilos → manutenção fácil e visual consistente
const theme = {
  primary: '#0ea5e9',
  text: '#0f172a',
  bg: '#f8fafc',
  cardBg: '#ffffff',
  border: '#e5e7eb',
  warn: '#d97706',
  radius: 12,
};

const containerStyle = { maxWidth: 840, margin: '24px auto', padding: 16 };
const headingStyle = { display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' };

const cardStyle = {
  background: theme.cardBg,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius,
  padding: 16,
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  marginBottom: 16,
};

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 0',
  borderBottom: `1px solid ${theme.border}`,
};

const summaryRowStyle = { display: 'flex', justifyContent: 'space-between', marginTop: 8 };
const summaryTotalStyle = { ...summaryRowStyle, fontWeight: 700, fontSize: 18 };

const inputStyle = {
  width: '100%',
  height: 44,
  padding: '10px 12px',
  borderRadius: theme.radius,
  border: `1px solid ${theme.border}`,
  outline: 'none',
  marginBottom: 10,
  background: '#fff',
  fontSize: 16,
};

// botão com largura total em mobile e feedback visual
const btnStyle = {
  background: theme.primary,
  color: '#fff',
  padding: '12px 18px',
  borderRadius: theme.radius,
  border: 0,
  cursor: 'pointer',
  width: '100%',
  fontWeight: 600,
};

// ===================== COMPONENTE =====================
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
  const displayLine = (it) => {
    if (isHalfCombo(it) || isHalfPending(it) || isBorderCombo(it)) return it.name;
    const codeTxt = it?.code ? `${String(it.code).replace(/:.*/, '')} - ` : '';
    // remove (G|M|P) no final do name para não duplicar tamanho
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

  const confirmar = async () => {
    const erro = validar();
    if (erro) { alert(erro); return; }

    const cabecalho =
      `*Novo pedido*\n` +
      `Nome: ${nome}\n` +
      `Telefone: ${telefone}\n` +
      `Endereço: ${ruaNumero}\n` +
      `Bairro: ${bairro}\n` +
      `Pagamento: ${pagamento}\n` +
      (comentarios.trim() ? `Observações: ${comentarios.trim()}\n` : '') +
      `\n*Itens:*`;

    // Webhook (mantido)
    fetch('https://primary-production-d79b.up.railway.app/webhook-test/finalizapedido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente: {
          nome,
          telefone,
          endereco: `${ruaNumero}`,
          bairro: `${bairro}`,
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

    // WhatsApp / abertura — (opcional, não relacionado a estilo)
    const url = `https://primary-production-d79b.up.railway.app/webhook-test/finalizapedido`;
    window.open(url, '_blank');
  };

  return (
    <main className="container" style={containerStyle}>
      {/* CHANGE: títulos com layout consistente */}
      <h2 style={headingStyle}>
        <span role="img" aria-label="note">🧾</span> Finalizar Pedido
      </h2>

      {/* FORM */}
      {/* CHANGE: cartão padronizado (antes fundo verde/azul) */}
      <div style={cardStyle}>
        {/* CHANGE: grid simples em telas largas para inputs ficarem lado a lado */}
        <div className="grid">
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
        </div>

        <div className="grid">
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
        </div>

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
      <h3 style={headingStyle}>
        <span role="img" aria-label="cart">🧺</span> Seu pedido
      </h3>

      {/* CHANGE: cartão padronizado para o carrinho */}
      <div style={cardStyle}>
        {items.length === 0 ? (
          <div style={{ color: '#64748b' }}>Seu carrinho está vazio.</div>
        ) : (
          <div>
            {items.map((it) => (
              <div key={it.id} style={rowStyle}>
                <div style={{ maxWidth: '70%', fontWeight: 700 }}>
                  {`${it.qtd || 1} x ${displayLine(it)}`}
                  {isHalfPending(it) ? (
                    <span style={{ marginLeft: 6, color: theme.warn, fontWeight: 400 }}>
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
        )}
      </div>

      {/* RESUMO */}
      <div style={summaryRowStyle}>
        <div>Subtotal</div>
        <div>R$ {fmt(subtotal)}</div>
      </div>
      <div style={summaryRowStyle}>
        <div>Taxa de entrega</div>
        <div>R$ {fmt(DELIVERY_FEE)}</div>
      </div>
      <div style={summaryTotalStyle}>
        <div>Total</div>
        <div>R$ {fmt(total)}</div>
      </div>

      {/* AÇÃO */}
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
        {/* CHANGE: botão estilizado e responsivo */}
        <button className="btn primary" onClick={confirmar} style={btnStyle}>
          Confirmar Pedido
        </button>
      </div>

 

      {/* CHANGE: estilos de foco/hover e grid responsiva com styled-jsx */}
      <style jsx>{`
        .container { background: ${theme.bg}; }
        .btn.primary:hover { filter: brightness(0.95); }
        .btn.primary:active { transform: translateY(1px); }

        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 720px) {
          .grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        /* foco nos inputs: melhora acessibilidade/UX */
        input:focus, select:focus, textarea:focus {
          border-color: ${theme.primary};
          box-shadow: 0 0 0 3px rgba(14,165,233,0.15);
        }
      `}</style>

      body { background: #eef2ff; } /* cor de fora */
    </main>
  );
}
