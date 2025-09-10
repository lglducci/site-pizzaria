 // components/CartItem.js
import { isHalfCombo, isHalfPending, formatHalfComboLabel } from '../lib/pizzaFractions';



const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

const formatSize = (line) => {
  const raw = (line?.size ?? line?.tamanho ?? '').toString().trim();
  if (!raw) return '';
  const v = raw.toLowerCase();
  if (v === 'g' || v === 'grande') return 'Grande';
  if (v === 'm' || v === 'medio' || v === 'médio' || v === 'média') return 'Média';
  if (v === 'p' || v === 'pequena' || v === 'peq') return 'Pequena';
  return cap(raw);
};

const catBadgeStyle = (cat) => ({
  fontSize: 12,
  padding: '2px 6px',
  borderRadius: 6,
  background:
    cat === 'pizza'   ? '#fef3c7' :
    cat === 'borda'   ? '#e0f2fe' :
    cat === 'bebida'  ? '#dcfce7' :
    cat === 'esfirra' ? '#fae8ff' : '#f3f4f6',
  color: '#0f172a'
});





const fmt = (n) => Number(n ?? 0).toFixed(2);

export default function CartItem({ it, inc, dec }) {
  const combo = isHalfCombo(it);
  const pending = isHalfPending(it);
  const title = combo ? formatHalfComboLabel(it) : (it?.name || it?.nome || '');
  const price = Number(it?.price ?? it?.preco ?? 0);

  return (
    <div className="row">
      <div style={{ maxWidth: '60%' }}>
        <div style={{ fontWeight: 700 }}>
          {title}
          {pending ? <span style={{ marginLeft: 6, color: '#d97706' }}>(aguardando outra 1/2)</span> : null}
        </div>
        <div style={{ fontSize: 12, color: '#666' }}>R$ {fmt(price)}</div>
      </div>
      <div className="qty">
        <button className="btn small" onClick={() => dec(it.id)}>-</button>
        <div>{it?.qtd || 1}</div>
        <button className="btn small" onClick={() => inc(it.id)}>+</button>
      </div>
    </div>
  );
}

