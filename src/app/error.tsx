'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-screen">
      <h1>Não foi possível carregar os dados</h1>
      <p>
        Verifique se o banco foi preparado com <code>npm run db:setup</code>.
      </p>
      <button className="button" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}
