export async function GET() {
  return Response.json({
    NEXT_PUBLIC_N8N_MENU_URL: process.env.NEXT_PUBLIC_N8N_MENU_URL || null,
    N8N_MENU_URL: process.env.N8N_MENU_URL || null,
  });
}
