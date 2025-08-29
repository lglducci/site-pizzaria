



import '../styles/globals.css';
import '../styles.css';
console.log('APP carregado');
export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
// pages/_app.js
import '../styles/globals.css'; // se você não tiver, pode remover esta linha
import { CartProvider } from '../components/CartContext'; // <— ajuste o caminho se seu CartContext estiver em outro lugar

export default function MyApp({ Component, pageProps }) {
  return (
    <CartProvider>
      <Component {...pageProps} />
    </CartProvider>
  );
}
