# Next + n8n Starter (Cardápio, Carrinho, Checkout)

Site bonito (Next.js + Tailwind) chamando **webhooks do n8n**.

## Variáveis (.env.local)
Copie `.env.local.sample` para `.env.local` e preencha:
- `NEXT_PUBLIC_BRAND`, `NEXT_PUBLIC_WHATSAPP`
- `NEXT_PUBLIC_N8N_MENU_URL` (GET aberto que devolve JSON do cardápio)
- `N8N_ORDER_URL` (POST protegido, chamado no servidor)
- `N8N_ORDER_API_KEY` (header `x-api-key` enviado para o n8n)

## Rodar local
```bash
npm i
npm run dev
```
Abra http://localhost:3000

## Deploy (Vercel)
- Crie um repositório no GitHub e suba este projeto.
- Em vercel.com, "New Project" → importe o repositório.
- Em "Environment Variables", cole as do `.env.local`.
- Deploy.

## Webhooks esperados no n8n

### GET /webhook/cardapio_publico → 200 JSON
```json
[ { "id":1, "nome":"Margherita", "preco":39.9, "imagem":"https://...", "categoria":"PIZZAS", "descricao":"..." } ]
```

### POST /webhook/novo_pedido_privado (com header x-api-key) → 200 JSON
Request body (enviado pelo servidor Next):
```json
{ "cliente": {"nome":"Ana","tel":"559..."},
  "itens": [ {"id":1,"nome":"Margherita","preco":39.9,"qtd":2} ],
  "total": 79.8, "origem":"site" }
```

## Licença
Use à vontade. Recomendo manter **este repositório como seu** e clonar para cada cliente.
