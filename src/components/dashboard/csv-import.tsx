'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, FileUp, Upload } from 'lucide-react';
import { fieldLabels } from '@/features/imports/schema';
import type { Mapping, Preview } from '@/features/imports/csv';
export function CsvImport({ mode }: { mode: string }) {
  const router = useRouter();
  const [csv, setCsv] = useState('');
  const [filename, setFilename] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [preview, setPreview] = useState<Preview | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  async function request(action: string, text = csv) {
    setBusy(true);
    setStatus('');
    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, csv: text, mapping, mode, filename }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Erro de importação');
      if (action === 'inspect') {
        setHeaders(data.headers);
        setMapping(data.suggested);
        setPreview(null);
      } else if (action === 'preview') {
        setPreview(data);
      } else {
        setStatus(
          `Importação concluída: ${data.inserted} inseridos, ${data.skipped} duplicados ignorados.`,
        );
        setPreview(null);
        router.refresh();
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Erro ao processar arquivo');
    } finally {
      setBusy(false);
    }
  }
  async function readFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 1_000_000) {
      setStatus('O limite é 1 MB por arquivo.');
      return;
    }
    const text = await file.text();
    setCsv(text);
    setFilename(file.name);
    await request('inspect', text);
  }
  return (
    <section className="panel form-panel" id="importar">
      <h2>Importar snapshots da conta</h2>
      <p>
        CSV de até 1 MB e 1.000 linhas. Escolha as colunas, revise a prévia e confirme. Datas em
        AAAA-MM-DD e contagens inteiras sem separadores de milhar.
      </p>
      <div className="form-actions">
        <label className="button secondary">
          <Upload size={15} />
          Escolher CSV
          <input
            className="sr-only"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => readFile(e.target.files?.[0])}
            disabled={busy}
          />
        </label>
        <a className="text-link" href="/modelo-snapshots.csv" download>
          Baixar modelo
        </a>
        <span>{filename}</span>
      </div>
      {headers.length > 0 && (
        <>
          <h3 style={{ marginTop: 23, marginBottom: 15 }}>Mapeamento de colunas</h3>
          <div className="form-grid">
            {Object.entries(fieldLabels).map(([key, label]) => (
              <label className="field" key={key}>
                {label}
                {key === 'measuredOn' ? ' *' : ''}
                <select
                  disabled={busy}
                  value={mapping[key] ?? ''}
                  onChange={(e) => {
                    setMapping({ ...mapping, [key]: e.target.value });
                    setPreview(null);
                  }}
                >
                  <option value="">Não importar</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div className="form-actions">
            <button className="button secondary" disabled={busy} onClick={() => request('preview')}>
              <FileUp size={15} />
              Validar e visualizar
            </button>
          </div>
        </>
      )}
      {preview && (
        <div style={{ marginTop: 20 }}>
          <div className={`notice ${preview.errors.length ? 'error' : ''}`}>
            {preview.total} linhas encontradas · {preview.rows.length} válidas ·{' '}
            {preview.errors.length} erros.{' '}
            {preview.errors.length
              ? 'Corrija o arquivo antes de confirmar.'
              : 'A gravação ainda não ocorreu.'}
          </div>
          {preview.errors.slice(0, 10).map((error, i) => (
            <p key={i}>
              Linha {error.row}: {error.message}
            </p>
          ))}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Leitura</th>
                  <th>Período</th>
                  <th>Views</th>
                  <th>Alcance</th>
                  <th>Interações</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    <td>{row.measuredOn}</td>
                    <td>
                      {row.periodStart ?? 'Não confirmado'}
                      {row.periodEnd ? ` a ${row.periodEnd}` : ''}
                    </td>
                    <td>{row.views ?? '—'}</td>
                    <td>{row.reach ?? '—'}</td>
                    <td>{row.interactions ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="form-actions">
            <button
              className="button"
              disabled={busy || preview.errors.length > 0 || preview.rows.length === 0}
              onClick={() => request('commit')}
            >
              <Check size={15} />
              {busy ? 'Importando…' : 'Confirmar importação'}
            </button>
            <small>Duplicatas idênticas serão ignoradas.</small>
          </div>
        </div>
      )}
      {status && (
        <p className="notice" role="status" style={{ marginTop: 15 }}>
          {status}
        </p>
      )}
    </section>
  );
}
