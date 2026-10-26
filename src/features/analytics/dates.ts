export function todayLocal(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
export function shiftDay(date: string, amount: number): string {
  return new Date(Date.parse(`${date}T12:00:00Z`) + amount * 86400000).toISOString().slice(0, 10);
}
export function previousPeriod(start: string, end: string): { start: string; end: string } {
  const duration =
    Math.round((Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86400000) + 1;
  return { start: shiftDay(start, -duration), end: shiftDay(start, -1) };
}
