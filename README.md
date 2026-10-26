# Wiener Analytics

MVP local de inteligência de marketing da Odonto Wiener, em pt-BR. Next.js App Router, React, TypeScript strict, Tailwind, Lucide, Recharts, Prisma/SQLite e Zod. Sem serviços externos obrigatórios.

## Iniciar no Windows

Use Node.js **22 LTS** e npm. Se não houver Node instalado, o runtime portátil desta sessão fica em `.tools`, ignorado pelo Git. Ative-o somente no terminal atual:

```powershell
cd "C:\projetos\wieneranalytics"
. .\scripts\activate-node.ps1
```

Para reproduzir em outra máquina sem Node, execute `scripts/bootstrap-node.ps1` antes da ativação; ele baixa o ZIP oficial Windows x64, valida SHA-256 e extrai apenas em `.tools`. Também é possível instalar Node LTS diretamente pelo distribuidor oficial. A aplicação não altera o PATH do sistema.

```powershell
Copy-Item .env.example .env
npm.cmd install
npm.cmd run db:setup
npm.cmd run dev
```

Abra **http://localhost:3000**. Se já existir `.env`, preserve-o em vez de sobrescrever. `npm` e `npm.cmd` executam o mesmo npm; o sufixo evita conflito com políticas de execução de scripts do PowerShell.

O servidor é vinculado a `127.0.0.1`. A aplicação rejeita hosts externos e escrita sem Origin local correspondente. Este MVP não é publicável com segurança sem acrescentar autenticação privada. Não há cadastro público.

## Banco e migrações

`npm run db:setup` gera o Prisma Client, aplica migrações versionadas e executa seed idempotente. O banco padrão é `prisma/wiener.db`. `DATABASE_URL="file:./wiener.db"` resolve relativo ao schema Prisma. Comandos separados:

```powershell
npm.cmd run db:generate
npm.cmd run db:migrate
npm.cmd run db:seed
```

O seed não sobrescreve suas alterações e pode ser executado novamente. Não use `prisma migrate reset` em um banco com dados importantes. Faça backup do arquivo SQLite com a aplicação parada. Não versione banco, CSVs privados, backups ou arquivos `.env`. Em OneDrive, evite abrir o mesmo SQLite simultaneamente em dois computadores; em uso contínuo, prefira mover o banco para uma pasta local fora de sincronização e ajustar DATABASE_URL com caminho absoluto.

## Dados reais e demonstração

O repositório público contém apenas dados demonstrativos. Sem um arquivo privado local, o ambiente real começa vazio e pode ser preenchido pelos formulários e CSV. Desconhecido é `null`; visualizadores não se tornam alcance e um orçamento planejado não se torna gasto realizado.

As capturas e o planejamento reais da instalação original permanecem exclusivamente no banco local e em `data/private-seed.ts`, ignorados pelo Git. O seed carrega esse arquivo opcional quando presente; `PRIVATE_SEED_PATH` permite escolher outro arquivo local que exporte `seedPrivate(db)`. Não envie esse arquivo, banco, capturas de tela ou exports privados para o repositório. O arquivo privado é código local confiável, executado apenas pelo comando de seed, e não deve vir de uploads ou fontes desconhecidas.

A captura histórica da conta não aparece em KPIs de um intervalo arbitrário. Ela aparece no histórico e num aviso da visão geral. `measuredOn` registra a data declarada da leitura; `collectedAt` é o instante de inclusão no banco, já que a hora original não foi fornecida.

Selecione **Demonstração** no filtro e aplique, ou visite `http://localhost:3000/?mode=demo`. Há um banner permanente e dados sintéticos em workspace separado. Escrita, consulta e exportação usam o workspace selecionado. O seed demo cobre 60 dias até a data local de sua primeira execução; executar seed novamente adiciona novos dias sem sobrescrever os anteriores.

## Entrada manual e histórico

Em **Instagram**, adicione snapshots da conta ou de conteúdos. Informe o identificador local de um conteúdo para acumular novas capturas na mesma publicação. Período pode ficar desconhecido, mas ambas as datas devem ser preenchidas quando conhecido. Campos vazios permanecem desconhecidos; digite zero quando houver medição zero.

Histórico de conta permite busca, edição e consulta das versões anteriores. Origem e inclusão originais são preservadas na edição. Conteúdos permitem detalhes, snapshots, formatos, distribuição, busca e ordenação. O filtro de período nessa tabela usa a data de publicação, enquanto os números são acumulados na captura mais recente. Marque “Incluir sem data” para o Reel histórico sem data de publicação confirmada. Miniaturas indisponíveis têm ícone neutro.

Conversões registra totais por dia e canal. Salvar a mesma combinação substitui seus totais; não há atribuição automática entre Instagram e pacientes. Receita e dados individuais não são coletados.

## CSV

