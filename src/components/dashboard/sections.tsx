import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  Download,
  Info,
  Instagram,
  Megaphone,
  ShieldCheck,
  Unplug,
} from 'lucide-react';
import { db } from '@/lib/db';
import { dateLabel, money, number, sourceLabels, timestamp, typeLabels } from '@/lib/format';
import { comparison, ratio, summarize } from '@/features/analytics/metrics';
import { previousPeriod, todayLocal } from '@/features/analytics/dates';
import type { parseFilters, Query, WorkspaceData } from '@/server/repositories/workspace';
import { ContentTable, metricLabels } from './overview';
import { SnapshotForm } from './snapshot-form';
import { CsvImport } from './csv-import';
import { ConversionForm } from './conversion-form';
import { Filters } from './filters';
type Props = { data: WorkspaceData; filters: ReturnType<typeof parseFilters>; query: Query };
export function SectionHeading({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <div className="eyebrow">ODONTO WIENER · INTELIGÊNCIA DE MARKETING</div>
        <h1>
          {title}
          <span className="heading-dot">.</span>
        </h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}

export async function InstagramSection({ data, filters, query }: Props) {
  const q = typeof query.q === 'string' ? query.q.toLowerCase() : '';
  const snapshots = data.snapshots.filter((s) =>
    `${s.measuredOn} ${s.notes ?? ''} ${sourceLabels[s.source]}`.toLowerCase().includes(q),
  );
  const initial = data.snapshots.find((s) => s.id === query.edit);
  const auditId = typeof query.audit === 'string' ? query.audit : null;
  const revisions = auditId
    ? await db.snapshotRevision.findMany({
        where: { snapshotId: auditId, snapshot: { accountId: `${filters.mode}-instagram` } },
        orderBy: { changedAt: 'desc' },
      })
    : [];
  return (
    <>
      <SectionHeading
        title="Instagram"
        description="Histórico verificável, entrada manual e importação de snapshots da conta."
      >
        <a className="button secondary" href={`/api/export?mode=${filters.mode}`}>
          <Download size={15} />
          Exportar histórico
        </a>
      </SectionHeading>
      <div className="stack">
        <div className="notice">
          <Info size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          @odontowiener · Meta não conectada. Data da leitura é diferente da inclusão no banco.
          Períodos desconhecidos ficam fora de comparações.
        </div>
        <section className="panel form-panel">
          <h2>
            Histórico de medições <span className="count-badge">{snapshots.length}</span>
          </h2>
          <form className="history-tools" style={{ marginTop: 16 }}>
            <input type="hidden" name="mode" value={filters.mode} />
            <input
              name="q"
              placeholder="Buscar por data, origem ou observação"
              defaultValue={q}
              aria-label="Buscar no histórico"
            />
            <button className="button secondary">Buscar</button>
          </form>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Leitura / período</th>
                  <th>Origem e inclusão</th>
                  <th className="numeric">Views</th>
                  <th className="numeric">Alcance</th>
                  <th className="numeric">Interações</th>
                  <th className="numeric">Seguidores</th>
                  <th>Revisão</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{dateLabel(s.measuredOn)}</strong>
                      <small style={{ display: 'block', fontSize: 9, marginTop: 5 }}>
                        {s.periodStart
                          ? `${dateLabel(s.periodStart)} — ${dateLabel(s.periodEnd)}`
                          : 'Período não confirmado'}
                      </small>
                      <details style={{ marginTop: 6, maxWidth: 350 }}>
                        <summary>Contexto e métricas</summary>
                        <p>{s.notes || 'Sem observações.'}</p>
                        <p>
                          Visualizadores: {number(s.viewers)} · Contas que interagiram:{' '}
                          {number(s.engagedAccounts)} · Visitas ao perfil: {number(s.profileVisits)}{' '}
                          · Links: {number(s.linkClicks)} · Endereço: {number(s.addressClicks)}
                        </p>
                      </details>
                    </td>
                    <td>
                      {sourceLabels[s.source]}
                      <small style={{ display: 'block', fontSize: 9, marginTop: 5 }}>
                        {timestamp(s.collectedAt)}
                      </small>
                    </td>
                    <td className="numeric">{number(s.views)}</td>
                    <td className="numeric">{number(s.reach)}</td>
                    <td className="numeric">{number(s.interactions)}</td>
                    <td className="numeric">{number(s.followers)}</td>
                    <td>
                      <Link
                        className="text-link"
                        href={`/instagram?mode=${filters.mode}&edit=${s.id}#novo`}
                      >
                        Editar
                      </Link>
                      {s._count.revisions > 0 && (
                        <Link
                          className="text-link"
                          href={`/instagram?mode=${filters.mode}&audit=${s.id}#revisoes`}
                        >
                          {s._count.revisions} revisões
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
                {snapshots.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-inline">Nenhuma medição encontrada.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        {auditId && (
          <section className="panel form-panel" id="revisoes">
            <h2>Trilha de alterações</h2>
            <p className="section-intro">
              Versões anteriores preservadas. O registro atual permanece no histórico acima.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Alterado em</th>
                    <th>Origem original</th>
                    <th>Período anterior</th>
                    <th>Views anteriores</th>
                    <th>Alcance anterior</th>
                    <th>Observação anterior</th>
                  </tr>
                </thead>
                <tbody>
                  {revisions.map((revision) => {
                    const old = JSON.parse(revision.previous);
                    return (
                      <tr key={revision.id}>
                        <td>{timestamp(revision.changedAt)}</td>
                        <td>{sourceLabels[old.source]}</td>
                        <td>
                          {old.periodStart
                            ? `${dateLabel(old.periodStart)} — ${dateLabel(old.periodEnd)}`
                            : 'Não confirmado'}
                        </td>
                        <td>{number(old.views)}</td>
                        <td>{number(old.reach)}</td>
                        <td>{old.notes}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
        <SnapshotForm
          key={initial?.id ?? 'new'}
          mode={filters.mode}
          today={todayLocal()}
          initial={initial}
        />
        <CsvImport mode={filters.mode} />
        {data.imports.length > 0 && (
          <section className="panel">
            <div className="panel-header">
              <h2>Importações realizadas</h2>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Arquivo</th>
                    <th>Importado em</th>
                    <th>Inseridos</th>
                    <th>Duplicados ignorados</th>
                  </tr>
                </thead>
                <tbody>
                  {data.imports.map((i) => (
                    <tr key={i.id}>
                      <td>{i.filename}</td>
                      <td>{timestamp(i.createdAt)}</td>
                      <td>{i.inserted}</td>
                      <td>{i.skipped}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
export function ContentSection({ data, filters, query }: Props) {
  const q = String(query.q ?? '').toLowerCase(),
    type = String(query.type ?? ''),
    traffic = String(query.traffic ?? '');
  const selected = data.media.filter(
    (m) =>
      m.caption.toLowerCase().includes(q) &&
      (!type || m.type === type) &&
      (!traffic || m.traffic === traffic) &&
      (m.publishedOn
        ? m.publishedOn >= filters.start && m.publishedOn <= filters.end
        : query.undated === '1'),
  );
  selected.sort((a, b) =>
    query.sort === 'date'
      ? (b.publishedOn ?? '').localeCompare(a.publishedOn ?? '')
      : (b.snapshots[0]?.[query.sort === 'interactions' ? 'interactions' : 'views'] ?? -1) -
        (a.snapshots[0]?.[query.sort === 'interactions' ? 'interactions' : 'views'] ?? -1),
  );
  return (
    <>
      <SectionHeading
        title="Conteúdos"
        description="Compare formatos e resultados sem confundir alcance com visualizações."
      >
        <Link className="button" href={`/instagram?mode=${filters.mode}#novo`}>
          Adicionar conteúdo
        </Link>
      </SectionHeading>
      <div className="stack">
        <div className="panel form-panel">
          <Filters filters={filters} />
          <form className="history-tools" style={{ marginTop: 16, marginBottom: 0 }}>
            <input type="hidden" name="mode" value={filters.mode} />
            <input type="hidden" name="preset" value={filters.preset} />
            <input type="hidden" name="start" value={filters.start} />
            <input type="hidden" name="end" value={filters.end} />
            <input
              name="q"
              placeholder="Buscar legenda"
              aria-label="Buscar conteúdo"
              defaultValue={String(query.q ?? '')}
            />
            <select name="type" aria-label="Formato" defaultValue={type}>
              <option value="">Todos os formatos</option>
              {Object.entries(typeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <select name="traffic" aria-label="Distribuição" defaultValue={traffic}>
              <option value="">Toda distribuição</option>
              <option value="ORGANIC">Orgânico</option>
              <option value="PAID">Pago</option>
              <option value="MIXED">Orgânico + pago</option>
              <option value="UNKNOWN">Desconhecida</option>
            </select>
            <select
              name="sort"
              aria-label="Ordenar por"
              defaultValue={String(query.sort ?? 'views')}
            >
              <option value="views">Mais visualizações</option>
              <option value="interactions">Mais interações</option>
              <option value="date">Mais recentes</option>
            </select>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 10 }}>
              <input
                type="checkbox"
                name="undated"
                value="1"
                defaultChecked={query.undated === '1'}
              />
              Incluir sem data
            </label>
            <button className="button secondary">Filtrar conteúdos</button>
          </form>
        </div>
        <div className="notice">
          O período filtra a data de publicação. Os números são acumulados na captura mais recente,
          sem atribuí-los integralmente ao intervalo escolhido. Conteúdos sem data só aparecem ao
          marcar “Incluir sem data”.
        </div>
        <section className="panel">
          <ContentTable media={selected} mode={filters.mode} />
        </section>
      </div>
    </>
  );
}
export function CampaignSection({ data }: Props) {
  return (
    <>
      <SectionHeading
        title="Campanhas"
        description="Planejamento e investimento real têm lugares distintos."
      />
      <div className="stack">
        {data.campaigns.map((c) => (
          <section className="panel campaign-card" key={c.id}>
            <div className="campaign-top">
              <span className="campaign-icon">
                <Megaphone size={21} />
              </span>
              <div>
                <h2>{c.name}</h2>
                <p>{c.objective}</p>
              </div>
              <span className="pill">
                {c.status === 'PLANNED' ? 'Planejada · não ativa' : c.status}
              </span>
            </div>
            <p>{c.audience}</p>
            <div className="campaign-values">
              <div>
                <span>Orçamento diário planejado</span>
                <strong>{money(c.dailyBudgetCents)}</strong>
              </div>
              <div>
                <span>Orçamento base · {c.plannedDays} dias</span>
                <strong>
                  {money(
                    c.dailyBudgetCents != null && c.plannedDays != null
                      ? c.dailyBudgetCents * c.plannedDays
                      : null,
                  )}
                </strong>
              </div>
              <div>
                <span>Gasto real</span>
                <strong style={{ fontSize: 16 }}>{money(c.spendCents)}</strong>
              </div>
              <div>
                <span>Conversas / custo por conversa</span>
                <strong style={{ fontSize: 16 }}>
                  {number(c.conversations)} /{' '}
                  {money(
                    c.spendCents != null && c.conversations != null && c.conversations > 0
                      ? c.spendCents / c.conversations
                      : null,
                  )}
                </strong>
              </div>
            </div>
            <span className="source-label">
              {sourceLabels[c.source]} · Inclusão: {timestamp(c.collectedAt)}
            </span>
          </section>
        ))}
        {data.campaigns.length === 0 && (
          <div className="panel empty-inline">Nenhuma campanha registrada neste ambiente.</div>
        )}
        <div className="notice">
          Marketing API: fase posterior. Não há consulta de gastos nem alteração de campanhas nesta
          versão. Um orçamento planejado não é gasto realizado; não atribuímos conversas sem
          evidência.
        </div>
      </div>
    </>
  );
}
export function ConversionSection({ data, filters }: Props) {
  const leads = data.leads.filter((l) => l.date >= filters.start && l.date <= filters.end);
  return (
    <>
      <SectionHeading
        title="Conversões"
        description="Resultados comerciais agregados, sem dados individuais de pacientes."
      />
      <div className="stack">
        <section className="panel form-panel">
          <Filters filters={filters} />
          <div className="table-wrap" style={{ marginTop: 20 }}>
            <table>
              <thead>
                <tr>
                  <th>Data / canal</th>
                  <th>Contatos</th>
                  <th>Atribuídos</th>
                  <th>Agendadas</th>
                  <th>Realizadas</th>
                  <th>Fechamentos</th>
                  <th>Origem / inclusão</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td>
                      {dateLabel(l.date)}
                      <small style={{ display: 'block' }}>
                        {l.channel === 'INSTAGRAM'
                          ? 'Instagram'
                          : l.channel === 'ADS'
                            ? 'Anúncios'
                            : 'Outros'}
                      </small>
                    </td>
                    <td>{number(l.contacts)}</td>
                    <td>{number(l.attributedContacts)}</td>
                    <td>{number(l.scheduled)}</td>
                    <td>{number(l.attended)}</td>
                    <td>{number(l.closed)}</td>
                    <td>
                      {sourceLabels[l.source]}
                      <small style={{ display: 'block' }}>{timestamp(l.collectedAt)}</small>
                    </td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-inline">
                        Sem resultados comerciais registrados neste período.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        <ConversionForm mode={filters.mode} today={todayLocal()} />
        <div className="notice">
          Alcance → visitas → cliques → conversas → avaliações → tratamentos é uma sequência
          conceitual. Estas fontes não estabelecem atribuição individual entre etapas. Receita não é
          coletada neste MVP.
        </div>
      </div>
    </>
  );
}
export function ReportSection({ data, filters }: Props) {
  const prior = previousPeriod(filters.start, filters.end);
  return (
    <>
      <SectionHeading
        title="Relatórios"
        description="Uma leitura reproduzível do período, com comparações equivalentes."
      >
        <a
          className="button"
          href={`/api/export?mode=${filters.mode}&format=report&start=${filters.start}&end=${filters.end}`}
        >
          <Download size={15} />
          Exportar relatório CSV
        </a>
      </SectionHeading>
      <div className="stack">
        <section className="panel form-panel">
          <Filters filters={filters} />
          <p className="section-intro">
            Atual: {dateLabel(filters.start)} a {dateLabel(filters.end)} · Anterior:{' '}
            {dateLabel(prior.start)} a {dateLabel(prior.end)}.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Métrica</th>
                  <th>Período atual</th>
                  <th>Período anterior</th>
                  <th>Variação</th>
                  <th>Origem / coleta mais recente</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(metricLabels).map(([metric, label]) => {
                  const key = metric as keyof typeof metricLabels,
                    a = summarize(data.snapshots, key, filters.start, filters.end),
                    b = summarize(data.snapshots, key, prior.start, prior.end),
                    delta = comparison(a.value, b.value);
                  return (
                    <tr key={metric}>
                      <td>{label}</td>
                      <td>{number(a.value)}</td>
                      <td>{number(b.value)}</td>
                      <td>
                        {delta === null
                          ? 'Indisponível'
                          : `${number(Math.round(delta * 10) / 10)}%`}
                      </td>
                      <td>
                        {a.sources.map((s) => sourceLabels[s]).join(' + ') || 'Sem dados'}
                        <small style={{ display: 'block' }}>{timestamp(a.collectedAt)}</small>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel prose">
          <h2>Leitura e próximos passos</h2>
          <p>
            Há {data.snapshots.filter((s) => !s.periodStart).length} capturas com período
            desconhecido neste ambiente. Confirme o intervalo original antes de compará-las.
          </p>
          <p>
            Registre contatos e avaliações por canal e dia para acompanhar o resultado comercial sem
            inferir atribuição. Não há integração oficial ativa nesta versão.
          </p>
          <p>
            Alcance, visualizadores, contas que interagiram e seguidores exigem um snapshot
            específico do intervalo. Métricas aditivas podem usar todos os dias do intervalo, sem
            lacunas; nenhuma medida ausente vira zero.
          </p>
          <h3>Fórmulas</h3>
          <p>
            Taxa de interações por alcance = interações ÷ alcance × 100. Por visualizações =
            interações ÷ visualizações × 100. Denominador zero ou desconhecido torna a taxa
            indisponível. Comparação = (atual − anterior) ÷ anterior × 100; base zero não produz
            percentual.
          </p>
        </section>
      </div>
    </>
  );
}
export function IntegrationSection({ data, filters }: Props) {
  return (
    <>
      <SectionHeading
        title="Integrações"
        description="Conexões oficiais, com autorização explícita e verificação real."
      />
      <div className="stack">
        <div className="integration-grid">
          <section className="panel integration-card">
            <Instagram size={29} />
            <h2>Instagram Insights</h2>
            <span className="pill">Não conectado · planejado</span>
            <p>
              O MVP usa capturas manuais e arquivos CSV. OAuth, descoberta de conta e sincronização
              oficial ainda não estão implementados.
            </p>
            <Link className="button secondary" href={`/instagram?mode=${filters.mode}#importar`}>
              Usar importação CSV <ArrowUpRight size={14} />
            </Link>
          </section>
          <section className="panel integration-card">
            <Megaphone size={29} />
            <h2>Meta Ads</h2>
            <span className="pill">Fase posterior · somente leitura</span>
            <p>
              Marketing API tem permissões e autorização próprias. Nenhuma campanha será criada,
              ativada ou alterada automaticamente.
            </p>
            <Link className="button secondary" href={`/campanhas?mode=${filters.mode}`}>
              Ver planejamento <ArrowUpRight size={14} />
            </Link>
          </section>
        </div>
        <section className="panel prose">
          <h2>O que falta para conectar</h2>
          <p>
            Aplicativo Meta configurado, permissões revisadas, redirect URI e acesso à conta
            profissional. A documentação oficial retornou HTTP 429 nesta sessão; nomes de métricas e
            permissões não foram tratados como verificados.
          </p>
          <p>
            Consulte{' '}
            <a
              className="text-link"
              href="https://developers.facebook.com/docs/instagram-platform/"
              target="_blank"
              rel="noreferrer"
            >
              a documentação oficial da plataforma <ArrowUpRight size={12} />
            </a>{' '}
            e o documento local docs/meta-integration.md. Segredos devem ficar no servidor em
            .env.local.
          </p>
          <p>
            Nenhum token foi solicitado ou persistido. Última sincronização:{' '}
            {timestamp(data.account?.connection?.lastSyncedAt)}.
          </p>
        </section>
        <section className="panel prose">
          <h2>Histórico de sincronizações</h2>
          {data.account?.syncJobs.length ? (
            <p>{data.account.syncJobs.length} execuções registradas.</p>
          ) : (
            <p>
              Nenhuma execução. O agendamento e o botão de sincronização serão disponibilizados
              junto com a integração oficial.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
export function SettingsSection({ filters }: Props) {
  return (
    <>
      <SectionHeading
        title="Configurações"
        description="Um workspace simples, privado e reproduzível."
      />
      <div className="stack">
        <section className="panel prose">
          <h2>
            <ShieldCheck size={17} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Workspace da clínica
          </h2>
          <dl className="data-list">
            <dt>Organização</dt>
            <dd>Odonto Wiener · Pelotas, RS</dd>
            <dt>Conta</dt>
            <dd>@odontowiener</dd>
            <dt>Fuso horário</dt>
            <dd>America/Sao_Paulo</dd>
            <dt>Idioma</dt>
            <dd>Português brasileiro</dd>
            <dt>Ambiente atual</dt>
            <dd>
              {filters.mode === 'demo'
                ? 'Demonstração · dados sintéticos isolados'
                : 'Dados da clínica'}
            </dd>
            <dt>Persistência</dt>
            <dd>SQLite local com Prisma e migração versionada</dd>
            <dt>Acesso</dt>
            <dd>Apenas loopback. Autenticação para publicação é uma etapa pendente.</dd>
          </dl>
        </section>
        <section className="panel prose">
          <h2>Comece por aqui</h2>
          <p>
            1. Em Instagram, adicione uma medição da conta ou de um conteúdo. Informe o intervalo
            apenas quando ele for conhecido.
          </p>
          <p>
            2. Para importar, escolha um CSV, mapeie as colunas, valide a prévia e confirme. O
            arquivo modelo está disponível no formulário.
          </p>
          <p>
            3. Aplique filtros na visão geral e gere o CSV em Relatórios. As capturas sem período
            permanecem no histórico.
          </p>
          <p>
            4. Use a opção Demonstração nos filtros para explorar gráficos sem alterar os registros
            da clínica.
          </p>
          <h3>Operação local</h3>
          <p>
            Iniciar: <code>npm run dev</code>. Preparar o banco: <code>npm run db:setup</code>.
            Verificar: <code>npm run test</code>, <code>npm run typecheck</code>,{' '}
            <code>npm run lint</code> e <code>npm run build</code>.
          </p>
          <p>
            Instruções completas de Windows, backup, limitações e próximos passos estão no README.md
            do projeto.
          </p>
        </section>
        <section className="panel prose">
          <h2>
            <Unplug size={17} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Dados minimizados
          </h2>
          <p>
            Registre apenas métricas de marketing e totais agregados. Não inclua dados pessoais ou
            informações clínicas nas legendas, observações ou arquivos importados. O banco local e
            suas exportações são privados.
          </p>
        </section>
      </div>
    </>
  );
}

export function ContentDetail({
  media,
  mode,
}: {
  media: WorkspaceData['media'][number];
  mode: string;
}) {
  const s = media.snapshots[0];
  const metrics = [
    ['views', 'Visualizações'],
    ['reach', 'Contas alcançadas'],
    ['viewers', 'Visualizadores'],
    ['interactions', 'Interações'],
    ['engagedAccounts', 'Contas que interagiram'],
    ['likes', 'Curtidas'],
    ['comments', 'Comentários'],
    ['shares', 'Compartilhamentos'],
    ['saves', 'Salvamentos'],
    ['replies', 'Respostas'],
    ['followersGained', 'Seguidores obtidos'],
    ['profileVisits', 'Visitas ao perfil'],
    ['linkClicks', 'Toques externos pelo perfil'],
    ['stickerClicks', 'Toques no adesivo'],
    ['forward', 'Avanços'],
    ['nextStory', 'Próximo Story'],
    ['exits', 'Saídas'],
  ] as const;
  return (
    <>
      <Link
        className="text-link"
        href={`/conteudos?mode=${mode}&undated=1`}
        style={{ marginBottom: 20 }}
      >
        <ArrowLeft size={14} />
        Voltar aos conteúdos
      </Link>
      <SectionHeading title={typeLabels[media.type]} description={media.caption} />
      <div className="stack">
        <div className="notice">
          Publicado em: {media.publishedOn ? dateLabel(media.publishedOn) : 'desconhecido'} ·{' '}
          {media.traffic === 'MIXED'
            ? 'Orgânico e pago sem separação'
            : media.traffic === 'ORGANIC'
              ? 'Orgânico'
              : 'Distribuição não confirmada'}{' '}
          · {sourceLabels[s?.source] ?? 'Sem captura'} · Leitura: {dateLabel(s?.measuredOn)} ·
          Inclusão: {timestamp(s?.collectedAt)}
        </div>
        <div className="details-grid">
          {metrics.map(([key, label]) => (
            <div className="detail-metric" key={key}>
              <span>{label}</span>
              <strong>{number(s?.[key])}</strong>
            </div>
          ))}
        </div>
        <section className="panel prose">
          <h2>Indicadores derivados</h2>
          <p>
            Interações / alcance: {number(ratio(s?.interactions ?? null, s?.reach ?? null))}
            {ratio(s?.interactions ?? null, s?.reach ?? null) !== null ? '%' : ''} · Interações /
            visualizações: {number(ratio(s?.interactions ?? null, s?.views ?? null))}
            {ratio(s?.interactions ?? null, s?.views ?? null) !== null ? '%' : ''}
          </p>
          <p>{s?.notes || 'Nenhuma observação registrada.'}</p>
          <p>
            Período coberto:{' '}
            {s?.periodStart
              ? `${dateLabel(s.periodStart)} — ${dateLabel(s.periodEnd)}`
              : 'não confirmado'}
            . Métricas de navegação, toques externos pelo perfil e toques no adesivo têm definições
            distintas.
          </p>
        </section>
        <section className="panel">
          <div className="panel-header">
            <h2>Histórico de snapshots</h2>
            <Link className="text-link" href={`/instagram?mode=${mode}#novo`}>
              Registrar nova captura
            </Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Leitura</th>
                  <th>Período</th>
                  <th>Coleta / inclusão</th>
                  <th>Origem</th>
                  <th>Views</th>
                  <th>Alcance</th>
                  <th>Interações</th>
                </tr>
              </thead>
              <tbody>
                {media.snapshots.map((s) => (
                  <tr key={s.id}>
                    <td>{dateLabel(s.measuredOn)}</td>
                    <td>
                      {s.periodStart
                        ? `${dateLabel(s.periodStart)} — ${dateLabel(s.periodEnd)}`
                        : 'Não confirmado'}
                    </td>
                    <td>{timestamp(s.collectedAt)}</td>
                    <td>{sourceLabels[s.source]}</td>
                    <td>{number(s.views)}</td>
                    <td>{number(s.reach)}</td>
                    <td>{number(s.interactions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
