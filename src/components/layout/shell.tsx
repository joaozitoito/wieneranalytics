import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CircleHelp,
  FileBarChart2,
  Instagram,
  LayoutDashboard,
  Megaphone,
  PanelTop,
  Settings2,
  ShieldCheck,
  Unplug,
  UsersRound,
} from 'lucide-react';
import type { Mode } from '@/server/repositories/workspace';

const links = [
  ['', 'Visão geral', LayoutDashboard],
  ['instagram', 'Instagram', Instagram],
  ['conteudos', 'Conteúdos', PanelTop],
  ['campanhas', 'Campanhas', Megaphone],
  ['conversoes', 'Conversões', UsersRound],
  ['relatorios', 'Relatórios', FileBarChart2],
  ['integracoes', 'Integrações', Unplug],
  ['configuracoes', 'Configurações', Settings2],
] as const;
export function Shell({
  mode,
  section,
  children,
}: {
  mode: Mode;
  section: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href={`/?mode=${mode}`} aria-label="Wiener Analytics, visão geral">
          <span className="brand-mark">
            <Activity size={24} />
          </span>
          <span>
            Wiener<span className="brand-sub">ANALYTICS</span>
          </span>
        </Link>
        <div className="workspace-card">
          <div className="clinic-avatar">
            ow<span>+</span>
          </div>
          <div>
            <strong>Odonto Wiener</strong>
            <small>Pelotas, RS</small>
          </div>
          <ShieldCheck size={16} />
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav aria-label="Navegação principal">
          {links.map(([path, label, Icon]) => (
            <Link
              className={`nav-link ${section === path ? 'active' : ''}`}
              href={`/${path}?mode=${mode}`}
              key={path}
            >
              <Icon size={18} />
              {label}
              {section === path && <span className="active-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-note">
            <ShieldCheck size={17} />
            <span>
              Seus dados, sob seu controle.<small>Ambiente local e privado</small>
            </span>
          </div>
          <Link className="help-link" href={`/configuracoes?mode=${mode}`}>
            <CircleHelp size={17} /> Como usar o Wiener <ArrowUpRight size={14} />
          </Link>
          <div className="user">
            <span className="user-avatar">M</span>
            <div>
              <strong>Responsável</strong>
              <small>Odonto Wiener</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <BarChart3 size={16} />
            <span>Workspace</span>
            <span>/</span>
            <strong>{links.find((l) => l[0] === section)?.[1] ?? 'Conteúdo'}</strong>
          </div>
          <span className="local-status">
            <span /> Uso local
          </span>
        </header>
        <main key={mode}>
          {mode === 'demo' && (
            <div className="demo-banner">
              <strong>Ambiente de demonstração</strong>
              <span>Dados sintéticos, separados dos registros da clínica.</span>
              <Link href={`/${section}?mode=real`}>
                Ir para dados reais <ArrowUpRight size={14} />
              </Link>
            </div>
          )}
          {children}
        </main>
        <footer>
          Wiener Analytics <span>America/Sao_Paulo · Métricas com origem e contexto.</span>
        </footer>
      </div>
    </div>
  );
}
