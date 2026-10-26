import { PrismaClient } from '@prisma/client';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { beforeAll, afterAll, it, expect } from 'vitest';

const file = resolve('.tools', `routes-${process.pid}.db`),
  url = `file:../.tools/routes-${process.pid}.db`;
const db = new PrismaClient({ datasourceUrl: url });
let snapshots: typeof import('../src/app/api/snapshots/route'),
  imports: typeof import('../src/app/api/import/route'),
  exports: typeof import('../src/app/api/export/route'),
  conversions: typeof import('../src/app/api/conversions/route');
let routeDb: PrismaClient;
const request = (path: string, body: unknown) =>
  new Request(`http://localhost:3000/api/${path}`, {
    method: 'POST',
    headers: {
      host: 'localhost:3000',
      origin: 'http://localhost:3000',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
beforeAll(async () => {
  mkdirSync(resolve('.tools'), { recursive: true });
  writeFileSync(file, '');
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
  process.env.DATABASE_URL = url;
  snapshots = await import('../src/app/api/snapshots/route');
  imports = await import('../src/app/api/import/route');
  exports = await import('../src/app/api/export/route');
  conversions = await import('../src/app/api/conversions/route');
  routeDb = (await import('../src/lib/db')).db;
}, 60000);
afterAll(async () => {
  await routeDb?.$disconnect();
  await db.$disconnect();
  rmSync(file, { force: true });
});
it('grava mídia sem duplicar e preserva métricas ausentes distintas de zero', async () => {
  const body = {
    mode: 'real',
    kind: 'media',
    measuredOn: '2026-10-26',
    localKey: 'story-test',
    caption: 'Story de teste',
    mediaType: 'STORY',
    publishedOn: '2026-10-22',
    traffic: 'UNKNOWN',
    views: 25,
    profileVisits: 0,
  };
  expect((await snapshots.POST(request('snapshots', body))).status).toBe(200);
  expect(await (await snapshots.POST(request('snapshots', body))).json()).toMatchObject({
    skipped: true,
  });
  const media = await db.media.findFirstOrThrow({
    where: { accountId: 'real-instagram' },
    include: { snapshots: true },
  });
  expect(media.snapshots).toHaveLength(1);
  expect(media.snapshots[0].stickerClicks).toBeNull();
  expect(media.snapshots[0].profileVisits).toBe(0);
});
it('aceita captura de conteúdo com somente uma métrica específica de mídia', async () => {
  const body = {
    mode: 'real',
    kind: 'media',
    measuredOn: '2026-10-26',
    localKey: 'likes-only',
    caption: 'Só curtidas conhecidas',
    mediaType: 'FEED',
    traffic: 'UNKNOWN',
    likes: 2,
  };
  expect((await snapshots.POST(request('snapshots', body))).status).toBe(200);
  const media = await db.media.findFirstOrThrow({
    where: { localKey: 'likes-only' },
    include: { snapshots: true },
  });
  expect(media.snapshots[0].likes).toBe(2);
  expect(media.snapshots[0].views).toBeNull();
});
it('prévia não grava e importação inválida não grava parcialmente', async () => {
  const body = {
    mode: 'real',
    filename: 'teste.csv',
    csv: 'measuredOn,views\n2026-10-26,19\n2026-10-25,-1',
    mapping: { measuredOn: 'measuredOn', views: 'views' },
  };
  const response = await imports.POST(request('import', { ...body, action: 'preview' }));
  expect(response.status).toBe(200);
  expect((await response.json()).errors).toHaveLength(1);
  expect((await imports.POST(request('import', { ...body, action: 'commit' }))).status).toBe(400);
  expect(await db.accountInsightSnapshot.count()).toBe(0);
});
it('exportação e relatório não misturam demo nem inventam período para histórico', async () => {
  for (const [mode, views] of [
    ['real', 777],
    ['demo', 222],
  ])
    expect(
      (
        await snapshots.POST(
          request('snapshots', {
            mode,
            kind: 'account',
            measuredOn: '2026-10-26',
            views,
            notes: `registro-${mode}`,
          }),
        )
      ).status,
    ).toBe(200);
  const csv = await (
    await exports.GET(new Request('http://localhost:3000/api/export?mode=real'))
  ).text();
  expect(csv).toContain('registro-real');
  expect(csv).not.toContain('registro-demo');
  const report = await (
    await exports.GET(
      new Request(
        'http://localhost:3000/api/export?mode=real&format=report&start=2026-10-20&end=2026-10-26',
      ),
    )
  ).text();
  expect(report).not.toContain('777');
  expect(report).toContain('Sem snapshot');
});
it('conversões validam atribuição e corrigem a mesma chave sem duplicar', async () => {
  const body = {
    mode: 'real',
    date: '2026-10-26',
    channel: 'INSTAGRAM',
    contacts: 3,
    attributedContacts: 4,
  };
  expect((await conversions.POST(request('conversions', body))).status).toBe(400);
  expect(
    (await conversions.POST(request('conversions', { ...body, attributedContacts: 2 }))).status,
  ).toBe(200);
  expect(
    (
      await conversions.POST(
        request('conversions', { ...body, contacts: 5, attributedContacts: 3 }),
      )
    ).status,
  ).toBe(200);
  const rows = await db.leadSummary.findMany();
  expect(rows).toHaveLength(1);
  expect(rows[0].contacts).toBe(5);
  expect(rows[0].closed).toBeNull();
});
