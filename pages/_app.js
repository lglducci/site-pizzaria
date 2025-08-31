// pages/_app.js
import { useEffect } from 'react';
import { migrateCartCategories } from '../lib/cart';
// (se você tiver globals.css, deixe a importação; se não tiver, pode remover)
import '../styles/globals.css';

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Corrige carrinhos antigos SEM categoria
    migrateCartCategories();
  }, []);

  return <Component {...pageProps} />;
}



 
