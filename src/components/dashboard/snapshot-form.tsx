'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Save } from 'lucide-react';
import { fieldLabels, metricKeys } from '@/features/imports/schema';
type Initial = {
  id: string;
  measuredOn: string;
  periodStart: string | null;
  periodEnd: string | null;
  notes: string | null;
  [key: string]: unknown;
};
export function SnapshotForm({
  mode,
  today,
  initial,
}: {
  mode: string;
  today: string;
  initial?: Initial;
}) {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState('account');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus('');
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch('/api/snapshots', {
        method: initial ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, mode, id: initial?.id, kind }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Não foi possível gravar');
      setStatus(
        result.skipped
          ? 'Este registro já existe. Nenhuma duplicata foi criada.'
          : 'Medição salva no banco.',
      );
      if (!initial) form.reset();
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Falha ao salvar');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel form-panel" id="novo">
      <h2>{initial ? 'Editar medição' : 'Adicionar uma medição'}</h2>
      <p>
        Copie os números conhecidos. Campo vazio significa desconhecido; zero deve ser informado
        explicitamente. Origem: {mode === 'demo' ? 'demonstração' : 'entrada manual'}.
      </p>
      <form onSubmit={submit} key={initial?.id ?? 'new'}>
        <div className="form-grid">
          {!initial && (
            <label className="field">
              Tipo de registro
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="account">Snapshot da conta</option>
                <option value="media">Snapshot de conteúdo</option>
              </select>
            </label>
          )}
          <label className="field">
            Data da leitura
            <input
              type="date"
              name="measuredOn"
              required
              defaultValue={initial?.measuredOn ?? today}
            />
            <small>Inclusão no banco é registrada automaticamente.</small>
          </label>
          <label className="field">
            Início do período
            <input type="date" name="periodStart" defaultValue={initial?.periodStart ?? ''} />
          </label>
          <label className="field">
            Fim do período
            <input type="date" name="periodEnd" defaultValue={initial?.periodEnd ?? ''} />
            <small>Deixe ambos vazios se não confirmado.</small>
          </label>
          {kind === 'media' && !initial && (
            <>
              <label className="field">
                Identificador do conteúdo
                <input name="localKey" required maxLength={100} placeholder="Ex.: reel-protocolo" />
                <small>Reutilize o identificador para novas capturas do mesmo conteúdo.</small>
              </label>
              <label className="field">
                Formato
                <select name="mediaType">
                  <option value="FEED">Feed</option>
                  <option value="CAROUSEL">Carrossel</option>
                  <option value="REEL">Reel</option>
                  <option value="STORY">Story</option>
                </select>
              </label>
              <label className="field">
                Publicado em
                <input type="date" name="publishedOn" />
              </label>
              <label className="field">
                Distribuição
                <select name="traffic">
                  <option value="UNKNOWN">Desconhecida</option>
                  <option value="ORGANIC">Orgânico</option>
                  <option value="PAID">Pago</option>
                  <option value="MIXED">Orgânico + pago</option>
                </select>
              </label>
              <label className="field full">
                Legenda ou título
                <input
                  name="caption"
                  maxLength={1000}
                  required
                  placeholder="Título para identificar o conteúdo"
                />
              </label>
            </>
          )}
          {metricKeys
            .filter((k) => kind === 'account' || !['followers', 'addressClicks'].includes(k))
            .map((key) => (
              <label className="field" key={key}>
                {fieldLabels[key]}
                <input
                  name={key}
                  type="number"
                  min={0}
                  max={2147483647}
                  step={1}
                  placeholder="Desconhecido"
                  defaultValue={initial?.[key] == null ? '' : String(initial[key])}
                />
              </label>
            ))}
          {kind === 'media' &&
            ['likes', 'comments', 'shares', 'saves', 'followersGained', 'stickerClicks'].map(
              (key, index) => (
                <label className="field" key={key}>
                  {
                    [
                      'Curtidas',
                      'Comentários',
                      'Compartilhamentos',
                      'Salvamentos',
                      'Seguidores obtidos',
                      'Toques no adesivo',
                    ][index]
                  }
                  <input
                    name={key}
                    type="number"
                    min={0}
                    max={2147483647}
                    step={1}
                    placeholder="Desconhecido"
                  />
                </label>
              ),
            )}
          <label className="field full">
            Observações
            <textarea
              name="notes"
              maxLength={2000}
              defaultValue={initial?.notes ?? ''}
              placeholder="Contexto da captura, limitações ou período não confirmado. Não inclua dados de pacientes."
            />
          </label>
        </div>
        <div className="form-actions">
          <button className="button" disabled={busy}>
            {initial ? <Save size={15} /> : <Plus size={15} />}{' '}
            {busy ? 'Salvando…' : initial ? 'Salvar alteração' : 'Salvar medição'}
          </button>
          {initial && (
            <a className="text-link" href={`/instagram?mode=${mode}`}>
              Cancelar edição
            </a>
          )}
          <span role="status">{status}</span>
        </div>
      </form>
    </section>
  );
}
