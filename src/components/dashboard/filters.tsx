import { CalendarDays, ChevronDown } from 'lucide-react';
import type { parseFilters } from '@/server/repositories/workspace';
export function Filters({ filters }: { filters: ReturnType<typeof parseFilters> }) {
  return (
    <form className="filters" method="get">
      <label className="select-control">
        <span className="sr-only">Ambiente de dados</span>
        <select name="mode" defaultValue={filters.mode}>
          <option value="real">Dados da clínica</option>
          <option value="demo">Demonstração</option>
        </select>
        <ChevronDown size={14} />
      </label>
      <label className="select-control">
        <CalendarDays size={16} />
        <span className="sr-only">Período</span>
        <select name="preset" defaultValue={filters.preset}>
          <option value="1">Hoje</option>
          <option value="7">Últimos 7 dias</option>
          <option value="14">Últimos 14 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="custom">Personalizado</option>
        </select>
      </label>
      <div className="custom-dates">
        <label>
          <span>De</span>
          <input
            aria-label="Data inicial personalizada"
            name="start"
            type="date"
            defaultValue={filters.start}
          />
        </label>
        <label>
          <span>Até</span>
          <input
            aria-label="Data final personalizada"
            name="end"
            type="date"
            defaultValue={filters.end}
          />
        </label>
      </div>
      <button className="button secondary" type="submit">
        Aplicar
      </button>
    </form>
  );
}
