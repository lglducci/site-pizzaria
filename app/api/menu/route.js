 // app/api/menu/route.js
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const file = path.join(process.cwd(), 'public', 'menu.json');
    const buf = await fs.readFile(file, 'utf8');
    const data = JSON.parse(buf);
    const arr = Array.isArray(data) ? data : [data];
    return Response.json(arr);
  } catch (e) {
    return new Response('menu.json não encontrado ou inválido', { status: 500 });
  }
}
