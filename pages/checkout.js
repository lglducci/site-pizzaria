 // pages/checkout.js
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { ensureNoPendingFractions } from '../lib/cartSmartAdd';
import { isHalfCombo, isHalfPending } from '../lib/pizzaFractions';
import { isBorderCombo, ensureNoPendingBorders } from '../lib/borderAddon';

// >>> CONFIGURE <<<
const DELIVERY_FEE = 3.00;

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

  // --------- CART ---------
  const [items, setItems] = useState([]);
  useEffect(() => {
    try {
      const s = localStorage.getItem('cart');
      if (s) setItems(JSON.parse(s));
    } catch {}
  }, []);

  // --------- PASSO / ASSOC ---------
  // Passo atual: 'cart' (carrinho) ou 'assoc' (associar borda ↔ pizza)
  const [checkoutStep, setCheckoutStep] = useState('cart');
  // Mapa: id da BORDA -> id da PIZZA
  const [assoc, setAssoc] = useState({});

  // Detectores simples (adapte se você já marca isso nos itens)

 
  //const isPizza = it => /pizza/i.test(it?.category || it?.name || it?.nome || '');
// Detectores robustos
 
// === Detectores (categoria 1º, com fallback por nome) ===
const norm = (s) => String(s||'')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().trim();

const catOf = (it) => norm(it?.category || it?.categoria || it?.cat);

// categorias tratadas como PIZZA
const PIZZA_CATS = [
  'pizza','pizzas','pizza salgada','pizza doce','salgada','doces','doce'
];

// categorias tratadas como BORDA
const BORDA_CATS = [
  'borda','bordas','borda recheada','recheio','recheio de borda','recheios'
];

// palavras que indicam Borda no NOME (fallback)
const BORDA_NAME = [
  'borda','recheada','recheio','cheddar','catupiry','catupiri','cream cheese','requeijao','requeijão',
  'chocolate','doce de leite','nutella','goiabada'
].map(norm);

// palavras que NÃO são pizza (bebidas etc.)
const NOT_PIZZA = [
  'agua','água','refrigerante','refri','cerveja','coca','skol','bohemia',
  'sprite','fanta','guarana','guaraná','suco','600ml','2l','lata','garrafa'
];

const isBorda = (it) => {
  const c = catOf(it);
  if (c && BORDA_CATS.some(k => c.includes(k))) return true;
  const n = norm(`${it?.name || it?.nome || ''} ${it?.code || ''}`);
  return BORDA_NAME.some(k => n.includes(k));
};

const isPizza = (it) => {
  const c = catOf(it);
  if (c && PIZZA_CATS.some(k => c.includes(k))) return true;
  // fallback por nome/forma
  const n = norm(`${it?.name || it?.nome || ''}`);
  if (isBorda(it)) return false;
  if (NOT_PIZZA.some(k => n.includes(k))) return false;
  const hasSize = /\((g|m|p)\)/i.test(it?.name || it?.nome || '');
  const isHalf = /\bmeia\b/.test(n);
  return n.includes('pizza') || hasSize || isHalf;
};

// tipo (doces/salgadas) — usa categoria primeiro
const tipo = (it) => {
  const c = catOf(it);
  if (/doc(e|es)/.test(c)) return 'doce';
  if (/salgad/.test(c)) return 'salgada';
  const n = norm(`${it?.name || it?.nome || ''}`);
  const doces = ['doce','brigadeiro','prestigio','prestigio','chocolate','banana','romeu','julieta','goiabada','nutella','churros','leite ninho','ninho'];
  return doces.some(w => n.includes(w)) ? 'doce' : 'salgada';
};

// listas (APENAS UMA VEZ!)
const pizzas = items.filter(isPizza);
const bordas = items.filter(isBorda);

