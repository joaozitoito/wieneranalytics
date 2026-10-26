import { db } from '@/lib/db';
import { todayLocal, shiftDay } from '@/features/analytics/dates';

export type Mode = 'real' | 'demo';
export type Query = Record<string, string | string[] | undefined>;
export function parseFilters(query: Query) {
  const mode: Mode = query.mode === 'demo' ? 'demo' : 'real';
  const preset = ['1', '7', '14', '30', '90', 'custom'].includes(String(query.preset))
    ? String(query.preset)
    : '30';
  const today = todayLocal();
  const validDate = (v: unknown): v is string =>
    typeof v === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    !isNaN(Date.parse(`${v}T12:00:00Z`)) &&
    new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v;
  let start = shiftDay(today, -(preset === 'custom' ? 30 : Number(preset)) + 1),
    end = today;
  if (
    preset === 'custom' &&
    validDate(query.start) &&
    validDate(query.end) &&
    query.start <= query.end &&
    (Date.parse(query.end) - Date.parse(query.start)) / 86400000 < 90
  ) {
    start = query.start;
    end = query.end;
  }
  return { mode, preset, start, end };
}
export async function loadWorkspace(mode: Mode) {
  const accountId = `${mode}-instagram`;
  const [account, snapshots, media, campaigns, leads, imports] = await Promise.all([
    db.socialAccount.findUnique({
      where: { id: accountId },
      include: { connection: true, syncJobs: { orderBy: { startedAt: 'desc' }, take: 10 } },
    }),
    db.accountInsightSnapshot.findMany({
      where: { accountId },
      orderBy: { collectedAt: 'desc' },
      include: { _count: { select: { revisions: true } } },
    }),
    db.media.findMany({
      where: { accountId },
      include: { snapshots: { orderBy: { collectedAt: 'desc' } } },
      orderBy: { publishedOn: 'desc' },
    }),
    db.campaign.findMany({ where: { workspaceId: mode } }),
    db.leadSummary.findMany({ where: { workspaceId: mode }, orderBy: { date: 'desc' } }),
    db.importedDataset.findMany({
      where: { workspaceId: mode },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);
  return { account, snapshots, media, campaigns, leads, imports };
}
export type WorkspaceData = Awaited<ReturnType<typeof loadWorkspace>>;
