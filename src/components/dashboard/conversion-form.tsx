'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function ConversionForm({ mode, today }: { mode: string; today: string }) {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <section className="panel form-panel">
      <h2>Registrar resultados agregados</h2>
      <p>
        Use uma linha por dia e canal. Salvar novamente substitui os totais dessa combinação. Não
        informe nomes, telefones, mensagens ou dados clínicos.
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          const fields = Object.fromEntries(new FormData(event.currentTarget));
          try {
            const response = await fetch('/api/conversions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...fields, mode }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setStatus(
              'Totais salvos. Atribuição informada manualmente, sem inferência automática.',
            );
            router.refresh();
          } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Erro ao salvar');
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          <label className="field">
            Data
            <input name="date" type="date" defaultValue={today} required />
          </label>
          <label className="field">
            Canal
            <select name="channel">
              <option value="INSTAGRAM">Instagram</option>
              <option value="ADS">Anúncios</option>
              <option value="OTHER">Outros / sem atribuição</option>
            </select>
          </label>
          {[
            ['contacts', 'Contatos recebidos'],
            ['attributedContacts', 'Contatos atribuídos com evidência'],
            ['scheduled', 'Avaliações agendadas'],
            ['attended', 'Avaliações realizadas'],
            ['closed', 'Tratamentos fechados'],
          ].map(([key, label]) => (
            <label className="field" key={key}>
              {label}
              <input name={key} type="number" min={0} step={1} placeholder="Desconhecido" />
            </label>
          ))}
        </div>
        <div className="form-actions">
          <button className="button" disabled={busy}>
            {busy ? 'Salvando…' : 'Salvar totais'}
          </button>
          <span role="status">{status}</span>
        </div>
      </form>
    </section>
  );
}
