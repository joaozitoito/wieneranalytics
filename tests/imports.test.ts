import { describe, it, expect } from 'vitest';
import { snapshotSchema } from '../src/features/imports/schema';
import { inspectCsv, previewCsv, exportCsv } from '../src/features/imports/csv';
describe('entrada manual', () => {
  it('distingue ausente de zero e rejeita negativos ou datas impossíveis', () => {
    const parsed = snapshotSchema.parse({ measuredOn: '2026-10-26', views: '0', reach: '' });
    expect(parsed.views).toBe(0);
    expect(parsed.reach).toBeNull();
    for (const value of [
      { measuredOn: '2026-02-30', views: 2 },
      { measuredOn: '2026-10-26', views: -1 },
      { measuredOn: '2026-10-26', views: 2, periodStart: '2026-10-20' },
      { measuredOn: '2026-10-26' },
    ])
      expect(snapshotSchema.safeParse(value).success).toBe(false);
  });
});
describe('CSV com mapeamento explícito', () => {
  const csv =
    'Data;Visualizações;Alcance;Observações\n2026-10-26;101;;"leitura; sem período"\n2026-10-25;0;0;captura';
  const mapping = {
    measuredOn: 'Data',
    views: 'Visualizações',
    reach: 'Alcance',
    notes: 'Observações',
  };
  it('identifica separador e preserva vazios, zero e campos entre aspas', () => {
    expect(inspectCsv(csv).headers).toEqual(['Data', 'Visualizações', 'Alcance', 'Observações']);
    const preview = previewCsv(csv, mapping);
    expect(preview.errors).toEqual([]);
    expect(preview.rows[0].reach).toBeNull();
    expect(preview.rows[0].notes).toBe('leitura; sem período');
    expect(preview.rows[1].reach).toBe(0);
  });
  it('retorna erros de linha antes de qualquer gravação', () => {
    const result = previewCsv('data,views\n2026-10-26,4\n2026-10-27,-1', {
      measuredOn: 'data',
      views: 'views',
    });
    expect(result.total).toBe(2);
    expect(result.errors[0].row).toBe(3);
  });
  it('rejeita cabeçalhos duplicados, colunas ausentes e mapeamento repetido', () => {
    expect(() => inspectCsv('views,views\n1,2')).toThrow();
    expect(() => previewCsv(csv, { measuredOn: 'Inexistente', views: 'Visualizações' })).toThrow();
    expect(() =>
      previewCsv(csv, { measuredOn: 'Data', periodStart: 'Data', views: 'Visualizações' }),
    ).toThrow();
  });
  it('neutraliza fórmulas de planilha e mantém observações com vírgulas', () => {
    const text = exportCsv([
      { notes: '=HYPERLINK("url")', views: 0, reach: null },
      { notes: 'texto, com vírgula', views: 4, reach: 12 },
    ]);
    expect(text).toContain("'=HYPERLINK");
    expect(text).toContain('"texto, com vírgula"');
    expect(text).not.toContain('undefined');
  });
});
