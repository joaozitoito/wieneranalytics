import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.QA_BASE_URL ?? 'http://localhost:3000';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname))
  throw new Error('QA aceita apenas servidor local.');
const executable = [
  process.env.QA_BROWSER_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => p && fs.existsSync(p));
if (!executable)
  throw new Error('Chrome/Edge não encontrado. Configure QA_BROWSER_PATH com o executável local.');
const output = path.resolve('.tools');
const profile = path.join(output, `browser-qa-${process.pid}`);
fs.mkdirSync(profile, { recursive: true });
const browser = spawn(
  executable,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--disable-extensions',
    '--disable-background-networking',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { windowsHide: true, stdio: 'ignore' },
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, description, timeout = 180000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const result = await fn();
    if (result) return result;
    await sleep(200);
  }
  throw new Error(`Timeout: ${description}`);
}
let socket;
let nextId = 0;
const pending = new Map();
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(
      () => {
        pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      },
      method === 'Page.navigate' ? 180000 : 30000,
    );
    pending.set(id, {
      resolve: (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      reject,
    });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}
async function navigate(url, ready) {
  await send('Page.navigate', { url });
  await until(() => evaluate(`!!document.querySelector(${JSON.stringify(ready)})`), ready);
  await sleep(700);
}
async function screenshot(name) {
  const { data } = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
  });
  fs.writeFileSync(path.join(output, name), Buffer.from(data, 'base64'));
}
try {
  const portFile = path.join(profile, 'DevToolsActivePort');
  await until(() => fs.existsSync(portFile), 'Chrome iniciar', 30000);
  const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
  const target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(
    (t) => t.type === 'page',
  );
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const call = pending.get(message.id);
      pending.delete(message.id);
      if (call) {
        if (message.error) call.reject(new Error(message.error.message));
        else call.resolve(message.result);
      }
    }
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1050,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await navigate(`${base}/?mode=demo`, '.demo-banner');
  await until(
    () =>
      evaluate(
        '(document.querySelector(".recharts-area-curve")?.getAttribute("d")?.length ?? 0) > 20',
      ),
    'gráfico renderizar',
  );
  assert.equal(
    await evaluate('document.documentElement.scrollWidth <= window.innerWidth'),
    true,
    'overflow horizontal no desktop',
  );
  await screenshot('dashboard-desktop.png');
  console.log('PASS: dashboard demo, gráfico e desktop sem overflow.');

  await navigate(`${base}/instagram?mode=demo`, '#novo input[name="views"]');
  await evaluate('document.querySelector("#novo input[name=views]").value="123456"');
  await evaluate('document.querySelector(".demo-banner a").click()');
  await until(
    () =>
      evaluate('!document.querySelector(".demo-banner") && location.search.includes("mode=real")'),
    'troca para ambiente real',
  );
  assert.equal(
    await evaluate('document.querySelector("#novo input[name=views]").value'),
    '',
    'rascunho demo vazou para formulário real',
  );
  console.log('PASS: alternar demo → real elimina rascunho.');

  await navigate(`${base}/instagram?mode=demo`, '#importar input[type="file"]');
  const csvFile = path.join(output, 'browser-demo.csv');
  fs.writeFileSync(csvFile, 'measuredOn,views,reach\n2026-10-26,19,12');
  const { root } = await send('DOM.getDocument');
  const { nodeId } = await send('DOM.querySelector', {
    nodeId: root.nodeId,
    selector: '#importar input[type="file"]',
  });
  await send('DOM.setFileInputFiles', { nodeId, files: [csvFile] });
  await until(
    () => evaluate('document.querySelectorAll("#importar select").length > 0'),
    'mapeamento CSV',
  );
  // Atraso no transporte da página permite observar o estado pendente sem depender da rede.
  await evaluate(
    'window.__originalFetch=window.fetch; window.fetch=async (...args)=>{await new Promise(r=>setTimeout(r,800)); return window.__originalFetch(...args)}',
  );
  await evaluate(
    'Array.from(document.querySelectorAll("#importar button")).find(b=>b.textContent.includes("Validar")).click()',
  );
  await sleep(100);
  assert.equal(
    await evaluate(
      'Array.from(document.querySelectorAll("#importar select")).every(s=>s.disabled)',
    ),
    true,
    'mapeamento pode mudar durante validação pendente',
  );
  await until(
    () => evaluate('document.querySelector("#importar .notice")?.textContent.includes("válidas")'),
    'prévia CSV',
  );
  await evaluate('window.fetch=window.__originalFetch');
  console.log('PASS: CSV mostra prévia e bloqueia mapeamento durante requisição.');

  const status = await evaluate(
    `fetch('/api/snapshots', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'demo',kind:'account',measuredOn:'2026-10-26',views:19,notes:'QA automatizado: demonstração apenas'})}).then(r=>r.status)`,
  );
  assert.equal(status, 200, 'escrita legítima pelo navegador em localhost');
  console.log('PASS: escrita real via HTTP/browser em localhost (apenas demo).');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await navigate(`${base}/?mode=demo`, '.demo-banner');
  assert.equal(
    await evaluate('document.documentElement.scrollWidth <= window.innerWidth'),
    true,
    'overflow horizontal no mobile',
  );
  await screenshot('dashboard-mobile.png');
  console.log('PASS: mobile 390 px sem overflow. Capturas salvas em .tools/.');
} finally {
  if (socket?.readyState === WebSocket.OPEN) {
    await send('Browser.close').catch(() => {});
    socket.close();
  }
  if (!browser.killed) browser.kill();
}
