 // components/MenuItemCard.js
import { useCart } from '../context/CartContext';
const { items, addItem } = useCart();
const fmt = (n) => Number(n ?? 0).toFixed(2);
const num = (x) => {
  if (typeof x === 'number' && isFinite(x)) return x;
  if (x == null) return 0;
  const s = String(x).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  const n = Number(s);
  return isFinite(n) ? n : 0;
};


// Detecta item de BORDA
const cat = String(item?.categoria || '').toLowerCase();
const isBorderItem = cat.includes('borda') || /borda|requeij|catupir|cheddar/i.test(item?.nome || '');

// Adiciona este item como BORDA de uma pizza já no carrinho
const addAsBorder = () => {
  const code = (prompt('Código da pizza que receberá a borda (ex.: 36):') || '').trim();
  if (!code) return;

  // acha a pizza pelo código (ex.: "36" de "36:U")
  const target = items.find(
    (x) => String(x.code ?? x.id ?? '').replace(/:.*/, '') === code
  );
  if (!target) { alert('Pizza não encontrada no carrinho. Adicione a pizza primeiro.'); return; }

  const size = String(target.size || 'G').toUpperCase();
  const price = size === 'M'
    ? (item.preco_medio ?? item.preco)
    : (item.preco_grande ?? item.preco);
  if (price == null) { alert('Este item não tem preço para o tamanho da pizza.'); return; }

  addItem({
    id: `border-${item.id}:${code}:${size}`,
    type: 'border_combo',
    qtd: 1,
    size,
    borderId: item.id,
    borderName: item.nome,
    targetCode: code,
    targetName: String(target.name || target.nome || 'Pizza'),
    name: `Borda ${item.nome}  ${code} - ${String(target.name || target.nome)} (${size})`,
    price,
    preco: price,
  });
  alert('Borda adicionada à pizza escolhida!');
};

export default function MenuItemCard({ item }) {
  //const { addItem } = useCart();
  //const { items, addItem } = useCart();
 const { items, addItem } = useCart();

  const cat = String(item?.categoria || '').toLowerCase();
  const isPizza = Boolean(
    item?.preco_grande || item?.preco_medio || cat.includes('pizza') || cat.includes('pizz')
  );
  const code = item?.numero ?? item?.codigo ?? item?.id;   // <<< número/código

  const baseHalf = item?.preco_grande ?? item?.preco ?? item?.valor ?? item?.preco_medio;
  const halfLabel = fmt(num(baseHalf) / 2);

  const addSimple = () => {
    const p = item?.preco ?? item?.valor ?? item?.preco_grande ?? item?.preco_medio ?? 0;
    const price = num(p);
    addItem({ id: `${item.id}:U`, name: item.nome, code, price, preco: price, size: null });
  };

  const addSize = (size) => {
    const p = size === 'M' ? (item?.preco_medio ?? 0) : (item?.preco_grande ?? 0);
    const price = num(p);
    if (!price) return;
    addItem({ id: `${item.id}:${size}`, name: `${item.nome} (${size})`, code, price, preco: price, size });
  };


// Adicionar este item de cardápio como "Borda" de uma pizza já no carrinho
const addAsBorder = () => {
  // 1) Pergunta a pizza (código)
  const code = (prompt('Digite o CÓDIGO da pizza que receberá a borda (ex.: 36):') || '').trim();
  if (!code) return;

  // 2) Procura a pizza no carrinho
  const target = items.find((x) => String(x.code ?? x.id ?? '').replace(/:.*/, '') === code);
  if (!target) { alert('Pizza não encontrada no carrinho. Adicione a pizza primeiro.'); return; }

  // 3) Determina o tamanho da pizza alvo
  const size = String(target.size || 'G').toUpperCase();

  // 4) Preço da borda conforme o tamanho
  const price = size === 'M' ? (item.preco_medio ?? item.preco) : (item.preco_grande ?? item.preco);
  if (!price) { alert('Este item de borda não tem preço para o tamanho da pizza.'); return; }

  // 5) Monta e adiciona o combo de borda
  const combo = {
    id: `border-${item.id}:${code}:${size}`,
    type: 'border_combo',
    qtd: 1,
    size,
    borderId: item.id,
    borderName: item.nome,
    targetCode: code,
    targetName: String(target.name || target.nome || 'Pizza'),
    name: `Borda ${item.nome}  ${code} - ${String(target.name || target.nome)} (${size})`,
    price,
    preco: price,
  };
  addItem(combo);
  alert('Borda adicionada à pizza escolhida!');
};


 
  const addHalf = () => {
    const base = item?.preco_grande ?? item?.preco ?? item?.valor ?? item?.preco_medio;
    if (base == null) return;
    const meiaPrice = num(base) / 2;
    addItem({
      id: `${item.id}:H`,
      name: item.nome,   // baseName
      code,              // <<< número vai junto para a meia
      price: meiaPrice,
      preco: meiaPrice,
      size: 'G',
      isHalf: true,
    });
  };

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
            <button className="btn" onClick={addHalf}>Meia • R$ {halfLabel}</button>
            {item?.preco_medio != null && (
              <button className="btn" onClick={() => addSize('M')}>Médio • R$ {fmt(num(item.preco_medio))}</button>
            )}
            {item?.preco_grande != null && (
              <button className="btn primary" onClick={() => addSize('G')}>Grande • R$ {fmt(num(item.preco_grande))}</button>
            )}
          </>
        ) : (
          <button className="btn primary" onClick={addSimple}>
            Adicionar • R$ {fmt(num(item?.preco ?? item?.valor ?? item?.preco_grande ?? item?.preco_medio ?? 0))}
          </button>
        )}
      </div>
    </div>
  );
}
