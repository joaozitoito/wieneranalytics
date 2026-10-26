import assert from 'node:assert/strict';

const base = process.env.QA_BASE_URL ?? 'http://localhost:3000';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname))
  throw new Error('Verificação aceita apenas servidor local.');
for (const mode of ['real', 'demo']) {
  for (const section of [
    '',
    'instagram',
    'conteudos',
    'campanhas',
    'conversoes',
    'relatorios',
    'integracoes',
    'configuracoes',
  ]) {
    const response = await fetch(`${base}/${section}?mode=${mode}`, {
      signal: AbortSignal.timeout(60000),
    });
    const html = await response.text();
    assert.equal(response.status, 200, `${mode}/${section}`);
    assert.ok(!html.includes('Não foi possível carregar os dados'), `erro renderizado: ${section}`);
    if (mode === 'demo') assert.ok(html.includes('Ambiente de demonstração'));
    console.log(`PASS: GET /${section}?mode=${mode}`);
  }
}
const contents = await (await fetch(`${base}/conteudos?mode=demo&undated=1`)).text();
const id = contents.match(/href="\/conteudos\/([^?"/]+)\?mode=demo/)[1];
assert.equal((await fetch(`${base}/conteudos/${id}?mode=demo`)).status, 200);
// Next mantém HTTP 200 quando notFound ocorre após iniciar streaming.
// O contrato relevante é a UI de ausência, sem métricas do outro workspace.
const foreign = await (await fetch(`${base}/conteudos/${id}?mode=real`)).text();
assert.ok(foreign.includes('Página não encontrada'));
assert.ok(!foreign.includes('Indicadores derivados'));
assert.equal((await fetch(`${base}/api/export?mode=real`)).status, 200);
assert.equal((await fetch(`${base}/api/export?mode=invalido`)).status, 400);
assert.equal(
  (
    await fetch(`${base}/api/snapshots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'demo', measuredOn: '2026-10-26', views: 99 }),
    })
  ).status,
  403,
);
console.log('PASS: detalhes, isolamento de conteúdo, CSV e rejeição de escrita sem Origin.');
