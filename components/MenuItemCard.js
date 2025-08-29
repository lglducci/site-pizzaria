// components/MenuItemCard.js
import { useCart } from '../context/CartContext';
const fmt = (n) => Number(n || 0).toFixed(2);

export default function MenuItemCard({ item }) {
  const { addItem } = useCart();

  const addSimple = () => {
    const price = item.preco || item.preco_grande || item.preco_medio || 0;
    addItem({ id: `${item.id}:U`, name: item.nome, price, size: null });
  };

  const addSize = (size) => {
    const price = size === 'M' ? item.preco_medio : item.preco_grande;
    if (!price) return;
    addItem({ id: `${item.id}:${size}`, name: `${item.nome} (${size})`, price, size });
  };

  const addHalf = () => {
    if (!item.preco_grande) return;
    const meiaPrice = item.preco_grande / 2;
    addItem({
      id: `${item.id}:H`,
      name: `${item.nome} (1/2 G)`,
      price: meiaPrice,
      size: 'G',
      isHalf: true, // <- detecta meia
    });
  };

 // const isPizza = String(item.categoria || '').toUpperCase() === 'PIZZA';



  // depois (mais robusto)
const cat = String(item.categoria || '').toLowerCase();
const isPizza = !!(
  item.preco_grande ||           // tem preço por tamanho
  item.preco_medio  ||
  cat.includes('pizza') ||       // categoria contém "pizza"/"pizzas"
  cat.includes('pizz')
);

  return (
    <div className="card">
      <div
        className="img"
        style={{ backgroundImage: `url(${item.imagem || `https://picsum.photos/seed/${item.id}/800/600`})` }}
      />
      <div className="name">{item.nome}</div>
      <div className="cat">{item.categoria}</div>
      <div style={{ fontSize: 13, color: '#444', minHeight: 30 }}>{item.descricao}</div>

      <div className="priceRow">
        {isPizza ? (
          <>
            {item.preco_grande ? (
              <button className="btn" onClick={addHalf}>
                Meia • R$ {fmt(item.preco_grande / 2)}
              </button>
            ) : null}
            {item.preco_medio ? (
              <button className="btn" onClick={() => addSize('M')}>
                Médio • R$ {fmt(item.preco_medio)}
              </button>
            ) : null}
            {item.preco_grande ? (
              <button className="btn primary" onClick={() => addSize('G')}>
                Grande • R$ {fmt(item.preco_grande)}
              </button>
            ) : null}
          </>
        ) : (
          <button className="btn primary" onClick={addSimple}>
            Adicionar • R$ {fmt(item.preco || item.preco_grande || item.preco_medio)}
          </button>
        )}
      </div>
    </div>
  );
}