// debug: veja as categorias que estão vindo
if (typeof window !== 'undefined') {
  const cats = Array.from(new Set(items.map(it => catOf(it))));
  console.log('CATEGORIAS:', cats, 'pizzas:', pizzas, 'bordas:', bordas);
}

  

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

  // linhas para payload (cruas)
  const linhas = useMemo(() => {
    return items.map((it) => ({
      descricao: displayLine(it),
      qtd: it?.qtd || 1,
      preco: toNum(it?.price ?? it?.preco),
    }));
  }, [items]);

  // validações
  const validar = () => {
    if (!nome.trim()) return 'Informe seu nome.';
    if (!telefone.trim()) return 'Informe seu telefone.';
    if (!ruaNumero.trim()) return 'Informe rua e número.';
    if (!bairro.trim()) return 'Informe o bairro.';
    if (!pagamento.trim()) return 'Escolha a forma de pagamento.';
    if (!items.length) return 'Seu carrinho está vazio.';
    try {
      ensureNoPendingFractions(items);
      ensureNoPendingBorders(items); // trava borda solta/incompatível se sua lib validar isso
    } catch (e) {
      return e.message || 'Há bordas pendentes. Associe cada borda a uma pizza compatível.';
    }
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
    const body = { ...payload, mensagem_formatada: mensagemFormatada, mensagem: mensagemFormatada };

    try {
      const res = await fetch('https://primary-production-d79b.up.railway.app/webhook/finalizapedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  // === FLUXO: Carrinho → Associação → Fechar ===

 
  const continuarCheckout = () => {
    if (bordas.length > 0) {
      setCheckoutStep('assoc');
      return;
    }
    confirmar();
  };

  const salvarAssociacaoEFechar = () => {
    // 1) cada borda precisa de uma pizza escolhida
    const pendentes = bordas.filter(b => !assoc[b.id]);
    if (pendentes.length) { alert('Selecione uma pizza para cada borda.'); return; }

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
    setCheckoutStep('cart');
    setTimeout(() => confirmar(), 0);
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
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome completo" style={inputStyle} />
        <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone com DDD" style={inputStyle} />
        <input value={ruaNumero} onChange={(e) => setRuaNumero(e.target.value)} placeholder="Rua, número" style={inputStyle} />
        <input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" style={inputStyle} />

        <select value={pagamento} onChange={(e) => setPagamento(e.target.value)} style={inputStyle}>
          <option value="">Forma de pagamento</option>
          <option value="Pix">Pix</option>
          <option value="Crédito">Cartão de Crédito</option>
          <option value="Débito">Cartão de Débito</option>
          <option value="Dinheiro">Dinheiro</option>
        </select>

        <div style={{ marginTop: 8, marginBottom: 4, fontWeight: 600, color: '#0f172a' }}>Comentários:</div>
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

      {/* >>> TELA DE ASSOCIAÇÃO: aparece entre carrinho e totais <<< */}
      {checkoutStep === 'assoc' && (
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: 16, marginTop: 16 }}>
          <h3 style={{ marginTop: 0, color: '#0f172a' }}>Associar bordas às pizzas</h3>

          {bordas.length === 0 ? (
            <div style={{ color: '#0f172a' }}>Não há bordas no carrinho.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {bordas.map(b => (
                <div key={b.id} style={{ border: '1px solid #e5e5e5', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>
                    {(b.qtd || 1)}x {b.name || b.nome} — {tipo(b)}
                  </div>
                  <select
                    value={assoc[b.id] || ''}
                    onChange={(e) => setAssoc(prev => ({ ...prev, [b.id]: e.target.value }))}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e5e5' }}
                  >
                    <option value="" disabled>Selecione uma pizza compatível…</option>
                    {pizzas
                      .filter(p => tipo(p) === tipo(b))
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {(p.qtd || 1)}x {p.name || p.nome}
                        </option>
                      ))
                    }
                  </select>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button
              onClick={() => setCheckoutStep('cart')}
              style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #e5e5e5', background: '#fff', cursor: 'pointer' }}
            >
              Voltar ao carrinho
            </button>
            <button
              onClick={salvarAssociacaoEFechar}
              style={{ padding: '10px 18px', borderRadius: 8, border: 0, background: '#dc2626', color: '#fff', cursor: 'pointer' }}
            >
              Concluir associação e fechar
            </button>
          </div>
        </div>
      )}

      {/* TOTAIS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, color: '#0f172a' }}>
        <div>Subtotal</div>
        <div>R$ {fmt(subtotal)}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, color: '#0f172a' }}>
        <div>Taxa de entrega</div>
        <div>R$ {fmt(DELIVERY_FEE)}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontWeight: 700, fontSize: 18, color: '#0f172a' }}>
        <div>Total</div>
        <div>R$ {fmt(total)}</div>
      </div>
{/* AÇÃO */}
{checkoutStep === 'cart' && (
  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
    <button
      className="btn primary"
      onClick={continuarCheckout}
      style={{ background: '#dc2626', color: '#fff', padding: '10px 18px', borderRadius: 8, border: 0, cursor: 'pointer' }}
    >
      Continuar
    </button>
  </div>
)}
    

      {/* Fundo global */}
      <style jsx global>{` body { background: #f5f5f5; } `}</style>
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
