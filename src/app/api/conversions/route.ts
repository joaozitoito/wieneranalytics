import { z } from 'zod';
import { db } from '@/lib/db';
import { readLocalJson, apiError } from '@/lib/security/http';
import { countSchema, dateSchema } from '@/features/imports/schema';
const schema = z
  .object({
    mode: z.enum(['real', 'demo']),
    date: dateSchema,
    channel: z.enum(['INSTAGRAM', 'ADS', 'OTHER']),
    contacts: countSchema,
    attributedContacts: countSchema,
    scheduled: countSchema,
    attended: countSchema,
    closed: countSchema,
  })
  .refine(
    (v) =>
      [v.contacts, v.attributedContacts, v.scheduled, v.attended, v.closed].some((n) => n !== null),
    'Informe pelo menos um total conhecido.',
  )
  .refine(
    (v) =>
      v.attributedContacts === null || v.contacts === null || v.attributedContacts <= v.contacts,
    'Contatos atribuídos não podem superar o total recebido.',
  );
export async function POST(request: Request) {
  try {
    const { mode, ...input } = schema.parse(await readLocalJson(request));
    const row = await db.leadSummary.upsert({
      where: {
        workspaceId_date_channel: { workspaceId: mode, date: input.date, channel: input.channel },
      },
      create: { workspaceId: mode, source: mode === 'demo' ? 'DEMO' : 'MANUAL', ...input },
      update: { ...input, collectedAt: new Date() },
    });
    return Response.json({ id: row.id });
  } catch (error) {
    return apiError(error);
  }
}
