
# 🍕 site-pizzaria

Este repositório contém o front-end completo do sistema de pedidos online da pizzaria **La Cantina**, desenvolvido em **Next.js** e integrado com **n8n** para automações de pedido e comunicação com API externa (ex: Evolution API para WhatsApp).

---

## 📂 Estrutura de Pastas

| Pasta        | Descrição |
|--------------|-----------|
| `components/` | Componentes reutilizáveis da interface (ex: Cardápio, Carrinho, Modal) |
| `context/`    | Contextos globais, como o carrinho de compras |
| `lib/`        | Funções utilitárias e helpers (ex: comunicação com webhooks, formatação) |
| `pages/`      | Rotas da aplicação (ex: index, sucesso, erro) |
| `public/`     | Arquivos públicos (imagens, favicon, etc) |
| `styles/`     | Estilos globais e módulos CSS |

---

## ⚙️ Arquivos Principais

- `.env.local.sample`: Exemplo de variáveis de ambiente (renomear para `.env.local`)
- `next.config.js` / `next.config.mjs`: Configurações do framework Next.js
- `package.json`: Dependências e scripts do projeto
- `README.md`: Documentação geral (este arquivo)

---

## 🧠 Como Funciona

1. **Página principal (`/`)** exibe o cardápio com os produtos buscados do n8n via webhook público.
2. O cliente monta o pedido e finaliza no botão **"Fechar pedido"**.
3. Um **modal** coleta: nome, telefone, endereço, forma de pagamento.
4. Ao confirmar, os dados são enviados para um webhook do **n8n**, que:
   - Formata o pedido
   - Calcula o valor total + taxa de entrega
   - Envia para o WhatsApp via Evolution API

---

## 🔐 Integrações

### n8n (webhook)
- Webhook público para busca de itens do cardápio
- Webhook privado para envio dos pedidos

Configure as URLs no arquivo `.env.local` com:

```
NEXT_PUBLIC_WEBHOOK_PUBLICO=https://seu-n8n/webhook/publico
NEXT_PUBLIC_WEBHOOK_PRIVADO=https://seu-n8n/webhook/privado
```

### Evolution API (WhatsApp)
No n8n, o pedido é enviado para a Evolution API com o seguinte formato:

```json
{
  "messageData": {
    "to": "55SEUNUMERO",
    "text": "📦 Pedido nº 123..."
  }
}
```

---

## 🔧 Como rodar localmente

```bash
# Instalar dependências
npm install

# Rodar o projeto localmente
npm run dev

# Acessar em http://localhost:3000
```

---

## 🛠 Onde alterar cada parte

| Recurso                  | Local para editar                      |
|--------------------------|----------------------------------------|
| Cardápio                 | `pages/index.tsx` + função do n8n     |
| Lógica do carrinho       | `context/CartContext.tsx`              |
| Visual de produtos       | `components/ProductItem.tsx`           |
| Modal de finalização     | `components/Modal.tsx`                 |
| Estilos e cores          | `styles/globals.css`                  |
| Formatação do pedido     | Função no n8n (formata mensagem final) |
| API WhatsApp Evolution   | Credencial + chamada HTTP no n8n       |

---

## 📄 Licença

Este projeto é de uso privado e restrito à implementação da pizzaria La Cantina.
