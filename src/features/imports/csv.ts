import Papa from 'papaparse';
import { fieldLabels, metricKeys, snapshotSchema, type SnapshotInput } from './schema';
export type Mapping = Record<string, string>;
export type Preview = {
  headers: string[];
  rows: SnapshotInput[];
  errors: { row: number; message: string }[];
  total: number;
};
function parse(csv: string) {
  if (Buffer.byteLength(csv, 'utf8') > 1_000_000) throw new Error('CSV excede 1 MB.');
  const result = Papa.parse<string[]>(csv.replace(/^\uFEFF/, ''), { skipEmptyLines: 'greedy' });
  if (result.errors.some((e) => e.code !== 'UndetectableDelimiter'))
    throw new Error('CSV malformado: confira aspas e delimitadores.');
  const headers = result.data[0]?.map((h) => h.trim()) ?? [];
  if (headers.length === 0 || headers.some((h) => !h))
    throw new Error('Cabeçalhos vazios não são permitidos.');
  if (new Set(headers).size !== headers.length)
    throw new Error('Cabeçalhos duplicados não são permitidos.');
  if (result.data.length > 1001) throw new Error('O limite é 1.000 linhas de dados.');
  return { headers, data: result.data.slice(1) };
}
export function inspectCsv(csv: string): { headers: string[]; suggested: Mapping } {
  const { headers } = parse(csv),
    suggested: Mapping = {};
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  for (const [key, label] of Object.entries(fieldLabels)) {
    const header = headers.find(
      (h) => normalize(h) === normalize(key) || normalize(h) === normalize(label),
    );
    if (header) suggested[key] = header;
  }
  return { headers, suggested };
}
export function previewCsv(csv: string, mapping: Mapping): Preview {
  const { headers, data } = parse(csv),
    entries = Object.entries(mapping).filter(([, column]) => column);
  if (!mapping.measuredOn) throw new Error('Mapeie a data da leitura.');
  if (!metricKeys.some((k) => mapping[k])) throw new Error('Mapeie pelo menos uma métrica.');
  if (entries.some(([key, column]) => !(key in fieldLabels) || !headers.includes(column)))
    throw new Error('Mapeamento contém coluna ausente ou campo inválido.');
  if (new Set(entries.map(([, column]) => column)).size !== entries.length)
    throw new Error('Cada coluna só pode ser mapeada uma vez.');
  const rows: SnapshotInput[] = [],
    errors: Preview['errors'] = [];
  data.forEach((cells, index) => {
    if (cells.length !== headers.length) {
      errors.push({ row: index + 2, message: 'Quantidade de campos difere do cabeçalho.' });
      return;
    }
    const input = Object.fromEntries(
      entries.map(([key, column]) => [key, cells[headers.indexOf(column)]?.trim() ?? '']),
    );
    const result = snapshotSchema.safeParse(input);
    if (result.success) rows.push(result.data);
    else
      errors.push({
        row: index + 2,
        message: result.error.issues
          .map((i) => `${fieldLabels[String(i.path[0])] ?? i.path[0]}: ${i.message}`)
          .join('; '),
      });
  });
  return { headers, rows, errors, total: data.length };
}
export function exportCsv(rows: Record<string, unknown>[]): string {
  return '\uFEFF' + Papa.unparse(rows, { escapeFormulae: true, newline: '\r\n' });
}
