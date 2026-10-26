import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL ?? 'file:./wiener.db' });
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(
  new Date(),
);
const shift = (day: string, amount: number) =>
  new Date(Date.parse(`${day}T12:00:00Z`) + amount * 86400000).toISOString().slice(0, 10);

async function seed() {
  // Migração compatível dos seeds iniciais: identidade fixa não muda na edição.
  const legacy = await db.accountInsightSnapshot.findMany({
    where: {
      OR: [
        { dedupeKey: { startsWith: 'real-historical-' } },
        { dedupeKey: { startsWith: 'demo-day-' } },
        { dedupeKey: { startsWith: 'demo-period-' } },
      ],
    },
  });
  for (const row of legacy) {
    const stableId = `seed-${row.dedupeKey}`;
    if (row.id !== stableId)
      await db.accountInsightSnapshot.update({ where: { id: row.id }, data: { id: stableId } });
  }
  for (const mode of ['real', 'demo']) {
    await db.workspace.upsert({
      where: { id: mode },
      create: {
        id: mode,
        name: mode === 'real' ? 'Odonto Wiener' : 'Odonto Wiener · demonstração',
        mode,
      },
      update: {},
    });
    await db.socialAccount.upsert({
      where: { id: `${mode}-instagram` },
      create: { id: `${mode}-instagram`, workspaceId: mode, username: 'odontowiener' },
      update: {},
    });
  }
  // Capturas reais ficam somente em arquivo local ignorado pelo Git.
  const privateSeedPath = resolve(process.env.PRIVATE_SEED_PATH ?? 'data/private-seed.ts');
  if (existsSync(privateSeedPath)) {
    const { seedPrivate } = await import(pathToFileURL(privateSeedPath).href);
    await seedPrivate(db);
  }
  for (let i = 59; i >= 0; i--) {
    const day = shift(today, -i);
    const views = 420 + (59 - i) * 11 + Math.round(Math.sin(i * 1.3) * 130);
    const metrics = {
      views,
      reach: Math.round(views * 0.71),
      viewers: Math.round(views * 0.68),
      interactions: Math.round(views * 0.057),
      engagedAccounts: Math.round(views * 0.042),
      followers: 650 + (59 - i) * 2,
      profileVisits: Math.round(views * 0.065),
      linkClicks: Math.round(views * 0.009),
    };
    await db.accountInsightSnapshot.upsert({
      where: { id: `seed-demo-day-${day}` },
      update: {},
      create: {
        id: `seed-demo-day-${day}`,
        accountId: 'demo-instagram',
        dedupeKey: `demo-day-${day}`,
        source: 'DEMO',
        measuredOn: day,
        periodStart: day,
        periodEnd: day,
        ...metrics,
        notes: 'Dados sintéticos para explorar a interface.',
      },
    });
  }
  for (const duration of [7, 14, 30]) {
    for (const offset of [0, duration]) {
      const end = shift(today, -offset),
        start = shift(end, -duration + 1);
      const days = await db.accountInsightSnapshot.findMany({
        where: {
          accountId: 'demo-instagram',
          periodStart: { gte: start },
          periodEnd: { lte: end },
          dedupeKey: { startsWith: 'demo-day-' },
        },
      });
      const views = days.reduce((sum, r) => sum + (r.views ?? 0), 0);
      await db.accountInsightSnapshot.upsert({
        where: { id: `seed-demo-period-${start}-${end}` },
        update: {},
        create: {
          id: `seed-demo-period-${start}-${end}`,
          accountId: 'demo-instagram',
          dedupeKey: `demo-period-${start}-${end}`,
          source: 'DEMO',
          measuredOn: end,
          periodStart: start,
          periodEnd: end,
          views,
          reach: Math.round(views * 0.43),
          viewers: Math.round(views * 0.4),
          interactions: days.reduce((s, r) => s + (r.interactions ?? 0), 0),
          engagedAccounts: Math.round(views * 0.025),
          followers: days.sort((a, b) => b.measuredOn.localeCompare(a.measuredOn))[0]?.followers,
          profileVisits: days.reduce((s, r) => s + (r.profileVisits ?? 0), 0),
          linkClicks: days.reduce((s, r) => s + (r.linkClicks ?? 0), 0),
          notes:
            'Snapshot demonstrativo do período. As contagens únicas são sintéticas, não soma de dias.',
        },
      });
    }
  }
  const captions = [
    'Seu sorriso merece um novo começo',
    'O cuidado começa na prevenção',
    'Prótese protocolo: dúvidas frequentes',
    'Bastidores de um atendimento com cuidado',
    'Uma rotina simples, um sorriso saudável',
    'Agende sua avaliação com nossa equipe',
  ];
  for (let i = 0; i < 6; i++) {
    const day = shift(today, -2 - i * 4),
      views = 920 + i * 317;
    const media = await db.media.upsert({
      where: { accountId_localKey: { accountId: 'demo-instagram', localKey: `demo-content-${i}` } },
      update: {},
      create: {
        accountId: 'demo-instagram',
        localKey: `demo-content-${i}`,
        type: ['REEL', 'CAROUSEL', 'REEL', 'STORY', 'FEED', 'STORY'][i],
        caption: captions[i],
        publishedOn: day,
        traffic: i === 2 ? 'MIXED' : 'ORGANIC',
      },
    });
    await db.mediaInsightSnapshot.upsert({
      where: { dedupeKey: `demo-content-snapshot-${i}` },
      update: {},
      create: {
        mediaId: media.id,
        dedupeKey: `demo-content-snapshot-${i}`,
        source: 'DEMO',
        measuredOn: today,
        periodStart: day,
        periodEnd: today,
        views,
        reach: Math.round(views * 0.73),
        interactions: 35 + i * 7,
        likes: 27 + i * 4,
        comments: 3,
        shares: 4,
        saves: 1,
        followersGained: 2,
        notes: 'Métricas acumuladas demonstrativas; não correspondem apenas ao período do filtro.',
      },
    });
  }
  console.log('Seed concluído: workspaces real/demo isolados. Nenhuma conexão Meta criada.');
}
seed().finally(() => db.$disconnect());
