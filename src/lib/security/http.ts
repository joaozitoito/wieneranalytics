import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { assertLocalMutation } from './local';
export async function readLocalJson(request: Request): Promise<unknown> {
  assertLocalMutation(request);
  if (Number(request.headers.get('content-length') ?? 0) > 1_100_000)
    throw new Error('Requisição excede o limite de 1 MB.');
  const text = await request.text();
  if (Buffer.byteLength(text, 'utf8') > 1_100_000)
    throw new Error('Requisição excede o limite de 1 MB.');
  return JSON.parse(text);
}
export function apiError(error: unknown) {
  if (error instanceof ZodError)
    return Response.json(
      { error: error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') },
      { status: 400 },
    );
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
    return Response.json(
      { error: 'Já existe um registro idêntico. Revise o histórico.' },
      { status: 409 },
    );
  if (error instanceof Error && error.message.startsWith('Acesso local'))
    return Response.json({ error: error.message }, { status: 403 });
  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientInitializationError
  )
    return Response.json(
      { error: 'Não foi possível acessar o banco. Verifique o setup local.' },
      { status: 500 },
    );
  if (error instanceof SyntaxError)
    return Response.json({ error: 'JSON inválido.' }, { status: 400 });
  return Response.json(
    { error: error instanceof Error ? error.message : 'Não foi possível processar a solicitação.' },
    { status: 400 },
  );
}
