# ADR 001 — MVP local com banco relacional

Status: adotado para fases 0–2.

Next.js/React/TypeScript seguem a preferência do briefing. Prisma 6.19 mantém o motor SQLite incorporado, evitando compilação nativa adicional no Windows. Node 22 LTS atende os requisitos da stack e foi obtido do distribuidor oficial com verificação SHA-256. Dependências efetivas são travadas no package-lock.json.

Uma API separada e PostgreSQL desde o início exigiriam infraestrutura antes de validar a rotina. O monólito local permite entrada manual e relatórios com menos dependências. A migração a PostgreSQL continua possível com novas migrações e validação.

Componentes acessíveis próprios usam Tailwind/CSS, Lucide e Recharts; não foi instalado o catálogo completo shadcn/ui. Fonte usa fallback local Inter/Geist/Segoe UI para não depender de download durante o build. Formulários simples usam HTML nativo e validação Zod no servidor, sem React Hook Form desnecessário.

A aplicação vincula servidor a 127.0.0.1 e rejeita hosts externos. Esse bloqueio não substitui autenticação para deploy; exposição pública permanece desabilitada até implementar acesso privado e HTTPS.
