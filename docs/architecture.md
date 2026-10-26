# Arquitetura

Aplicação local Next.js com páginas de servidor para leitura, componentes React para filtros, formulários e gráficos e rotas HTTP para escrita. Serviços de domínio validam dados antes de persistir no Prisma/SQLite. O navegador não recebe credenciais.

Decisão do implementador: um monólito local é suficiente para o MVP. Um serviço externo adicionaria implantação e autenticação antes de validar a rotina manual. SQLite permite começar sem infraestrutura; PostgreSQL requer trocar provider, criar novas migrações e validar concorrência e backups.

O briefing fornece a direção visual e técnica e solicita implementação imediata. Fase 1 entrega leitura, filtros, dados separados e histórico; fase 2 acrescenta escrita e importação. Meta/Ads são fases independentes e não bloqueiam o uso local.
