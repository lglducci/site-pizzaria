 // pages/checkout.js
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { ensureNoPendingFractions } from '../lib/cartSmartAdd';
import { isHalfCombo, isHalfPending } from '../lib/pizzaFractions';
import { isBorderCombo, ensureNoPendingBorders } from '../lib/borderAddon';

// >>> CONFIGURE <<<
const DELIVERY_FEE = 3.00;

const fmt = (n) => Number(n ?? 0).toFixed(2);
const toNum = (x) => {
  if (typeof x === 'number' && isFinite(x)) return x;
  if (x == null) return 0;
  const s = String(x)
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const n = Number(s);
  return isFinite(n) ? n : 0;
};

export default function Checkout() {
  const router = useRouter();

  // --------- FORM ---------
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

  // --------- PASSO / ASSOC ---------
  // Passo atual: 'cart' (carrinho) ou 'assoc' (associar borda ↔ pizza)
  const [checkoutStep, setCheckoutStep] = useState('cart');
  // Mapa: id da BORDA -> id da PIZZA
  const [assoc, setAssoc] = useState({});

  // Detectores simples (adapte se você já marca isso nos itens)
  const isPizza = it => /pizza/i.test(it?.category || it?.name || it?.nome || '');
  const isBorda = it => /borda/i.test(it?.category || it?.name || it?.nome || '');
  const tipo = it => /\bdoce\b/i.test(String(it?.name || it?.nome || '')) ? 'doce' : 'salgada';

  const pizzas = items.filter(isPizza);
  const bordas = items.filter(isBorda);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + toNum(it?.price ?? it?.preco) * (it?.qtd || 1), 0),
    [items]
  );
  const total = subtotal + DELIVERY_FEE;

  // rótulo de exibição do item
  const displayLine = (it) => {
    if (isHalfCombo(it) || isHalfPending(it) || isBorderCombo(it)) return it.name;
    const codeTxt = it?.code ? `${String(it.code).replace(/:.*/, '')} - ` : '';
    const base = String(it?.name || it?.nome || 'Item').replace(/\s*\((G|M|P)\)\s*$/i, '');
    const sizeTxt = it?.size ? ` (${String(it.size).toUpperCase()})` : '';
    return `${codeTxt}${base}${sizeTxt}`;
  };

  // linhas para payload (cruas)
  const linhas = useMemo(() => {
    return items.map((it) => ({
      descricao: displayLine(it),
      qtd: it?.qtd || 1,
      preco: toNum(it?.price ?? it?.preco),
    }));
  }, [items]);

  // validações
  const validar = () => {
    if (!nome.trim()) return 'Informe seu nome.';
    if (!telefone.trim()) return 'Informe seu telefone.';
    if (!ruaNumero.trim()) return 'Informe rua e número.';
    if (!bairro.trim()) return 'Informe o bairro.';
    if (!pagamento.trim()) return 'Escolha a forma de pagamento.';
    if (!items.length) return 'Seu carrinho está vazio.';
    try {
      ensureNoPendingFractions(items);
      ensureNoPendingBorders(items); // trava borda solta/incompatível se sua lib validar isso
    } catch (e) {
      return e.message || 'Há bordas pendentes. Associe cada borda a uma pizza compatível.';
    }
    return null;
  };

  // >>>>>>>>>> CONFIRMAR (aguarda webhook, guarda retorno e redireciona) <<<<<<<<<<
  const confirmar = async () => {
    const erro = validar();
    if (erro) { alert(erro); return; }

    const payload = {
      cliente: {
        nome,
        telefone,
        endereco: `${ruaNumero}`,
        bairro: `${bairro}`,
        pagamento,
        comentarios: (comentarios || '').trim() || null,
      },
      itens: linhas,
      subtotal: Number(subtotal),
      taxaEntrega: DELIVERY_FEE,
      total: Number(total),
    };

    // --- MENSAGEM FORMATADA (com endereço) ---
    const enderecoLinha = `${ruaNumero}${bairro ? ' - ' + bairro : ''}`;
    const linhasFmt = linhas
      .map(l => `       ${l.qtd}x ${l.descricao} - R$ ${fmt(l.preco)}`)
      .join('\n');

    const mensagemFormatada =
`Pedido nº 
Entrega para: ${enderecoLinha}
Resumo:
${linhasFmt}
Forma de pagamento: ${pagamento ||
