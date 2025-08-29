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
 
     addItem({ id: `${item.id}:${size}`, name: item.nome, price, size });
  };


 const addHalf = () => {
    const base = item?.preco_grande ?? item?.preco ?? item?.valor ?? item?.preco_medio;
    if (base == null) return;
    const meiaPrice = num(base) / 2;
    const code = item?.numero ?? item?.codigo ?? item?.id;
    addItem({
      id: `${item.id}:H`,
      name: `${item.nome} (1/2)`,
      price: meiaPrice,
      preco: meiaPrice,
      size: 'G',
      isHalf: true,
      code,           // <<< número vai junto
    });
  };












  
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
        {item.categoria === 'PIZZA' ? (
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



