import './globals.css';

export const metadata = {
  title: 'Cardápio Online',
  description: 'Next.js + n8n starter'
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-900 text-slate-100">
        {children}
      </body>
    </html>
  );
}
