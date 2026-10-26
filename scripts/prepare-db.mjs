import fs from 'node:fs';
import path from 'node:path';

if (fs.existsSync('.env')) process.loadEnvFile('.env');
const url = process.env.DATABASE_URL ?? 'file:./wiener.db';
if (!url.startsWith('file:') || url.includes('?'))
  throw new Error('Este setup suporta DATABASE_URL SQLite file: sem query string.');
const target = path.resolve('prisma', url.slice(5));
fs.mkdirSync(path.dirname(target), { recursive: true });
// O engine Prisma 6/Windows falhou na abertura inicial de arquivo inexistente.
// Abrir com append cria apenas se ausente e preserva todos os bytes existentes.
fs.closeSync(fs.openSync(target, 'a'));
console.log('Arquivo SQLite preparado; dados existentes preservados.');
