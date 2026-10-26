import { PrismaClient } from '@prisma/client';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { it, expect } from 'vitest';
import { SnapshotService } from '../src/server/services/snapshots';
import { snapshotSchema } from '../src/features/imports/schema';
it('seed repetido preserva edições de registros históricos e demonstrativos sem duplicar', async () => {
  const file = resolve('.tools', `seed-${process.pid}.db`),
    url = `file:../.tools/seed-${process.pid}.db`,
    fixture = resolve('.tools', `seed-fixture-${process.pid}.ts`),
    env = { ...process.env, DATABASE_URL: url, PRIVATE_SEED_PATH: fixture };
  mkdirSync(resolve('.tools'), { recursive: true });
  writeFileSync(file, '');
  writeFileSync(
    fixture,
    `export async function seedPrivate(db) { await db.accountInsightSnapshot.upsert({where:{id:'seed-private-test'},update:{},create:{id:'seed-private-test',accountId:'real-instagram',dedupeKey:'private-test',source:'MANUAL',measuredOn:'2026-10-26',views:11,notes:'Fixture sintética de teste'}}); }`,
  );
  const db = new PrismaClient({ datasourceUrl: url });
  try {
    execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
      env,
      stdio: 'pipe',
    });
    const seed = () =>
      execFileSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'prisma/seed.ts'], {
        env,
        stdio: 'pipe',
      });
    seed();
    const count = await db.accountInsightSnapshot.count();
    const historical = await db.accountInsightSnapshot.findFirstOrThrow({
        where: { accountId: 'real-instagram' },
      }),
      demo = await db.accountInsightSnapshot.findFirstOrThrow({
        where: { accountId: 'demo-instagram', periodStart: { not: null } },
      });
    expect(historical.views).toBe(11);
    await new SnapshotService(db).editAccount(
      'real',
      historical.id,
      snapshotSchema.parse({ ...historical, views: 12 }),
    );
    await new SnapshotService(db).editAccount(
      'demo',
      demo.id,
      snapshotSchema.parse({ ...demo, views: 999999 }),
    );
    seed();
    expect(await db.accountInsightSnapshot.count()).toBe(count);
    expect(
      (await db.accountInsightSnapshot.findUniqueOrThrow({ where: { id: historical.id } })).views,
    ).toBe(12);
    expect(
      (await db.accountInsightSnapshot.findUniqueOrThrow({ where: { id: demo.id } })).views,
    ).toBe(999999);
  } finally {
    await db.$disconnect();
    rmSync(file, { force: true });
    rmSync(fixture, { force: true });
  }
}, 90000);

it('seed público funciona sem arquivo privado e mantém o workspace real vazio', async () => {
  const file = resolve('.tools', `public-seed-${process.pid}.db`),
    url = `file:../.tools/public-seed-${process.pid}.db`;
  mkdirSync(resolve('.tools'), { recursive: true });
  writeFileSync(file, '');
  const env = {
    ...process.env,
    DATABASE_URL: url,
    PRIVATE_SEED_PATH: resolve('.tools', 'arquivo-inexistente.ts'),
  };
  const db = new PrismaClient({ datasourceUrl: url });
  try {
    execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
      env,
      stdio: 'pipe',
    });
    execFileSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'prisma/seed.ts'], {
      env,
      stdio: 'pipe',
    });
    expect(await db.accountInsightSnapshot.count({ where: { accountId: 'real-instagram' } })).toBe(
      0,
    );
    expect(await db.media.count({ where: { accountId: 'real-instagram' } })).toBe(0);
    expect(await db.campaign.count({ where: { workspaceId: 'real' } })).toBe(0);
    expect(
      await db.accountInsightSnapshot.count({
        where: { accountId: 'demo-instagram', source: 'DEMO' },
      }),
    ).toBeGreaterThan(0);
  } finally {
    await db.$disconnect();
    rmSync(file, { force: true });
  }
}, 90000);
