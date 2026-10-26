import { describe, it, expect } from 'vitest';
import { ratio, comparison, summarize, type Snapshot } from '../src/features/analytics/metrics';
import { todayLocal, shiftDay, previousPeriod } from '../src/features/analytics/dates';

const row = (
  start: string | null,
  end: string | null,
  views: number | null,
  extra = {},
): Snapshot => ({
  periodStart: start,
  periodEnd: end,
  views,
  reach: 15,
  collectedAt: '2026-10-26T15:00:00Z',
  source: 'MANUAL',
  ...extra,
});
describe('métricas honestas', () => {
  it('não divide por zero, null ou valor desconhecido', () => {
    expect(ratio(4, 0)).toBeNull();
    expect(ratio(null, 10)).toBeNull();
    expect(ratio(4, null)).toBeNull();
    expect(ratio(3, 12)).toBe(25);
    expect(ratio(0, 12)).toBe(0);
  });
  it('não inventa crescimento quando o anterior é zero ou ausente', () => {
    expect(comparison(5, 0)).toBeNull();
    expect(comparison(null, 3)).toBeNull();
    expect(comparison(12, 10)).toBe(20);
  });
  it('exclui períodos desconhecidos e snapshots de outros intervalos', () => {
    expect(
      summarize(
        [row(null, null, 101), row('2026-10-01', '2026-10-07', 120)],
        'views',
        '2026-10-20',
        '2026-10-26',
      ).value,
    ).toBeNull();
  });
  it('seleciona a revisão mais recente de um intervalo exato sem duplicar', () => {
    const rows = [
      row('2026-10-20', '2026-10-26', 10, { collectedAt: '2026-10-25T12:00:00Z' }),
      row('2026-10-20', '2026-10-26', 18),
    ];
    expect(summarize(rows, 'views', '2026-10-20', '2026-10-26').value).toBe(18);
  });
  it('soma apenas dias completos e não sobrepõe um snapshot de semana', () => {
    const rows = [
      row('2026-10-25', '2026-10-25', 4),
      row('2026-10-26', '2026-10-26', 6),
      row('2026-10-20', '2026-10-26', 90),
    ];
    expect(summarize(rows, 'views', '2026-10-25', '2026-10-26').value).toBe(10);
    expect(summarize(rows.slice(1), 'views', '2026-10-25', '2026-10-26').value).toBeNull();
  });
  it('não soma alcance, visualizadores, seguidores ou contas únicas de dias diferentes', () => {
    for (const metric of ['reach', 'viewers', 'engagedAccounts', 'followers'] as const)
      expect(
        summarize(
          [row('2026-10-25', '2026-10-25', 4), row('2026-10-26', '2026-10-26', 6)],
          metric,
          '2026-10-25',
          '2026-10-26',
        ).value,
      ).toBeNull();
  });
  it('preserva null se qualquer dia tem métrica desconhecida', () => {
    expect(
      summarize(
        [row('2026-10-25', '2026-10-25', null), row('2026-10-26', '2026-10-26', 0)],
        'views',
        '2026-10-25',
        '2026-10-26',
      ).value,
    ).toBeNull();
  });
});
describe('datas em Pelotas', () => {
  it('usa o dia local próximo à meia-noite UTC', () =>
    expect(todayLocal(new Date('2026-10-27T01:00:00Z'))).toBe('2026-10-26'));
  it('compara intervalos inclusivos equivalentes e atravessa mês', () => {
    expect(previousPeriod('2026-10-20', '2026-10-26')).toEqual({
      start: '2026-10-13',
      end: '2026-10-19',
    });
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28');
  });
});
