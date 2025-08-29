 // pages/checkout.js
import { useEffect, useMemo, useState } from 'react';
import { ensureNoPendingFractions } from '../lib/cartSmartAdd';
import { isHalfCombo, isHalfPending } from '../lib/pizzaFractions';

const fmt = (n) => Number(n ?? 0).toFixed(2);
const toNum = (x) => {
  if (typeof x === 'number' && isFinite(x)) return x;
  if (x == null) return 0;
  const s = String(x).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  const n = Number(s);
  return isFinite(n) ? n : 0;
};

export default function Checkout() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    try {
      const s = localStorage.getItem('cart');
      if (s) setItems(JSON.parse(s));
    } catch {}
  }, []);

  const total = useMemo(
    () => items.reduce((s, it) => s + toNum(it?.price ?? it?.preco) * (it?.qtd || 1), 0),
    [items]
  );

  const linhas = items.map((it) => {
    const qtd = it?.qtd || 1;
    const price = toNum(it?.price ?? it?.preco);
    const descricao = isHalfCombo(it) || isHalfPending(it)
      ? it.name                                     // “Meia 45 Confete (1/2) + ...”
      : (it?.name || it?.nome || 'Item');           // simples
    return { descricao, qtd, preco: price };
  });

  const confirmar = () => {
    try {
      ensureNoPendingFractions(items);
    } catch (e) {
      alert(e.message); return;
    }
    // Payload final (ajuste aqui para enviar aonde quiser)
    const payload = {
      itens: linhas,
      total: total,
    };
    console.log('PAYLOAD:', payload);

    alert(
      'Exemplo de payload gerado (abra o console para ver completo):\n\n' +
      linhas.map(l => `${l.qtd}x ${l.descricao} — R$ ${fmt(l.preco)}`).join('\n') +
      `\n\nTotal: R$ ${fmt(total)}`
    );
  };

  return (
    <main className="container" style={{ maxWidth: 720, margin: '20px auto' }}>
      <h2>Seu pedido</h2>
      <div style={{ marginTop: 12 }}>
        {items.map((it) => (
          <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <div>
              <div style={{ fontWeight: 700 }}>
                {isHalfCombo(it) || isHalfPending(it) ? it.name : (it.name || it.nome)}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>R$ {fmt(toNum(it?.price ?? it?.preco))}</div>
            </div>
            <div style={{ fontWeight: 700 }}>x {it.qtd || 1}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 18, fontWeight: 700 }}>
        <div>Total</div>
        <div>R$ {fmt(total)}</div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
        <button className="btn primary" onClick={confirmar}>Confirmar Pedido</button>
      </div>
    </main>
  );
}
