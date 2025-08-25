  export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getMenu() {
  const url = process.env.NEXT_PUBLIC_N8N_MENU_URL || '/api/menu';
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao carregar cardápio');
  return res.json(); // espera um array
}

export default async function Page() {
  const menu = await getMenu(); // [{id,nome,preco,categoria,descricao,imagem}]

  return (
    <main style={{ padding: 20 }}>
      <h1 style={{ margin: 0, marginBottom: 16 }}>Cardápio</h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        {menu.map((item) => (
          <div key={item.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12 }}>
            <div
              style={{
                aspectRatio: '4/3',
                borderRadius: 8,
                marginBottom: 8,
                backgroundImage: `url(${item.imagem || `https://picsum.photos/seed/${item.id}/800/600`})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: '#f4f4f4',
              }}
            />
            <div style={{ fontWeight: 700 }}>{item.nome}</div>
            <div>R$ {Number(item.preco || 0).toFixed(2)}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{item.categoria}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
