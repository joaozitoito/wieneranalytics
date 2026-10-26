import { z } from 'zod';
z.config(z.locales.pt());
export const metricKeys = [
  'views',
  'reach',
  'viewers',
  'interactions',
  'engagedAccounts',
  'followers',
  'profileVisits',
  'linkClicks',
  'addressClicks',
] as const;
export const fieldLabels: Record<string, string> = {
  measuredOn: 'Data da leitura',
  periodStart: 'Início do período',
  periodEnd: 'Fim do período',
  views: 'Visualizações',
  reach: 'Contas alcançadas',
  viewers: 'Visualizadores',
  interactions: 'Interações',
  engagedAccounts: 'Contas que interagiram',
  followers: 'Seguidores',
  profileVisits: 'Visitas ao perfil',
  linkClicks: 'Toques em links',
  addressClicks: 'Toques no endereço',
  notes: 'Observações',
};
export const dateSchema = z
  .string()
  .refine(
    (v) =>
      /^\d{4}-\d{2}-\d{2}$/.test(v) &&
      !isNaN(Date.parse(v + 'T12:00:00Z')) &&
      new Date(v + 'T12:00:00Z').toISOString().slice(0, 10) === v,
    'Use uma data válida no formato AAAA-MM-DD',
  );
const nullableDate = z.preprocess(
  (v) => (v === '' || v === undefined ? null : v),
  dateSchema.nullable(),
);
export const countSchema = z.preprocess(
  (v) =>
    v === '' || v === undefined
      ? null
      : typeof v === 'string' && /^\d+$/.test(v.trim())
        ? Number(v)
        : v,
  z.number().int().min(0).max(2147483647).nullable(),
);
export const baseSnapshotSchema = z
  .object({
    measuredOn: dateSchema,
    periodStart: nullableDate,
    periodEnd: nullableDate,
    views: countSchema,
    reach: countSchema,
    viewers: countSchema,
    interactions: countSchema,
    engagedAccounts: countSchema,
    followers: countSchema,
    profileVisits: countSchema,
    linkClicks: countSchema,
    addressClicks: countSchema,
    notes: z.string().trim().max(2000).optional().default(''),
  })
  .superRefine((value, ctx) => {
    if (Boolean(value.periodStart) !== Boolean(value.periodEnd))
      ctx.addIssue({
        code: 'custom',
        path: ['periodEnd'],
        message: 'Informe ambas as datas do período ou deixe ambas vazias.',
      });
    if (value.periodStart && value.periodEnd && value.periodStart > value.periodEnd)
      ctx.addIssue({
        code: 'custom',
        path: ['periodEnd'],
        message: 'O fim deve ser posterior ou igual ao início.',
      });
    if (value.periodEnd && value.periodEnd > value.measuredOn)
      ctx.addIssue({
        code: 'custom',
        path: ['measuredOn'],
        message: 'A leitura não pode ser anterior ao fim do período.',
      });
  });
export const snapshotSchema = baseSnapshotSchema.refine(
  (value) => metricKeys.some((k) => value[k] !== null),
  { path: ['views'], message: 'Informe pelo menos uma métrica conhecida.' },
);
export const mediaSnapshotSchema = baseSnapshotSchema
  .safeExtend({
    likes: countSchema,
    comments: countSchema,
    shares: countSchema,
    saves: countSchema,
    followersGained: countSchema,
    stickerClicks: countSchema,
  })
  .refine(
    (value) =>
      [
        value.views,
        value.reach,
        value.viewers,
        value.interactions,
        value.engagedAccounts,
        value.profileVisits,
        value.linkClicks,
        value.likes,
        value.comments,
        value.shares,
        value.saves,
        value.followersGained,
        value.stickerClicks,
      ].some((v) => v !== null),
    { path: ['views'], message: 'Informe pelo menos uma métrica conhecida do conteúdo.' },
  );
export type SnapshotInput = z.infer<typeof snapshotSchema>;
