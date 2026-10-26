# Wiener Analytics — plano de implementação

> Execução inline com superpowers:executing-plans; nenhuma publicação, commit ou push autorizados.

**Goal:** entregar um MVP local executável para acompanhar marketing da Odonto Wiener com dados auditáveis.

**Architecture:** Next.js App Router e TypeScript strict. Prisma/SQLite, serviços de domínio independentes da UI, rotas validadas com Zod. Dados demo em workspace separado, selecionado explicitamente; origem e período em todos os snapshots.

**Tech Stack:** Next.js, React, Tailwind, Lucide, Recharts, Prisma, SQLite, Zod, Vitest.

**Spec:** briefing fornecido no anexo Pasted text.txt. Usuário autoriza escolhas pequenas e execução imediata sem pausa em planejamento.

## Restrições

- Local, Windows, pt-BR, America/Sao_Paulo. Nenhum dado de paciente.
- Ausente é null; período desconhecido não participa de agregados.
- Alcance e contas únicas não são somados entre dias.
- OAuth nunca aparece conectado sem uma consulta oficial bem-sucedida.
- Fase 1 deve passar testes e build antes das integrações.

## Review Focus

- Dados demo nunca entram no workspace real, inclusive em exportações.
- Períodos sobrepostos e snapshots repetidos não são somados.
- Limites de datas incluem os dias locais e comparação usa duração equivalente.
- CSV com fórmulas, campos vazios, colunas inválidas ou repetidas não corrompe o banco.
- Operações de escrita verificam origem local e a aplicação recusa exposição em produção sem acesso configurado.

## Tarefas

- [x] 1. Ambiente, modelo, migração e seed idempotente; testes de regras de métricas/datas.
      Arquivos: package.json, prisma/schema.prisma, prisma/seed.ts, src/features/analytics/*, tests/analytics.test.ts.
      Verificar falha dos testes antes da implementação e sucesso após; gerar/aplicar migração e executar seed duas vezes.
- [x] 2. UI funcional: sidebar, dashboard, filtros, gráficos, ranking, detalhes e histórico.
      Arquivos: src/app/_, src/components/_, src/server/repositories/*.
      Verificar typecheck, lint, testes, build e respostas HTTP reais. Não avançar com build quebrado.
- [x] 3. Dados reais sem API: entrada manual, edição, CSV com mapeamento/prévia/confirmação e exportação; conversões agregadas.
      Arquivos: src/features/imports/_, src/app/api/_, tests/imports.test.ts, tests/persistence.test.ts.
      Verificar validação, deduplicação, transações, isolamento e roundtrip em SQLite temporário.
- [x] 4. Documentação, limites e preparação Meta sem conexão simulada.
      Arquivos: README.md, docs/{architecture,data-model,meta-integration,roadmap}.md, docs/decisions/*.
      Consultar documentação oficial antes de implementar integração; se não verificável, manter explicitamente planejada.

## Registro de execução

- Inspeção: workspace vazio, sem Git, Node/npm ausentes no PATH.
- Decisão: usar workspace solicitado, sem criar repositório/worktree; proibição de commit/push preservada.
- Decisão: seguir stack e design do briefing sem nova aprovação, conforme autorização explícita de escolhas pequenas e execução imediata.
- Ambiente: download de Node.js 22 LTS portátil, validado por SHA-256 oficial, em .tools ignorado; nenhum instalador de sistema.
- Tarefa 1: completa. Migração real SQLite aplicada, seed repetido e preservação de edições exercitada em banco temporário. Criação prévia não destrutiva do arquivo corrige falha inicial do engine no Windows.
- Tarefa 2: completa. Dev iniciado, gráfico desenhado e layout desktop/mobile verificados em Chrome headless. Build final com exit 0.
- Tarefa 3: completa no escopo descrito. 26 testes, incluindo SQLite real e handlers HTTP, passaram; todas as páginas/ambientes foram verificadas contra o build de produção.
- Tarefa 4: completa como documentação/preparação de próxima fase. Meta permanece não implementada; fontes oficiais retornaram HTTP 429. Nenhuma conexão ou credencial simulada.
- Revisão final independente: agente review_mvp, somente leitura. Corrigidos validação de métricas exclusivas de mídia, Host/Origin com URL interna do Next, identidade estável do seed após edição, estado de formulário entre ambientes e mapeamento durante prévia CSV. Casos de serviço reproduzidos em RED e depois GREEN; casos de interface verificados em navegador real.
- Verificação final: typecheck e lint exit 0; Vitest 26/26; build exit 0; navegador exit 0; smoke HTTP de produção exit 0. Evidências e limites em docs/verification.md.
- Decisão final: manter arquivos no workspace solicitado. Não há repositório/branch a integrar, nem autorização para commit, push ou deploy. Servidores de verificação encerrados após os testes.
