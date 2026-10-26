import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CircleDot,
  Download,
  Eye,
  Info,
  MessageCircle,
  MousePointer2,
  Plus,
  Radio,
  UsersRound,
} from 'lucide-react';
import { comparison, summarize, type Metric } from '@/features/analytics/metrics';
import { previousPeriod, shiftDay } from '@/features/analytics/dates';
import { dateLabel, number, sourceLabels, timestamp, typeLabels } from '@/lib/format';
import type { parseFilters, WorkspaceData } from '@/server/repositories/workspace';
import { Filters } from './filters';
import { Timeline } from '@/components/charts/timeline';

export const metricLabels: Record<Metric, string> = {
  views: 'Visualizações',
  reach: 'Contas alcançadas',
  viewers: 'Visualizadores',
  interactions: 'Interações',
  engagedAccounts: 'Contas que interagiram',
  followers: 'Seguidores ao final',
  profileVisits: 'Visitas ao perfil',
  linkClicks: 'Toques em links',
};
type FiltersType = ReturnType<typeof parseFilters>;
export function Overview({ data, filters }: { data: WorkspaceData; filters: FiltersType }) {
  const { mode, start, end } = filters;
  const before = previousPeriod(start, end);
  const primary = [
    ['views', Eye],
    ['reach', Radio],
    ['interactions', MessageCircle],
    ['followers', UsersRound],
  ] as const;
  const daily = [];
  for (let day = start; day <= end; day = shiftDay(day, 1))
    daily.push({
      day,
      views: summarize(data.snapshots, 'views', day, day).value,
      interactions: summarize(data.snapshots, 'interactions', day, day).value,
      profileVisits: summarize(data.snapshots, 'profileVisits', day, day).value,
    });
  const content = data.media
    .filter((m) => m.publishedOn && m.publishedOn >= start && m.publishedOn <= end)
    .sort((a, b) => (b.snapshots[0]?.views ?? -1) - (a.snapshots[0]?.views ?? -1));
  const unknown = data.snapshots.filter((s) => !s.periodStart || !s.periodEnd);
  const isConnected =
    data.account?.connection?.status === 'connected' && !!data.account.connection.lastVerifiedAt;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">SEU MARKETING, COM CONTEXTO</div>
          <h1>
            Visão geral<span className="heading-dot">.</span>
          </h1>
          <p>Um olhar claro sobre a presença digital da Odonto Wiener.</p>
        </div>
        <div className="heading-actions">
          <a className="button secondary" href={`/api/export?mode=${mode}`}>
            <Download size={15} />
            Exportar histórico
          </a>
          <Link className="button" href={`/instagram?mode=${mode}#novo`}>
            <Plus size={16} />
            Adicionar medição
          </Link>
        </div>
      </div>
      <div className="account-strip">
        <span className="instagram-icon">◎</span>
        <strong>@odontowiener</strong>
        <span className="pill">Conta profissional</span>
        <span className="connection-status">
          <CircleDot size={12} />
          {isConnected ? 'Conexão verificada' : 'Meta não conectada'}
        </span>
        <Link href={`/integracoes?mode=${mode}`}>
          Ver integração <ArrowUpRight size={13} />
        </Link>
      </div>
      <div className="section-toolbar">
        <div>
          <h2>O desempenho em números</h2>
          <span>
            {dateLabel(start)} — {dateLabel(end)}
          </span>
        </div>
        <Filters filters={filters} />
      </div>
      <div className="kpi-grid">
        {primary.map(([metric, Icon]) => {
          const current = summarize(data.snapshots, metric, start, end),
            prior = summarize(data.snapshots, metric, before.start, before.end),
            delta = comparison(current.value, prior.value);
          return (
            <article className="kpi" key={metric}>
              <div className="kpi-label">
                {metricLabels[metric]}
                <Icon size={17} />
              </div>
              <div className="kpi-number">{number(current.value)}</div>
              <div className="kpi-change">
                {delta !== null ? (
                  <>
                    <span className={delta >= 0 ? 'positive' : 'negative'}>
                      {delta >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{' '}
                      {number(Math.round(Math.abs(delta) * 10) / 10)}%
                    </span>
                    <span>vs. período anterior</span>
                  </>
                ) : (
                  <span>Comparação indisponível</span>
                )}
              </div>
              <div className="kpi-provenance">
                {current.sources.map((s) => sourceLabels[s]).join(' + ') ||
                  'Sem medição compatível'}
                <span title={current.coverage}>
                  {current.value === null
                    ? 'Indisponível neste intervalo'
                    : `Coleta: ${timestamp(current.collectedAt)}`}
                </span>
              </div>
            </article>
          );
        })}
      </div>
      <div className="secondary-metrics">
        {(['profileVisits', 'linkClicks', 'engagedAccounts', 'viewers'] as const).map((metric) => {
          const result = summarize(data.snapshots, metric, start, end);
          return (
            <div
              key={metric}
              title={`${result.coverage} · ${result.sources.map((s) => sourceLabels[s]).join(', ')} · Coleta ${timestamp(result.collectedAt)}`}
            >
              <span>
                {metric === 'linkClicks' ? <MousePointer2 size={15} /> : <CircleDot size={14} />}{' '}
                {metricLabels[metric]}
              </span>
              <strong>{number(result.value)}</strong>
            </div>
          );
        })}
      </div>
      <div className="dashboard-middle">
        <Timeline points={daily} />
        <section className="panel context-panel">
          <span className="eyebrow">QUALIDADE DOS DADOS</span>
          <div className="context-icon">
            <ShieldIcon />
          </div>
          <h2>Clareza antes de conclusões.</h2>
          <p>
            {mode === 'demo'
              ? 'Você está explorando dados sintéticos. Nenhum destes números representa o resultado da clínica.'
              : 'Cada número precisa de origem, período e contexto para orientar uma decisão.'}
          </p>
          <div className="quality-row">
            <span className="status-dot" />
            <span>{data.snapshots.length} snapshots registrados</span>
          </div>
          <div className="quality-row">
            <CalendarClock size={14} />
            <span>{unknown.length} com período não confirmado</span>
          </div>
          <div className="quality-row">
            <CircleDot size={14} />
            <span>{isConnected ? 'Meta verificada' : 'Coleta oficial ainda não conectada'}</span>
          </div>
          <Link href={`/instagram?mode=${mode}`}>
            Conferir histórico <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>
              Conteúdos em destaque <span className="count-badge">{content.length}</span>
            </h2>
            <p>
              Publicados no intervalo selecionado · métricas acumuladas na captura mais recente.
            </p>
          </div>
          <Link className="text-link" href={`/conteudos?mode=${mode}`}>
            Ver conteúdos <ArrowUpRight size={14} />
          </Link>
        </div>
        <ContentTable media={content.slice(0, 5)} mode={mode} />
      </section>
      {unknown.length > 0 && (
        <section className="historical-note">
          <div>
            <Info size={19} />
          </div>
          <div>
            <h3>Uma captura histórica que merece contexto</h3>
            <p>
              Leitura em {dateLabel(unknown[0].measuredOn)}:{' '}
              <strong>{number(unknown[0].views)} visualizações</strong>,{' '}
              {number(unknown[0].viewers)} visualizadores e {number(unknown[0].interactions)}{' '}
              interações. O intervalo original não foi confirmado; esses valores estão preservados
              no histórico e excluídos dos indicadores acima.
            </p>
            <span>
              {sourceLabels[unknown[0].source]} · Inclusão no banco:{' '}
              {timestamp(unknown[0].collectedAt)}
            </span>
          </div>
          <Link href={`/instagram?mode=${mode}`}>
            Revisar <ArrowRight size={14} />
          </Link>
        </section>
      )}
      <div className="footnote">
        <Info size={13} /> Alcance mede contas únicas. Visualizações podem incluir repetições. “—”
        indica dado desconhecido ou sem período compatível.
      </div>
    </>
  );
}
function ShieldIcon() {
  return <UsersRound size={26} />;
}
export function ContentTable({ media, mode }: { media: WorkspaceData['media']; mode: string }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Conteúdo</th>
            <th>Formato</th>
            <th>Publicado em</th>
            <th className="numeric">Visualizações</th>
            <th className="numeric">Alcance</th>
            <th className="numeric">Interações</th>
            <th>Origem</th>
            <th>
              <span className="sr-only">Detalhes</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {media.length === 0 ? (
            <tr>
              <td colSpan={8}>
                <div className="empty-inline">
                  Nenhum conteúdo com data de publicação neste intervalo. Cadastre ou ajuste os
                  filtros.
                </div>
              </td>
            </tr>
          ) : (
            media.map((media, index) => {
              const s = media.snapshots[0];
              return (
                <tr key={media.id}>
                  <td>
                    <Link className="content-name" href={`/conteudos/${media.id}?mode=${mode}`}>
                      <span
                        className={`content-thumb thumb-${index % 3}`}
                        aria-label="Sem miniatura disponível"
                      >
                        {media.type === 'REEL' ? '▶' : media.type === 'STORY' ? '◉' : '▤'}
                      </span>
                      <span>
                        {media.caption}
                        <small>
                          {media.traffic === 'MIXED'
                            ? 'Orgânico + pago, sem separação'
                            : media.traffic === 'ORGANIC'
                              ? 'Orgânico'
                              : media.traffic === 'PAID'
                                ? 'Pago'
                                : 'Distribuição desconhecida'}
                        </small>
                      </span>
                    </Link>
                  </td>
                  <td>
                    <span className="format-badge">{typeLabels[media.type]}</span>
                  </td>
                  <td>{media.publishedOn ? dateLabel(media.publishedOn) : 'Desconhecida'}</td>
                  <td className="numeric strong">{number(s?.views)}</td>
                  <td className="numeric">{number(s?.reach)}</td>
                  <td className="numeric">{number(s?.interactions)}</td>
                  <td>
                    <span className="source-label">{sourceLabels[s?.source] ?? 'Sem captura'}</span>
                  </td>
                  <td>
                    <Link
                      aria-label={`Detalhes: ${media.caption}`}
                      href={`/conteudos/${media.id}?mode=${mode}`}
                    >
                      <ArrowUpRight size={15} />
                    </Link>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
