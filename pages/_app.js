 // pages/_app.js
import '../styles/globals.css'; // pode remover se não usar
//import { CartProvider } from '../CartContext'; // <-- seu CartContext está na RAIZ do repo
import { CartProvider } from '../context/CartContext';

export default function MyApp({ Component, pageProps }) {
  return (
    <CartProvider>
      <Component {...pageProps} />
    </CartProvider>
  );
}
