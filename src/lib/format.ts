export const number = (value: number | null | undefined) =>
  value == null ? '—' : new Intl.NumberFormat('pt-BR').format(value);
export const money = (cents: number | null | undefined) =>
  cents == null
    ? 'Desconhecido'
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
export const dateLabel = (day: string | null | undefined) =>
  day
    ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(
        new Date(`${day}T12:00:00Z`),
      )
    : 'Data desconhecida';
export const timestamp = (value: Date | string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/Sao_Paulo',
      }).format(new Date(value))
    : 'Sem coleta';
export const sourceLabels: Record<string, string> = {
  MANUAL: 'Entrada manual',
  CSV: 'Importação CSV',
  DEMO: 'Demonstração',
  META: 'API oficial Meta',
};
export const typeLabels: Record<string, string> = {
  FEED: 'Feed',
  CAROUSEL: 'Carrossel',
  REEL: 'Reel',
  STORY: 'Story',
};
