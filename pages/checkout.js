 // pages/checkout.js
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { ensureNoPendingFractions } from '../lib/cartSmartAdd';
import { isHalfCombo, isHalfPending } from '../lib/pizzaFractions';
import { isBorderCombo } from '../lib/borderAddon';

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
  const router = useRouter();

  // --------- FORM ---------
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [ruaNumero, setRuaNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [pagamento, setPagamento] = useState('');
  const [comentarios, setComentarios] = useState('');
// Passo atual do fluxo: 'cart' (carrinho) ou 'assoc' (associar bordas↔pizzas)
const [step, setStep] = useState('cart');

// Mapa: idDaBorda -> idDaPizza
const [assoc, setAssoc] = useState({});

// Detectores simples (ajuste se você já tem esses campos)
const isPizza = it => /pizza/i.test(it?.category || it?.name || it?.nome || '');
const isBorda = it => /borda/i.test(it?.category || it?.name || it?.nome || '');
// Regra doce/salgada (ajuste se você marca isso em outro campo)
const tipo = it => /\bdoce\b/i.test(String(it?.name || it?.nome || '')) ? 'doce' : 'salgada';

const pizzas = items.filter(isPizza);
const bordas = items.filter(isBorda);


// Passo atual: 'cart' (carrinho) ou 'assoc' (associação)
const [step, setStep] = useState('cart');
// Mapeamento: idDaBorda -> idDaPizza
const [assoc, setAssoc] = useState({});

// Detecção simples
const isPizza = it => /pizza/i.test(it?.category || it?.name || it?.nome || '');
const isBorda = it => /borda/i.test(it?.category || it?.name || it?.nome || '');
// Regras doce/salgada (ajuste os critérios se quiser)
const tipo = it => /\bdoce\b/i.test(String(it?.name || it?.nome || '')) ? 'doce' : 'salgada';

const pizzas = items.filter(isPizza);
const bordas = items.filter(isBorda);








 

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
      ensureNoPendingBorders(items);
     
    } catch (e) {
      return e.message || 'Há meias pizzas pendentes. Complete as frações.';
    }
    if (!items.length) return 'Seu carrinho está vazio.';
    return null;
  };

  // >>>>>>>>>> CONFIRMAR (aguarda webhook, guarda retorno e redireciona) <<<<<<<<<<
  const confirmar = async () => {
    const erro = validar();
    if (erro) { alert(erro); return; }

    const payload = {
      cliente: {
        nome,
        telefone,
        endereco: `${ruaNumero}`,
        bairro: `${bairro}`,
        pagamento,
        comentarios: (comentarios || '').trim() || null,
      },
      itens: linhas,
      subtotal: Number(subtotal),
      taxaEntrega: DELIVERY_FEE,
      total: Number(total),
    };

// === FLUXO: Carrinho → Associação → Fechar ===

// Se houver bordas no carrinho, abre o passo de associação; senão, fecha direto
const continuarCheckout = () => {
  if (bordas.length > 0) { 
    setStep('assoc'); 
    return; 
  }
  confirmar();
};

// Aplica as associações (borda -> pizza) e fecha o pedido
const salvarAssociacaoEFechar = () => {
  // 1) cada borda precisa de uma pizza escolhida
  const pendentes = bordas.filter(b => !assoc[b.id]);
  if (pendentes.length) { 
    alert('Selecione uma pizza para cada borda.'); 
    return; 
  }

  // 2) valida compatibilidade (doce/salgada)
  for (const b of bordas) {
    const pid = assoc[b.id];
    const p = pizzas.find(x => x.id === pid);
    if (!p) continue;
    if (tipo(p) !== tipo(b)) {
      alert(`Borda “${b.name || b.nome}” incompatível com a pizza escolhida (doce/salgada).`);
      return;
    }
  }

  // 3) grava o vínculo nos itens (linkedTo)
  setItems(prev => prev.map(it => {
    if (/borda/i.test(it?.category || it?.name || it?.nome || '')) {
      return { ...it, linkedTo: assoc[it.id] || null };
    }
    return it;
  }));

  // 4) volta ao carrinho e confirma
  setStep('cart');
  setTimeout(() => confirmar(), 0);
};



   


     // --- MENSAGEM FORMATADA (com endereço) ---
const enderecoLinha = `${ruaNumero}${bairro ? ' - ' + bairro : ''}`;
const linhasFmt = linhas
  .map(l => `       ${l.qtd}x ${l.descricao} - R$ ${fmt(l.preco)}`)
  .join('\n');

const mensagemFormatada =
`Pedido nº 
Entrega para: ${enderecoLinha}
Resumo:
${linhasFmt}
Forma de pagamento: ${pagamento || '-'}
Entrega: R$ ${fmt(DELIVERY_FEE)}
Total: R$ ${fmt(total)}
${(comentarios || '').trim() ? `Comentário: ${comentarios.trim()}` : ''}`;

// objeto final que vai pro webhook (payload + mensagem_formatada)
const body = { ...payload, mensagem_formatada: mensagemFormatada };




   
    try {
      const res = await fetch('https://primary-production-d79b.up.railway.app/webhook/finalizapedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(body),
       //body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);

      const ct = res.headers.get('content-type') || '';
      let resposta;
      try {
        resposta = ct.includes('application/json') ? await res.json() : { raw: await res.text() };
      } catch {
        resposta = { raw: await res.text?.() ?? '' };
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pedido_confirmacao', JSON.stringify({
          resposta,
          payloadEnviado: payload,
          timestamp: Date.now(),
        }));
        try { localStorage.removeItem('cart'); } catch {}
      }

      router.push('/confirmacao');
    } catch (err) {
      alert('Erro ao enviar pedido: ' + err.message);
    }
  };

  return (
    <main className="container" style={{ maxWidth: 760, margin: '24px auto' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#0f172a' }}>
        <span role="img" aria-label="note">🧾</span> Finalizar Pedido
      </h2>

      {/* FORM */}
      <div style={{
        background: '#ffffff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        border: '1px solid #e5e5e5'
      }}>
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

        <div style={{ marginTop: 8, marginBottom: 4, fontWeight: 600, color: '#0f172a' }}>
          Comentários:
        </div>
        <textarea
          value={comentarios} onChange={(e) => setComentarios(e.target.value)}
          placeholder="Ex: sem cebola, entrega no portão, troco para R$ 50,00"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {/* CART PREVIEW */}
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#0f172a' }}>
        <span role="img" aria-label="cart">🧺</span> Seu pedido
      </h3>

      <div style={{
        background: '#ffffff',
        padding: 16,
        borderRadius: 8,
        border: '1px solid #e5e5e5'
      }}>
        <div>
          {items.map((it) => (
            <div
              key={it.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: '1px solid #e5e5e5',
              }}
            >
              <div style={{ maxWidth: '70%', fontWeight: 700, color: '#0f172a' }}>
                {`${it.qtd || 1} x ${displayLine(it)}`}
                {isHalfPending(it) ? (
                  <span style={{ marginLeft: 6, color: '#d97706', fontWeight: 400 }}>
                    (aguardando outra 1/2)
                  </span>
                ) : null}
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>
                <strong>R$ {fmt(toNum(it?.price ?? it?.preco))}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RESUMO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, color: '#0f172a' }}>
        <div>Subtotal</div>
        <div>R$ {fmt(subtotal)}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, color: '#0f172a' }}>
        <div>Taxa de entrega</div>
        <div>R$ {fmt(DELIVERY_FEE)}</div>
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: 8, fontWeight: 700, fontSize: 18, color: '#0f172a'
      }}>
        <div>Total</div>
        <div>R$ {fmt(total)}</div>
      </div>

      {/* AÇÃO */}
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
        <button
          className="btn primary"
           onClick={continuarCheckout}
          style={{
            background: '#dc2626', color: '#fff',
            padding: '10px 18px', border: 0, borderRadius: 8, cursor: 'pointer'
          }}
        >
          Confirmar Pedido
        </button>
      </div>

      {/* Fundo global da página via CSS global embutido */}
      <style jsx global>{`
        body { background: #f5f5f5; }
      `}</style>
    </main>
  );
}

const inputStyle = {
  width: '100%',
  height: 44,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e5e5e5',
  outline: 'none',
  marginBottom: 10,
  background: '#fff',
  color: '#0f172a',
  boxSizing: 'border-box',
};
