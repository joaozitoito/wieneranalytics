import { PrismaClient } from '@prisma/client';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { SnapshotService } from '../src/server/services/snapshots';
import { snapshotSchema } from '../src/features/imports/schema';

const path = resolve('.tools', `test-${process.pid}.db`),
  url = `file:../.tools/test-${process.pid}.db`;
const db = new PrismaClient({ datasourceUrl: url });
const service = new SnapshotService(db);
beforeAll(async () => {
  mkdirSync(resolve('.tools'), { recursive: true });
  writeFileSync(path, '');
  execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  });
  for (const mode of ['real', 'demo']) {
    await db.workspace.create({ data: { id: mode, name: mode, mode } });
    await db.socialAccount.create({
      data: { id: `${mode}-instagram`, workspaceId: mode, username: 'test' },
    });
  }
}, 60000);
afterAll(async () => {
  await db.$disconnect();
  rmSync(path, { force: true });
});
describe('persistência real em SQLite', () => {
  const input = snapshotSchema.parse({
    measuredOn: '2026-10-26',
    periodStart: '2026-10-20',
    periodEnd: '2026-10-26',
    views: 101,
    reach: null,
    interactions: 0,
  });
  it('deduplica capturas idênticas e isola demonstração', async () => {
    const first = await service.saveAccount('real', input),
      again = await service.saveAccount('real', input),
      demo = await service.saveAccount('demo', input);
    expect(first.skipped).toBe(false);
    expect(again.skipped).toBe(true);
    expect(demo.id).not.toBe(first.id);
    const real = await db.accountInsightSnapshot.findMany({
        where: { accountId: 'real-instagram' },
      }),
      fake = await db.accountInsightSnapshot.findMany({ where: { accountId: 'demo-instagram' } });
    expect(real).toHaveLength(1);
    expect(real[0].reach).toBeNull();
    expect(real[0].interactions).toBe(0);
    expect(real[0].source).toBe('MANUAL');
    expect(fake[0].source).toBe('DEMO');
  });
  it('edição preserva versão anterior e impede edição em outro ambiente', async () => {
    const saved = await service.saveAccount('real', input);
    await expect(service.editAccount('demo', saved.id, { ...input, views: 102 })).rejects.toThrow();
    await service.editAccount('real', saved.id, { ...input, views: 102 });
    const revised = await db.accountInsightSnapshot.findUniqueOrThrow({
      where: { id: saved.id },
      include: { revisions: true },
    });
    expect(revised.views).toBe(102);
    expect(revised.revisions).toHaveLength(1);
    expect(JSON.parse(revised.revisions[0].previous).views).toBe(101);
  });
  it('reimportação é idempotente com relatório e origem preservada', async () => {
    const csv = {
      ...input,
      measuredOn: '2026-10-25',
      periodStart: null,
      periodEnd: null,
      views: 200,
    };
    expect(await service.importAccounts('real', [csv, csv], 'capturas.csv', 'hash')).toEqual({
      inserted: 1,
      skipped: 1,
    });
    expect(await service.importAccounts('real', [csv], 'capturas.csv', 'hash')).toEqual({
      inserted: 0,
      skipped: 1,
    });
    const item = await db.accountInsightSnapshot.findFirstOrThrow({
      where: { measuredOn: '2026-10-25' },
    });
    expect(item.source).toBe('CSV');
    expect(item.importedDatasetId).not.toBeNull();
    expect(await db.accountInsightSnapshot.count({ where: { accountId: 'demo-instagram' } })).toBe(
      1,
    );
  });
});
