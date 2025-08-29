 // pages/checkout.js
import { useEffect, useMemo, useState } from 'react';
import { ensureNoPendingFractions } from '../lib/cartSmartAdd';
import { isHalfCombo, isHalfPending } from '../lib/pizzaFractions';

// >>>> CONFIGURE AQUI <<<<
const WHATSAPP_NUMBER = '5599999999999'; // coloque DDI+DDD+NUMERO do estabelecimento
const DELIVERY_FEE = 3.00;               // taxa de entrega padrão (edite se quiser)

const fmt = (n) => Number(n ?? 0).toFixed(2);
const toNum = (x) => {
  if (typeof x === 'number' && isFinite(x)) return x;
  if (x == null) return 0;
  const s = String(x).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  const n = Number(s);
  return isFinite(n) ? n : 0;
};

export default function Checkout() {
  // --------- FORM STATE ---------
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [ruaNumero, setRuaNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [pagamento, setPagamento] = useState('');
  const [comentarios, setComentarios] = useState('');

  // --------- CART ---------
  const [items, setItems] = useState([]);
  useEffect(() => {
    try {
      const s = localStorage.getItem('cart');
      if (s) setItems(JSON.parse(s));
    } catch {}
  }, []);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + toNum(it?.price ?? it?.preco) * (it?.qtd || 1), 0),
    [items]
  );
  const total = subtotal + DELIVERY_FEE;

  // rótulo de exibição do item
  const displayLine = (it) => {
    if (isHalfCombo(it) || isHalfPending(it)) return it.name;
    const codeTxt = it?.code ? `${String(it.code).replace(/:.*/, '')}: ` : '';
    const sizeTxt = it?.size ? ` (${it.size})` : '';
    return `${codeTxt}${it?.name || it?.nome || 'Item'}${sizeTxt}`;
  };

  // linhas para payload
  const linhas = useMemo(() => {
    return items.map((it) => ({
      descricao: displayLine(it),
      qtd: it?.qtd || 1,
      preco: toNum(it?.price ?? it?.preco),
    }));
  }, [items]);

  const validar = () => {
    if (!nome.trim()) return 'Informe seu nome.';
    if (!telefone.trim()) return 'Informe seu telefone.';
    if (!ruaNumero.trim()) return 'Informe rua e número.';
    if (!bairro.trim()) return 'Informe o bairro.';
    if (!pagamento.trim()) return 'Escolha a forma de pagamento.';
    try {
      ensureNoPendingFractions(items);
    } catch (e) {
      return e.message || 'Há meias pizzas pendentes. Complete as frações.';
    }
    if (!items.length) return 'Seu carrinho está vazio.';
    return null;
  };

  const confirmar = () => {
    const erro = validar();
    if (erro) { alert(erro); return; }

    const cabecalho =
      `*Novo pedido*\n` +
      `Nome: ${nome}\n` +
      `Telefone: ${telefone}\n` +
      `Endereço: ${ruaNumero} - ${bairro}\n` +
      `Pagamento: ${pagamento}\n` +
      (comentarios.trim() ? `Observações: ${comentarios.trim()}\n` : '') +
      `\n*Itens:*`;

    const linhasTxt = linhas
      .map(l => `• ${l.qtd}x ${l.descricao} — R$ ${fmt(l.preco)}`)
      .join('\n');

    const rodape =
      `\n\nTaxa de entrega: R$ ${fmt(DELIVERY_FEE)}` +
      `\n*Total: R$ ${fmt(total)}*`;

    const msg = `${cabecalho}\n${linhasTxt}${rodape}`;

    // WhatsApp
