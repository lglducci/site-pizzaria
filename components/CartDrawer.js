 // components/CartDrawer.js
import { useRouter } from 'next/router';
import { useCart } from '../context/CartContext';
//import CartItem from './CartItem';
import { ensureNoPendingFractions } from '../lib/cartSmartAdd';


//- import CartDrawer from '../components/CartDrawer';
 import dynamic from 'next/dynamic';
 const CartDrawer = dynamic(() => import('../components/CartDrawer'), { ssr: false });


const fmt = (n) => Number(n ?? 0).toFixed(2);

export default function CartDrawer({ open, onClose }) {
  const router = useRouter();
  const { items, total, inc, dec, clear } = useCart();
  if (!open) return null;

  const goCheckout = () => {
    try {
      ensureNoPendingFractions(items);
      router.push('/checkout');
    } catch (e) {
      alert(e.message || 'Finalize suas meias pizzas antes de continuar.');
    }
  };

  return (
    <div className="drawerOverlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="header" style={{ marginBottom: 8 }}>
          <div className="title">Seu pedido</div>
          <button className="btn" onClick={clear}>Limpar</button>
        </div>

        <div style={{ overflow: 'auto', flex: 1 }}>
          {items.map((it) => <CartItem key={it.id} it={it} inc={inc} dec={dec} />)}
          {!items.length && <div className="alert">Seu carrinho está vazio.</div>}
        </div>

        <div className="total">
          <div>Total</div>
          <div>R$ {fmt(total)}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <button className="btn primary" onClick={goCheckout}>Finalizar pedido</button>
        </div>
      </div>
    </div>
  );
}

