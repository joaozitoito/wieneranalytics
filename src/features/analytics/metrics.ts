import { shiftDay } from './dates';
export type Metric =
  | 'views'
  | 'reach'
  | 'viewers'
  | 'interactions'
  | 'engagedAccounts'
  | 'followers'
  | 'profileVisits'
  | 'linkClicks';
export type Snapshot = {
  periodStart: string | null;
  periodEnd: string | null;
  collectedAt: Date | string;
  source: string;
  [key: string]: unknown;
};
const known = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;
export function ratio(value: number | null, denominator: number | null): number | null {
  return known(value) && known(denominator) && denominator > 0 ? (value / denominator) * 100 : null;
}
export function comparison(value: number | null, previous: number | null): number | null {
  return known(value) && known(previous) && previous > 0
    ? ((value - previous) / previous) * 100
    : null;
}
export function summarize(
  rows: Snapshot[],
  metric: Metric,
  start: string,
  end: string,
): { value: number | null; sources: string[]; collectedAt: string | null; coverage: string } {
  const sorted = [...rows].sort(
    (a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime(),
  );
  const exact = sorted.find((row) => row.periodStart === start && row.periodEnd === end);
  if (exact)
    return {
      value: known(exact[metric]) ? exact[metric] : null,
      sources: [exact.source],
      collectedAt: new Date(exact.collectedAt).toISOString(),
      coverage: known(exact[metric])
        ? 'Snapshot do intervalo exato'
        : 'Métrica desconhecida na captura do intervalo',
    };
  const absent = {
    value: null,
    sources: [],
    collectedAt: null,
    coverage: 'Sem snapshot compatível com este intervalo',
  };
  if (!['views', 'interactions', 'profileVisits', 'linkClicks'].includes(metric)) return absent;
  const duration =
    (Date.parse(end + 'T12:00:00Z') - Date.parse(start + 'T12:00:00Z')) / 86400000 + 1;
  if (!Number.isInteger(duration) || duration < 1 || duration > 90) return absent;
  const daily: Snapshot[] = [];
  for (let day = start; day <= end; day = shiftDay(day, 1)) {
    const snapshot = sorted.find((row) => row.periodStart === day && row.periodEnd === day);
    if (!snapshot || !known(snapshot[metric]))
      return { ...absent, coverage: 'Medições diárias incompletas ou com métrica desconhecida' };
    daily.push(snapshot);
  }
  return {
    value: daily.reduce((sum, row) => sum + Number(row[metric]), 0),
    sources: [...new Set(daily.map((row) => row.source))],
    collectedAt: new Date(
      Math.max(...daily.map((row) => new Date(row.collectedAt).getTime())),
    ).toISOString(),
    coverage: `${duration} dias completos, sem sobreposição`,
  };
}
