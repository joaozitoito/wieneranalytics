import { z } from 'zod';
import { db } from '@/lib/db';
import { readLocalJson, apiError } from '@/lib/security/http';
import {
  countSchema,
  dateSchema,
  snapshotSchema,
  mediaSnapshotSchema,
} from '@/features/imports/schema';
import { fingerprint, SnapshotService } from '@/server/services/snapshots';
const envelope = z.object({
  mode: z.enum(['real', 'demo']),
  kind: z.enum(['account', 'media']).default('account'),
  id: z.string().optional(),
});
const mediaSchema = z.object({
  localKey: z.string().trim().min(1).max(100),
  caption: z.string().trim().min(1).max(1000),
  mediaType: z.enum(['FEED', 'CAROUSEL', 'REEL', 'STORY']),
  traffic: z.enum(['ORGANIC', 'PAID', 'MIXED', 'UNKNOWN']),
  publishedOn: z.preprocess((v) => (v === '' || v === undefined ? null : v), dateSchema.nullable()),
  likes: countSchema,
  comments: countSchema,
  shares: countSchema,
  saves: countSchema,
  followersGained: countSchema,
  stickerClicks: countSchema,
});
export async function POST(request: Request) {
  try {
    const raw = await readLocalJson(request),
      { mode, kind } = envelope.parse(raw);
    if (kind === 'account')
      return Response.json(
        await new SnapshotService(db).saveAccount(mode, snapshotSchema.parse(raw)),
      );
    const input = mediaSnapshotSchema.parse(raw);
    const details = mediaSchema.parse(raw);
    if (details.publishedOn && details.publishedOn > input.measuredOn)
      throw new Error('A publicação não pode ser posterior à leitura.');
    const accountId = `${mode}-instagram`,
      { localKey, caption, mediaType: type, traffic, publishedOn, ...extra } = details;
    const result = await db.$transaction(async (tx) => {
      const media = await tx.media.upsert({
        where: { accountId_localKey: { accountId, localKey } },
        create: { accountId, localKey, caption, type, traffic, publishedOn },
        update: {},
      });
      const metrics = {
        measuredOn: input.measuredOn,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        notes: input.notes,
        views: input.views,
        reach: input.reach,
        viewers: input.viewers,
        interactions: input.interactions,
        engagedAccounts: input.engagedAccounts,
        profileVisits: input.profileVisits,
        linkClicks: input.linkClicks,
        ...extra,
      };
      const dedupeKey = fingerprint(media.id, metrics),
        existing = await tx.mediaInsightSnapshot.findUnique({ where: { dedupeKey } });
      if (existing) return { id: existing.id, skipped: true };
      const s = await tx.mediaInsightSnapshot.create({
        data: {
          mediaId: media.id,
          dedupeKey,
          source: mode === 'demo' ? 'DEMO' : 'MANUAL',
          ...metrics,
        },
      });
      return { id: s.id, skipped: false };
    });
    return Response.json(result);
  } catch (error) {
    return apiError(error);
  }
}
export async function PATCH(request: Request) {
  try {
    const raw = await readLocalJson(request),
      { mode, id } = envelope.parse(raw);
    if (!id) throw new Error('Identificador da medição ausente.');
    return Response.json(
      await new SnapshotService(db).editAccount(mode, id, snapshotSchema.parse(raw)),
    );
  } catch (error) {
    return apiError(error);
  }
}
