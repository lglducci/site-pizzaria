 // components/MenuItemCard.js
import { useCart } from '../context/CartContext';

const fmt = (n) => Number(n ?? 0).toFixed(2);

export default function MenuItemCard({ item }) {
  const { addItem } = useCart();

  // Labels e detecção
  const cat = String(item?.categoria || '').toLowerCase();
  const isPizza = Boolean(
    item?.preco_grande ||
    item?.preco_medio  ||
    cat.includes('pizza') ||
    cat.includes('pizz')
  );

  const baseHalf = (item?.preco_grande ?? item?.preco ?? item?.preco_medio);
  const halfLabel = fmt(((baseHalf ?? 0) / 2));

  // Ações
  const addSimple = () => {
    const p = (item?.preco_grande ?? item?.preco ?? item?.preco_medio ?? 0);
    addItem({ id: `${item.id}:U`, name: item.nome, price: Number(p), size: null });
  };

  const addSize = (size) => {
    const p = size === 'M' ? (item?.preco_medio ?? 0) : (item?.preco_grande ?? 0);
    if (!p) return;
    addItem({ id: `${item.id}:${size}`, name: `${item.nome} (${size})`, price: Number(p), size });
  };

  const addHalf = () => {
    const base = (item?.preco_grande ?? item?.preco ?? item?.preco_medio);
    if (base == null) return;
    const meiaPrice = Number(base) / 2;
    addItem({
      id: `${item.id}:H`,
      name: `${item.nome} (1/2)`,
      price: meiaPrice,
      size: 'G',      // ajuste se usar P/M/G diferentes
      isHalf: true,   // chave para o smartAdd detectar “meia”
    });
  };

  // Imagem
  const fallback = `https://picsum.photos/seed/${encodeURIComponent(String(item?.id))}/800/600`;
  const imgUrl = item?.imagem || item?.imagem_url || fallback;
  const bgStyle = { backgroundImage: 'url(' + imgUrl + ')' };

  return (
    <div className="card">
      <div className="img" style={bgStyle} />
      <div className="name">{item?.nome}</div>
      <div className="cat">{item?.categoria}</div>
      <div style={{ fontSize: 13, color: '#444', minHeight: 30 }}>{item?.descricao}</div>

      <div className="priceRow">
        {isPizza ? (
          <>
            <button className="btn" onClick={addHalf}>
              Meia • R$ {halfLabel}
            </button>
            {item?.preco_medio != null ? (
              <button className="btn" onClick={() => addSize('M')}>
                Médio • R$ {fmt(item.preco_medio)}
              </button>
            ) : null}
            {item?.preco_grande != null ? (
              <button className="btn primary" onClick={() => addSize('G')}>
                Grande • R$ {fmt(item.preco_grande)}
              </button>
            ) : null}
          </>
        ) : (
          <button className="btn primary" onClick={addSimple}>
            Adicionar • R$ {fmt(item?.preco_grande ?? item?.preco ?? item?.preco_medio ?? 0)}
          </button>
        )}
      </div>
    </div>
  );
}
