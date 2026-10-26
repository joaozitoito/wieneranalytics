# Modelo e semântica dos dados

Workspace separa fisicamente por chaves relacionais os ambientes `real` e `demo`. Todas as consultas e serviços restringem a conta `${mode}-instagram` ou workspace. Dados demonstrativos têm source DEMO, mesmo quando inseridos pelo formulário ou CSV nesse ambiente.

SocialAccount identifica @odontowiener dentro de cada workspace. AccountInsightSnapshot contém contagens opcionais tipadas, origem, data da leitura (`measuredOn`), inclusão no banco (`collectedAt`) e período coberto (`periodStart`, `periodEnd`). Datas de calendário são strings ISO AAAA-MM-DD em America/Sao_Paulo; instantes técnicos são DateTime UTC. A captura histórica tem hora original desconhecida; collectedAt é a inclusão neste banco, nunca um horário histórico inventado.

Media armazena tipo, legenda, distribuição, identificador local, ID externo opcional e dia de publicação opcional. `publishedOn` não inventa hora exata. MediaInsightSnapshot preserva métricas acumuladas, navegação de Stories, cliques de perfil e adesivo distintos, período e origem. A tabela de conteúdos filtra publicação, e não finge medir desempenho apenas no intervalo selecionado.

SnapshotRevision guarda a versão anterior à edição da conta, com instante da alteração. A origem e collectedAt originais são preservados. ImportedDataset guarda nome de arquivo, hash SHA-256, instante de importação e contagem de inseridos/duplicados. O CSV bruto não é persistido.

Campaign distingue orçamento em centavos, planejamento e gasto observado opcional. A campanha do briefing é PLANNED. Nenhum orçamento se transforma automaticamente em gasto. LeadSummary armazena apenas totais por dia/canal, sem dados de pacientes nem receita. A chave workspace/data/canal permite correção por substituição; a UI explica esse comportamento.

IntegrationConnection e SyncJob reservam estado para a próxima fase. O seed não cria conexão nem execuções simuladas. AdAccount e AdInsightSnapshot serão adicionados junto à integração de anúncios para evitar tabelas sem uso.

## Agregação

Para cada indicador, o serviço usa a última captura do intervalo EXATO. Sem essa captura, views, interações, visitas e cliques só podem ser somados quando existe medição diária de TODOS os dias e a métrica é conhecida em cada um. Nunca soma snapshots semanais sobrepostos, nunca mistura 7/30/90 dias e nunca preenche lacunas com zero.

Alcance, visualizadores, contas que interagiram e seguidores exigem snapshot exato. Não se somam usuários únicos. Seguidores é posição ao fim do período, não fluxo. Variação de seguidores compara posições de dois intervalos equivalentes. Dados sem período continuam auditáveis no histórico e não entram no dashboard.

Medições diferentes para o mesmo período são versões observadas: a mais recente por collectedAt é escolhida. O hash de deduplicação considera conta, dados tipados e contexto; origem manual/CSV não cria duplicatas numéricas idênticas. Notas diferentes podem formar registros distintos para preservar contexto. Nenhum registro demo participa de consulta real.

Snapshots semeados da conta usam IDs estáveis independentes do hash mutável. Corrigir um snapshot e executar o seed novamente não recria os números originais nem sobrescreve a edição. O seed também reconhece os IDs gerados na primeira execução desta sessão e os converte para a identidade estável sem descartar dados ou revisões.

## Migração para PostgreSQL

Alterar provider e DATABASE_URL, criar migrações específicas PostgreSQL (SQL SQLite não é portável), reexecutar testes de persistência, definir backup, autenticação privada, limites de consulta e bloqueio concorrente de sincronização antes de publicar.
