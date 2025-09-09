 // pages/checkout.js
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { ensureNoPendingFractions } from '../lib/cartSmartAdd';
import { isHalfCombo, isHalfPending } from '../lib/pizzaFractions';

// ====== CONFIG ======
const DELIVERY_FEE = 3.0;
const fmt = (n) => Number(n ?? 0).toFixed(2);
const toNum = (x) => {
  if (typeof x === 'number' && isFinite(x)) return x;
  if (x == null) return 0;
  const s = String(x).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  const n = Number(s);
  return isFinite(n) ? n : 0;
};   

// ====== ajuda: normalizar categoria quando vier em outro campo ======
const normalizeCategory = (src) => {
  const v = String(src || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim();
  if (!v) return '';
  if (['borda','bordas','borda recheada','recheio','recheios'].includes(v)) return 'borda';
  if (v.startsWith('pizza')) return 'pizza';
  if (v.includes('bebida') || ['refri','refrigerante'].includes(v)) return 'bebida';
  if (v.includes('esfirra')) return 'esfirra';
  return v;
};


const onlyDigits = (s) => String(s || '').replace(/\D/g, '');
const formatBRPhone = (v) => {
  const d = onlyDigits(v).slice(0, 11); // até 11 dígitos
  const isCell = d.length > 10;
  const ddd  = d.slice(0, 2);
  const mid  = isCell ? d.slice(2, 7) : d.slice(2, 6);
  const last = isCell ? d.slice(7, 11) : d.slice(6, 10);
  let out = '';
  if (ddd)  out += `(${ddd}) `;
  if (mid)  out += mid;
  if (last) out += `-${last}`;
  return out;
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
      if (!s) return;

      const raw = JSON.parse(s);
      const arr = Array.isArray(raw) ? raw : [];

      // completa category/categoria e mantém qualquer marcação manual anterior (__isBorder)
      const fixed = arr.map(it => {
        const catSrc = it.category ?? it.categoria ?? it.tipo ?? it.grupo ?? it.cat;
        const cat = normalizeCategory(catSrc);
        return { ...it, category: cat, categoria: cat, __isBorder: it.__isBorder === true };
      });

      setItems(fixed);
      localStorage.setItem('cart', JSON.stringify(fixed)); // deixa persistido já corrigido
    } catch (e) {
      console.error('Falha ao ler carrinho:', e);
    }
  }, []);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + toNum(it?.price ?? it?.preco) * (it?.qtd || 1), 0),
    [items]
  );
  const total = subtotal + DELIVERY_FEE;

  // --------- PASSO ---------
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart' | 'assoc'

  // ===== CLASSIFICAÇÃO =====
  const norm = (s) => String(s || '').toLowerCase().trim();
  const catOf = (it) => norm(it?.category || it?.categoria || it?.cat || '');

  // pizza = só quando categoria contém "pizza"
  const isPizza = (it) => catOf(it).includes('pizza');

  // borda = quando categoria contém "borda" OU quando o usuário marcou manualmente (__isBorder)
  const isBorda = (it) => catOf(it).includes('borda') || it?.__isBorder === true;

  const pizzas = useMemo(() => items.filter(isPizza), [items]);
  const bordas = useMemo(() => items.filter(isBorda), [items]);

  // Unidades de borda (suporta qtd>1)
  const borderUnits = useMemo(
    () => bordas.flatMap(b =>
      Array.from({ length: b?.qtd || 1 }, (_, i) => ({
        key: `${b.id}#${i + 1}`, itemId: b.id, idx: i + 1, item: b,
      }))
    ),
    [bordas]
  );

  // escolhas da UI
  const [assocUnits, setAssocUnits] = useState({}); // { "bordaId#1": pizzaId }

  // Exibição
  const displayLine = (it) => {
    if (isHalfCombo(it) || isHalfPending(it)) return it.name;
    const codeTxt = it?.code ? `${String(it.code).replace(/:.*/, '')} - ` : '';
    const base = String(it?.name || it?.nome || 'Item').replace(/\s*\((G|M|P)\)\s*$/i, '');
    const sizeTxt = it?.size ? ` (${String(it.size).toUpperCase()})` : '';
    return `${codeTxt}${base}${sizeTxt}`;
  };

  const pizzaLabelById = (pid) => {
    const p = items.find(x => x.id === pid);
    if (!p) return '(pizza removida)';
    const codeTxt = p?.code ? `${String(p.code).replace(/:.*/, '')} - ` : '';
    const base = String(p?.name || p?.nome || 'Pizza').replace(/\s*\((G|M|P)\)\s*$/i, '');
    const sizeTxt = p?.size ? ` (${String(p.size).toUpperCase()})` : '';
    return `${codeTxt}${base}${sizeTxt}`;
  };

  // ====== LÓGICA DE MARCAR COMO BORDA (manual) ======
  const marcarComoBorda = (id, val) => {
    setItems(prev => {
      const next = prev.map(it => it.id === id ? { ...it, __isBorder: !!val } : it);
      try { localStorage.setItem('cart', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // linhas para payload — inclui associação borda→pizza NA DESCRIÇÃO
  const linhas = useMemo(() => {
    return items.map((it) => {
      let descricao = displayLine(it);

      if (isBorda(it)) {
        const q = it?.qtd || 1;
        if (q > 1 && Array.isArray(it.linkedToList) && it.linkedToList.length) {
          const alvos = it.linkedToList.filter(Boolean).map(pizzaLabelById);
          if (alvos.length) descricao += ` — ${alvos.join(' , ')}`;
        } else if (it.linkedTo) {
          descricao += ` — ${pizzaLabelById(it.linkedTo)}`;
        }
      }

      return {
        descricao, // ex.: "117 Borda Cheddar — 5 - Vegetariana (G)"
        qtd: it?.qtd || 1,
        preco: toNum(it?.price ?? it?.preco),
      };
    });
  }, [items]);

  // validações (bordas precisam estar ligadas a pizzas)
  const validar = () => {
    if (!nome.trim()) return 'Informe seu nome.';
    if (!telefone.trim()) return 'Informe seu telefone.';
    if (!ruaNumero.trim()) return 'Informe rua e número.';
    if (!bairro.trim()) return 'Informe o bairro.';
    if (!pagamento.trim()) return 'Escolha a forma de pagamento.';
    if (!items.length) return 'Seu carrinho está vazio.';
   if (onlyDigits(telefone).length < 10) return 'Informe um telefone válido (com DDD).';
    try { ensureNoPendingFractions(items); }
    catch (e) { return e.message || 'Há meias pizzas pendentes. Complete as frações.'; }

    const pizzasLocal = items.filter(isPizza);
    const bordasLocal = items.filter(isBorda);

    if (bordasLocal.length && !pizzasLocal.length) return 'Há borda no carrinho, mas nenhuma pizza.';

    for (const b of bordasLocal) {
      const q = b?.qtd || 1;
      const links = q > 1 ? b?.linkedToList : (b?.linkedTo ? [b.linkedTo] : []);
      if (!Array.isArray(links) || links.length !== q || links.some(v => !v)) {
        setCheckoutStep('assoc');
        return 'Há bordas pendentes. Associe cada borda a uma pizza.';
      }
      for (const pid of links) {
        const p = items.find(x => x.id === pid);
        if (!p) return 'Há bordas pendentes. Associe cada borda a uma pizza válida.';
      }
    }
    return null;
  };

  // enviar
  const confirmar = async () => {
    const erro = validar();
    if (erro) { alert(erro); return; }

    const payload = {
        cliente: { nome, telefone: onlyDigits(telefone), endereco: `${ruaNumero}`, bairro: `${bairro}`, pagamento,
        comentarios: (comentarios || '').trim() || null },
      itens: linhas,
      subtotal: Number(subtotal),
      taxaEntrega: DELIVERY_FEE,
      total: Number(total),
    };

    const enderecoLinha = `${ruaNumero}${bairro ? ' - ' + bairro : ''}`;
    const linhasFmt = linhas.map(l => `       ${l.qtd}x ${l.descricao} — R$ ${fmt(l.preco)}`).join('\n');

    const mensagemFormatada =
`Pedido nº 
Entrega para: ${enderecoLinha}
Resumo:
${linhasFmt}
Forma de pagamento: ${pagamento || '-'}
Entrega: R$ ${fmt(DELIVERY_FEE)}
Total: R$ ${fmt(total)}
${(comentarios || '').trim() ? `Comentário: ${comentarios.trim()}` : ''}`;

    const body = { ...payload, mensagem_formatada: mensagemFormatada };

    try {
      const res = await fetch('/api/finalizapedido', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const text = await res.clone().text();
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${text.slice(0,200) || 'sem corpo'}`);

      const ct = res.headers.get('content-type') || '';
      const resposta = ct.includes('application/json') ? JSON.parse(text) : { raw: text };

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pedido_confirmacao',
          JSON.stringify({ resposta, payloadEnviado: payload, timestamp: Date.now() }));
        try { localStorage.removeItem('cart'); } catch {}
      }
      router.push('/confirmacao');
    } catch (err) {
      console.error('[pedido] erro no envio:', err);
      alert('Erro ao enviar pedido: ' + (err?.message || String(err)));
    }
  };

  // fluxo: abre associação se houver borda sem vínculo
  const continuarCheckout = () => {
    if (bordas.length > 0) {
      const allLinked = bordas.every(b => {
        const q = b?.qtd || 1;
        const links = q > 1 ? b?.linkedToList : (b?.linkedTo ? [b.linkedTo] : []);
        return Array.isArray(links) && links.length === q && links.every(Boolean);
      });
      if (!allLinked) { setCheckoutStep('assoc'); return; }
    }
    confirmar();
  };

  // salvar associações
  const salvarAssociacaoEFechar = () => {
    const allSelected = borderUnits.every(u => !!assocUnits[u.key]);
    if (!allSelected) { alert('Associe TODAS as bordas às pizzas.'); return; }

    const byItem = {};
    for (const u of borderUnits) {
      const pid = assocUnits[u.key];
      (byItem[u.itemId] ||= []).push(pid);
    }

    setItems(prev => {
      const next = prev.map(it => {
        if (!isBorda(it)) return it;
        const list = byItem[it.id] || [];
        const q = it?.qtd || 1;
        if (q > 1) return { ...it, linkedToList: list, linkedTo: undefined };
        return { ...it, linkedTo: list[0] || null, linkedToList: undefined };
      });
      try { localStorage.setItem('cart', JSON.stringify(next)); } catch {}
      return next;
    });

    setCheckoutStep('cart');
  };

  // UI
  return (
    <main className="container" style={{ maxWidth: 760, margin: '24px auto' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#0f172a' }}>
        <span role="img" aria-label="note">🧾</span> Finalizar Pedido
      </h2>

      {/* FORM */}
      <div style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16, border: '1px solid #e5e5e5' }}>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome completo" style={inputStyle} />
       
        
   <input
  value={telefone}
  onChange={(e) => setTelefone(formatBRPhone(e.target.value))}
  placeholder="Telefone com DDD"
  style={inputStyle}
  type="tel"
  inputMode="numeric"
  maxLength={15}
  aria-label="Telefone com DDD"
/>


       
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
        <textarea value={comentarios} onChange={(e) => setComentarios(e.target.value)} placeholder="Ex: sem cebola, entrega no portão, troco para R$ 50,00" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      {/* CART PREVIEW */}
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#0f172a' }}>
        <span role="img" aria-label="cart">🧺</span> Seu pedido
      </h3>
 
      <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #e5e5e5' }}>
        <div>
          {items.map((it) => (
            <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e5e5e5' }}>
              <div style={{ maxWidth: '70%', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{`${it.qtd || 1} x ${displayLine(it)}`}</span>

                {/* badge da  pra você ver na tela */}
                <span style={{ fontSize: 12, padding: '2px 6px', borderRadius: 6, background: '#eef2ff', color: '#3730a3' }}>
              
                </span>  
                  
               <span
                 style={{
                   fontSize: 14,
                   padding: '4px 8px',
                   borderRadius: 6,
                   background: it.categoria === 'pizza' ? '#fef3c7'
                            : it.categoria === 'borda' ? '#e0f2fe'
                            : it.categoria === 'bebida' ? '#dcfce7'
                            : it.categoria === 'esfirra' ? '#fae8ff'
                            : '#f3f4f6',
                   color: '#0f172a',
                 }}
               >
                 <strong>
                   {it.categoria ? it.categoria.charAt(0).toUpperCase() + it.categoria.slice(1).toLowerCase() : 'Sem categoria'}
                 </strong>
               </span>
                              
               


                {/* se for borda, mostra a associação */}
                {isBorda(it) && it.linkedTo && (<>
                  <span style={{ opacity: 0.5 }}>—</span>
                  <span style={{ fontWeight: 600 }}>{pizzaLabelById(it.linkedTo)}</span>
                </>)}
                {isBorda(it) && Array.isArray(it.linkedToList) && it.linkedToList.length > 0 && (<>
                  <span style={{ opacity: 0.5 }}>—</span>
                  <span style={{ fontWeight: 600 }}>{it.linkedToList.filter(Boolean).map(pizzaLabelById).join(' , ')}</span>
                </>)}

                {isHalfPending(it) ? (
                  <span style={{ marginLeft: 6, color: '#d97706', fontWeight: 400 }}>(aguardando outra 1/2)</span>
                ) : null}
            </div>

              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
               
                

                <div style={{ fontWeight: 700, color: '#0f172a' }}>
                  <strong>R$ {fmt(toNum(it?.price ?? it?.preco))}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TELA DE ASSOCIAÇÃO */}
      {checkoutStep === 'assoc' && (
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: 16, marginTop: 16 }}>
          <h3 style={{ marginTop: 0, color: '#0f172a' }}>Associar bordas às pizzas</h3>

          {borderUnits.length === 0 ? (
            <div style={{ color: '#0f172a' }}>Não há bordas no carrinho.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {borderUnits.map((u) => {
                const b = u.item;
                const opts = pizzas; // associar a qualquer pizza
                return (
                  <div key={u.key} style={{ border: '1px solid #e5e5e5', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>
                      Borda {u.idx}/{b.qtd || 1}: {b.name || b.nome}
                    </div>

                    {opts.length ? (
                      <select
                        value={assocUnits[u.key] || ''}
                        onChange={(e) => {
                          const pid = e.target.value;
                          setAssocUnits(prev => ({ ...prev, [u.key]: pid }));

                          // grava na hora nos items
                          setItems(prev => prev.map(it => {
                            if (!isBorda(it)) return it;
                            if (it.id !== b.id) return it;
                            const q = it?.qtd || 1;
                            if (q > 1) {
                              const list = it.linkedToList && Array.isArray(it.linkedToList)
                                ? [...it.linkedToList] : Array(q).fill(null);
                              list[u.idx - 1] = pid;
                              return { ...it, linkedToList: list, linkedTo: undefined };
                            }
                            return { ...it, linkedTo: pid, linkedToList: undefined };
                          }));
                        }}
                        style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e5e5' }}
                      >
                        <option value="" disabled>Selecione uma pizza…</option>
                        {opts.map(p => (
                          <option key={p.id} value={p.id}>
                            {(p.qtd || 1)}x {p.name || p.nome}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ color: '#b91c1c' }}>Nenhuma pizza encontrada.</div>
                    )}
                  </div>
                );
              })}
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
