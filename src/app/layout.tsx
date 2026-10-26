import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Wiener Analytics · Odonto Wiener',
  description: 'Inteligência de marketing com dados confiáveis para a Odonto Wiener.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
