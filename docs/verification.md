# Verificação da entrega — 26/10/2026

## Resultado

MVP local executável, com fases 0–2 e exportação/relatórios CSV. Integrações Meta, automação e Ads permanecem pendentes. Nenhuma publicação, commit ou push realizados.

| Comando / verificação | Resultado observado |
| --- | --- |
| Node portátil oficial | v22.23.4, SHA-256 conferido com SHASUMS256 oficial |
| npm install | Exit 0, lockfile gerado, Prisma Client 6.19.0 gerado |
| npm run db:setup | Exit 0, migração SQLite aplicada e seed concluído |
| npm run db:seed repetido | Exit 0, sem duplicação; teste adicional preserva correções de dados seed |
| npm run dev | Next 16.4.3 iniciou em 127.0.0.1:3000, páginas e APIs responderam |
| npm run typecheck | Exit 0 |
| npm run lint | Exit 0, sem erros ou avisos na execução final |
| npm test | 6 arquivos, 27 testes aprovados após a separação do seed privado, exit 0 |
| npm run build | Exit 0, compilação, TypeScript e geração das rotas concluídos |
| npm start | Build de produção iniciou em 127.0.0.1:3000 |
| node scripts/http-smoke.mjs | Exit 0: oito páginas × dois ambientes, conteúdo, isolamento, CSV e proteção de escrita |
| npm run test:browser | Exit 0: Chrome headless real, gráfico desenhado, desktop/mobile, CSV, troca de ambiente e escrita demo |

## Escopo dos testes

- Analytics: divisão por zero/ausência, comparações com base zero, exclusão de período desconhecido, última captura exata, dias completos sem sobreposição, contagens únicas não aditivas, null preservado, dia local e intervalo anterior inclusivo.
- Importação: datas impossíveis, campos opcionais versus zero, negativos, aspas/separadores, mapeamento explícito, erros por linha, cabeçalhos/colunas inválidos e neutralização de fórmulas no CSV.
- Persistência: SQLite temporário com migrações reais, deduplicação, isolamento, revisão de edição, restrição de ambiente e reimportação idempotente.
- Handlers: conteúdo com métrica exclusiva de mídia, preview sem gravação, importação inválida sem gravação parcial, exportação isolada, histórico sem período excluído do relatório e conversões agregadas corrigidas sem duplicação.
- Segurança: loopback, hosts externos, origem ausente/externa e diferença entre Host localhost e URL interna 127.0.0.1 do Next.
- Seed: duas execuções após editar captura histórica e demo preservam os números corrigidos e a quantidade de linhas.
- Navegador: curva Recharts presente; desktop 1440 px e mobile 390 px sem rolagem horizontal da página; rascunho apagado na troca de ambiente; mapeamento bloqueado enquanto a prévia aguarda resposta; POST legítimo em localhost.

Os testes de unidade e persistência usam bancos temporários; o navegador gravou um snapshot exclusivamente demo, removido após a verificação. Capturas locais em `.tools/dashboard-desktop.png` e `.tools/dashboard-mobile.png`. Nenhum dado real foi alterado pelos testes.

## Problemas encontrados e resolvidos

O sandbox bloqueou a leitura de diretórios ancestrais pelo esbuild; os checks foram executados com acesso normal autorizado. O engine SQLite falhou ao abrir arquivo inexistente no primeiro uso; o setup agora cria o arquivo sem truncar dados antes de aplicar migrações. Um fechamento JSX incorreto na sidebar foi detectado pelo build e corrigido.

A revisão independente identificou validação de mídia limitada às métricas da conta, comparação de Origin com URL interna do Next, duplicação do seed após edição, estado de formulário reaproveitado entre ambientes e corrida na alteração de mapeamento durante prévia. Todos foram corrigidos e os cenários relevantes verificados.

A primeira compilação local foi lenta e excedeu o timeout inicial do navegador. A verificação passou com espera adequada e exigência de curva efetivamente desenhada. Next pode retornar HTTP 200 para UI not-found após streaming; o smoke HTTP verifica ausência de métricas de outro workspace e presença da UI de página não encontrada, conforme a documentação distribuída com o framework.

## Limitações

Sem testes de OAuth, renovação, rate limit ou sync, pois esses clientes ainda não foram implementados. As páginas oficiais Meta retornaram HTTP 429 na consulta. Sem testes multiusuário, autenticação de produção, PostgreSQL ou deploy. O navegador foi validado com Chrome instalado, via CDP; não foi instalado Playwright. Acesso público continua bloqueado e depende de autenticação privada antes de implantação.

Próximo passo: retomar a fase 3 após consultar a documentação oficial atual, configurar app Meta e implementar um único fluxo OAuth com transporte testável e métricas verificadas.

## Preparação para repositório público

O usuário autorizou commit e push para `joaozitoito/wieneranalytics`, solicitando excluir informações sensíveis. Os números reais e o planejamento foram extraídos do seed versionado para `data/private-seed.ts`, arquivo local ignorado pelo Git. O banco original foi preservado. O seed público inicializa o ambiente real vazio e inclui somente dados sintéticos no ambiente demo.

Um teste adicional verifica a execução sem qualquer arquivo privado; os testes com snapshots reais usam apenas fixtures sintéticas temporárias. A documentação não contém caminhos pessoais da máquina nem números reais de desempenho. `.env`, banco, seed privado, dependências, capturas e artefatos locais foram excluídos do índice, com auditoria antes do commit. Apenas `.env.example` com placeholders vazios é versionado.
