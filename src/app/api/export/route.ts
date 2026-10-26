import { z } from 'zod';
import { db } from '@/lib/db';
import { apiError } from '@/lib/security/http';
import { dateSchema, metricKeys } from '@/features/imports/schema';
import { exportCsv } from '@/features/imports/csv';
import { previousPeriod } from '@/features/analytics/dates';
import { comparison, summarize, type Metric } from '@/features/analytics/metrics';
export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams,
      mode = z.enum(['real', 'demo']).parse(query.get('mode') ?? 'real');
    const snapshots = await db.accountInsightSnapshot.findMany({
      where: { accountId: `${mode}-instagram` },
      orderBy: { collectedAt: 'desc' },
    });
    let rows: Record<string, unknown>[];
    if (query.get('format') === 'report') {
      const start = dateSchema.parse(query.get('start')),
        end = dateSchema.parse(query.get('end')),
        duration = (Date.parse(end) - Date.parse(start)) / 86400000 + 1;
      if (duration < 1 || duration > 90) throw new Error('O relatório aceita de 1 a 90 dias.');
      const before = previousPeriod(start, end);
      rows = (
        [
          'views',
          'reach',
          'viewers',
          'interactions',
          'engagedAccounts',
          'followers',
          'profileVisits',
          'linkClicks',
        ] as Metric[]
      ).map((metric) => {
        const current = summarize(snapshots, metric, start, end),
          prior = summarize(snapshots, metric, before.start, before.end);
        return {
          workspace: mode,
          metric,
          periodStart: start,
          periodEnd: end,
          value: current.value,
          previousStart: before.start,
          previousEnd: before.end,
          previous: prior.value,
          changePercent: comparison(current.value, prior.value),
          source: current.sources.join('+'),
          collectedAt: current.collectedAt,
          availability: current.coverage,
        };
      });
    } else
      rows = snapshots.map((s) => ({
        workspace: mode,
        id: s.id,
        measuredOn: s.measuredOn,
        periodStart: s.periodStart,
        periodEnd: s.periodEnd,
        source: s.source,
        collectedAt: s.collectedAt.toISOString(),
        ...Object.fromEntries(metricKeys.map((key) => [key, s[key]])),
        notes: s.notes,
      }));
    if (rows.length === 0) rows = [{ workspace: mode, notes: 'Nenhuma medição disponível.' }];
    return new Response(exportCsv(rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="wiener-${mode}-${query.get('format') === 'report' ? 'relatorio' : 'historico'}.csv"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
