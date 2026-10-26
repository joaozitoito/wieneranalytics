export function isLoopback(host: string): boolean {
  try {
    const url = new URL(`http://${host}`);
    return (
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
      url.host === host.toLowerCase() &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
export function assertLocalMutation(request: Request): void {
  const url = new URL(request.url),
    host = request.headers.get('host') ?? url.host;
  // Next monta request.url com o endereço de bind (127.0.0.1), mesmo quando
  // o navegador acessa localhost. A origem pública deve corresponder ao Host.
  if (!isLoopback(host) || request.headers.get('origin') !== `${url.protocol}//${host}`)
    throw new Error('Acesso local: a origem da solicitação deve corresponder ao servidor local.');
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new Error('Acesso local: envie JSON de mesma origem.');
}
