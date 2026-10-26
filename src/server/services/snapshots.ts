import { createHash } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { snapshotSchema, type SnapshotInput } from '@/features/imports/schema';
export const fingerprint = (accountId: string, input: unknown) =>
  createHash('sha256').update(JSON.stringify({ accountId, input })).digest('hex');
export class SnapshotService {
  constructor(private db: PrismaClient) {}
  async saveAccount(
    mode: 'real' | 'demo',
    raw: SnapshotInput,
    source: 'MANUAL' | 'CSV' = 'MANUAL',
  ): Promise<{ id: string; skipped: boolean }> {
    const input = snapshotSchema.parse(raw),
      accountId = `${mode}-instagram`,
      dedupeKey = fingerprint(accountId, input);
    return this.db.$transaction(async (tx) => {
      const existing = await tx.accountInsightSnapshot.findUnique({ where: { dedupeKey } });
      if (existing) return { id: existing.id, skipped: true };
      const created = await tx.accountInsightSnapshot.create({
        data: { accountId, dedupeKey, source: mode === 'demo' ? 'DEMO' : source, ...input },
      });
      return { id: created.id, skipped: false };
    });
  }
  async editAccount(
    mode: 'real' | 'demo',
    id: string,
    raw: SnapshotInput,
  ): Promise<{ id: string }> {
    const input = snapshotSchema.parse(raw),
      accountId = `${mode}-instagram`;
    return this.db.$transaction(async (tx) => {
      const old = await tx.accountInsightSnapshot.findFirst({ where: { id, accountId } });
      if (!old) throw new Error('Medição não encontrada neste ambiente.');
      const dedupeKey = fingerprint(accountId, input);
      if (old.dedupeKey === dedupeKey) return { id };
      await tx.snapshotRevision.create({ data: { snapshotId: id, previous: JSON.stringify(old) } });
      await tx.accountInsightSnapshot.update({ where: { id }, data: { ...input, dedupeKey } });
      return { id };
    });
  }
  async importAccounts(
    mode: 'real' | 'demo',
    raw: SnapshotInput[],
    filename: string,
    sha256: string,
  ): Promise<{ inserted: number; skipped: number }> {
    const inputs = raw.map((row) => snapshotSchema.parse(row));
    return this.db.$transaction(
      async (tx) => {
        const dataset = await tx.importedDataset.create({
          data: { workspaceId: mode, filename, sha256, inserted: 0, skipped: 0 },
        });
        let inserted = 0,
          skipped = 0;
        for (const input of inputs) {
          const accountId = `${mode}-instagram`,
            dedupeKey = fingerprint(accountId, input);
          const existing = await tx.accountInsightSnapshot.findUnique({ where: { dedupeKey } });
          if (existing) {
            skipped++;
            continue;
          }
          await tx.accountInsightSnapshot.create({
            data: {
              accountId,
              dedupeKey,
              source: mode === 'demo' ? 'DEMO' : 'CSV',
              importedDatasetId: dataset.id,
              ...input,
            },
          });
          inserted++;
        }
        await tx.importedDataset.update({ where: { id: dataset.id }, data: { inserted, skipped } });
        return { inserted, skipped };
      },
      { timeout: 60000 },
    );
  }
}
