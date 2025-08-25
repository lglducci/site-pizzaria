// TESTE: sem variável, sem n8n, sem nada.
// Se isso não funcionar, o problema é só deploy/projeto errado.
// Depois de ver funcionando, trocamos por sua URL real.

export async function GET() {
  return Response.json([
    { id: 1, nome: 'Teste', preco: 10, categoria: 'PIZZAS', descricao: '', imagem: '' }
  ]);
}
