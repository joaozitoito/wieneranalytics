import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="error-screen">
      <h1>Página não encontrada</h1>
      <p>Este conteúdo pode pertencer a outro ambiente de dados.</p>
      <Link className="button" href="/">
        Voltar à visão geral
      </Link>
    </main>
  );
}
