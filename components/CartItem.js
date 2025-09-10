 // components/CartItem.js
import { isHalfCombo, isHalfPending, formatHalfComboLabel } from '../lib/pizzaFractions';

const fmt = (n) => Number(n ?? 0).toFixed(2);

// helpers
const cap = (s) => {
  const t = String(s || '');
  return t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : '';
};

const extractSizeFromName = (name) => {
  const m = String(name || '').match(/\((G|M|P)\)\s*$/i);
  if (!m) return '';
  const ch = m[1].toUpperCase();
  return ch === 'G' ? 'Grande' : ch === 'M' ? 'Média' : 'Pequena';
};

const extractVolumeFromName = (name) => {
  const s = String(name || '');
  const m = s.match(/(\d+(?:[.,]\d+)?)\s*(l|ml)\b/i);
  if (!m) return '';
  const num = m[1].replace(',', '.');
  const unit = m[2].toLowerCase() === 'l' ? 'L' : 'ml';
  const pretty = num.endsWith('.0') ? num.slice(0, -2) : num;
  return `${pretty}${unit === 'ml' ? ' ml' : 'L'}`;
};

const formatSizeOrVolume = (it) => {
  const cat = String(it?.categoria || it?.category || '').toLowerCase();
  if (cat.includes('pizza')) {
    const raw = String(it?.size ?? it?.tamanho ?? '').trim();
    const v = raw || extractSizeFromName(it?.name || it?.nome);
    if (!v) return '';
    const low = v.toLowerCase();
    if (['g', 'grande'].includes(low)) return 'Grande';
    if (['m', 'medio', 'médio', 'média'].includes(low)) return 'Média';
    if (['p', 'pequena', 'peq', 'pequeno'].includes(low)) return 'Pequena';
    return cap(v);
  }
  if (cat.includes('bebida') || cat.includes('refrigerante')) {
    const raw = String(it?.volume || '').trim();
    const v = raw || extractVolumeFromName(it?.name || it?.nome);
    return v || '';
  }
  return '';
};

const catBadgeStyle = (cat) => {
  const c = String(cat || '').toLowerCase();
  return {
    fontSize: 12,
    padding: '2px 6px',
    borderRadius: 6,
    background:
      c === 'pizza' ? '#fef3c7' :
      c === 'borda' ? '#e0f2fe' :
      c === 'bebida' ? '#dcfce7' :
      c === 'esfirra' ? '#fae8ff' : '#f3f4f6',
    color: '#0f172a',
  };
};

export default function CartItem({ it, inc, dec }) {
  const combo = isHalfCombo(it);
  const pending = isHalfPending(it);
  const title = combo ? formatHalfComboLabel(it) : (it?.name || it?.nome || '');
  const price = Number(it?.price ?? it?.preco ?? 0);
  const categoria = it?.categoria || it?.category || '';
  const sizeOrVol = formatSizeOrVolume(it);

  return (
    <div className="row" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ maxWidth: '70%' }}>
        {/* Nome do item (menor que antes) */}
        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14, lineHeight: '18px' }}>
          {title}
          {pending ? <span style={{ marginLeft: 6, color: '#d97706' }}>(aguardando outra 1/2)</span> : null}
        </div>

        {/* Categoria e (tamanho/volume) */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
          {categoria ? (
            <span style={catBadgeStyle(categoria)}>
              <strong>{cap(categoria)}</strong>
            </span>
          ) : null}

          {sizeOrVol ? (
            <span style={{ fontSize: 12, padding: '2px 6px', borderRadius: 6, background: '#eef2ff', color: '#0f172a' }}>
              (<strong>{sizeOrVol}</strong>)
            </span>
          ) : null}
        </div>

        {/* Preço (pequeno) */}
        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>R$ {fmt(price)}</div>
      </div>

      {/* Quantidade */}
      <div className="qty" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="btn small" onClick={() => dec(it.id)}>-</button>
        <div>{it?.qtd || 1}</div>
        <button className="btn small" onClick={() => inc(it.id)}>+</button>
      </div>
    </div>
  );
}
