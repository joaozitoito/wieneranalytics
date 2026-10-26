import { createHash } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { readLocalJson, apiError } from '@/lib/security/http';
import { inspectCsv, previewCsv } from '@/features/imports/csv';
import { SnapshotService } from '@/server/services/snapshots';
const schema = z.object({
  action: z.enum(['inspect', 'preview', 'commit']),
  mode: z.enum(['real', 'demo']),
  csv: z.string().max(1_000_000),
  mapping: z.record(z.string(), z.string()).default({}),
  filename: z.string().max(200).default('importacao.csv'),
});
export async function POST(request: Request) {
  try {
    const body = schema.parse(await readLocalJson(request));
    if (body.action === 'inspect') return Response.json(inspectCsv(body.csv));
    const preview = previewCsv(body.csv, body.mapping);
    if (body.action === 'preview') return Response.json(preview);
    if (preview.errors.length || preview.rows.length === 0)
      throw new Error('Corrija todas as linhas inválidas antes de confirmar a importação.');
    const hash = createHash('sha256').update(body.csv).digest('hex');
    return Response.json(
      await new SnapshotService(db).importAccounts(
        body.mode,
        preview.rows,
        body.filename.replace(/[\\/]/g, '_'),
        hash,
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}