1. Em Instagram, baixe o modelo e escolha seu arquivo (até 1 MB e 1.000 linhas).
2. Mapeie as colunas efetivamente presentes. `measuredOn` (data da leitura) e pelo menos uma métrica são necessários.
3. Clique em validar, confira a prévia e corrija todos os erros.
4. Confirme para gravar numa transação. Registros idênticos são ignorados e o relatório informa inseridos/duplicados.

Campos aceitos: `measuredOn`, `periodStart`, `periodEnd`, `views`, `reach`, `viewers`, `interactions`, `engagedAccounts`, `followers`, `profileVisits`, `linkClicks`, `addressClicks`, `notes`. Datas AAAA-MM-DD, contagens inteiras não negativas sem ponto de milhar. Vírgula, ponto e vírgula e campos entre aspas são reconhecidos. Colunas desconhecidas podem ser ignoradas no mapeamento; o sistema não presume o formato de exportações da Meta Business Suite.

Exportar histórico produz todas as capturas da conta no ambiente escolhido, incluindo períodos desconhecidos. Relatórios exporta os indicadores do intervalo selecionado e a comparação anterior equivalente, com origem, atualização e disponibilidade. Campos textuais que poderiam executar fórmulas em planilha são neutralizados. Importação de CSV de conteúdos/campanhas e PDF estão no roadmap.

## Regras analíticas

- Prefere a última captura do intervalo exato.
- Na ausência dela, métricas aditivas só são somadas com medições diárias completas de todos os dias.
- Alcance, visualizadores, contas que interagiram e seguidores não são somados entre dias.
- Capturas de 7/30/90 dias não são misturadas; revisões não são somadas.
- Gráfico usa medições diárias existentes e mantém lacunas; não interpola.
- Intervalos e comparações usam dias inclusivos de America/Sao_Paulo, até 90 dias nos filtros.
- Percentuais com denominador zero/ausente ficam indisponíveis. Taxas não representam pessoas únicas.

## Meta, OAuth e automação

**Ainda não implementados.** Nenhuma conexão aparece ativa, nenhuma senha é solicitada e nenhum resultado é atribuído à API. A tentativa de consulta da documentação oficial retornou HTTP 429. Veja [docs/meta-integration.md](docs/meta-integration.md) e o [ADR provisório de login](docs/decisions/002-meta-login.md) para a sequência de implementação e revisão necessária.

`.env.example` reserva `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`, `TOKEN_ENCRYPTION_KEY` e `CRON_SECRET`. Esses campos não ativam uma integração. Quando implementada, mantenha segredos reais em `.env.local`, apenas no servidor. Prisma CLI usa DATABASE_URL de `.env` ou do ambiente. Não coloque credenciais em NEXT_PUBLIC_*, URLs, localStorage, commits ou chat.

Sincronização incremental, renovação, locks, retries e cron protegido pertencem à fase 4; não há endpoint cron disponível nesta entrega. A frequência e as limitações históricas de Stories devem ser confirmadas na documentação vigente antes de implementar. Marketing API pertence à fase 5 e deve ser somente leitura.

## Verificações

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run build
npm.cmd start
```

Vitest exercita fórmulas, datas/fuso, ausência de métricas, intervalos, CSV, validação, deduplicação, edição com revisão, isolamento real/demo e proteção de escrita local. Persistência usa banco SQLite temporário e aplica as migrações reais; não altera o banco da clínica. Testes de OAuth/API não se aplicam a um cliente ainda não implementado.

Com a aplicação iniciada, também é possível executar `node scripts/http-smoke.mjs` para verificar todas as páginas e proteções HTTP. `npm run test:browser` usa Chrome ou Edge já instalado, em modo headless com perfil separado em `.tools`, e verifica gráfico desenhado, desktop/mobile, prévia CSV, troca de ambiente e escrita somente em demonstração. Não instala navegador. Defina `QA_BROWSER_PATH` se o executável não estiver no caminho padrão; `QA_BASE_URL` pode selecionar outra porta local. Capturas ficam em `.tools/dashboard-desktop.png` e `.tools/dashboard-mobile.png`.

`npm run build` não faz seed nem remove dados. Execute db:setup antes do primeiro uso. `.next`, `.tools`, banco e dependências são ignorados. A documentação em `docs/verification.md` registra os comandos efetivamente executados nesta entrega e suas limitações.

## Estrutura e continuidade

- `src/app`: páginas e rotas HTTP.
- `src/components`: layout, gráfico, dashboard e formulários.
- `src/features`: regras analíticas e validação/importação.
- `src/server`: leitura com escopo e serviços de persistência.
- `src/lib`: banco, formatação e proteção local.
- `prisma`: modelo, migração e seed.
- `tests`: regras e integração SQLite.
- [Arquitetura](docs/architecture.md), [modelo de dados](docs/data-model.md), [roadmap](docs/roadmap.md).

Antes de publicar a aplicação, implementar acesso privado, HTTPS, limites de consulta, proteção de segredos, backup e a política de acesso adequada à clínica. Para PostgreSQL, criar novas migrações e revalidar persistência; não reutilizar SQL SQLite.
