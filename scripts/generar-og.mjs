/* Genera assets/og-logradouro.jpg (1200×630), la imagen que sale al compartir
   el enlace (WhatsApp, redes). Si cambia el titular del hero, volver a correr:
   node scripts/generar-og.mjs */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const puerto = 4330;
const base = 'http://127.0.0.1:' + puerto + '/';

const html = `<!doctype html><html lang="gl"><head><meta charset="utf-8"><base href="${base}">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Young+Serif&family=Karla:wght@400;700&display=swap">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #16130F; color: #EFE7D6; font-family: Karla, sans-serif; position: relative; }
  .luz { position: absolute; width: 900px; height: 900px; right: -240px; top: -135px; background: radial-gradient(circle, rgba(233,185,73,.13) 0%, rgba(168,123,79,.05) 38%, rgba(22,19,15,0) 64%); }
  .texto { position: absolute; left: 80px; top: 50%; transform: translateY(-50%); width: 560px; }
  .kicker { font-weight: 700; font-size: 18px; letter-spacing: .24em; text-transform: uppercase; color: #E9B949; }
  h1 { font-family: "Young Serif", serif; font-weight: 400; font-size: 66px; line-height: 1.04; margin-top: 22px; }
  .sub { margin-top: 26px; font-size: 22px; color: rgba(239,231,214,.72); }
  .pand { position: absolute; right: -40px; top: 50%; transform: translateY(-50%); width: 560px; height: 560px; }
</style></head><body>
  <div class="luz"></div>
  <div class="texto">
    <p class="kicker">O Logradouro · Carballo</p>
    <h1>Taberna de sempre,<br>carta de agora.</h1>
    <p class="sub">Rúa Lugo, 2 · de mércores a domingo, 10:00–1:00</p>
  </div>
  <svg class="pand" viewBox="0 0 520 520">
    <defs><radialGradient id="p" cx="42%" cy="38%" r="68%"><stop offset="0" stop-color="#F7F1E4"/><stop offset=".6" stop-color="#EFE7D6"/><stop offset="1" stop-color="#D8C9A8"/></radialGradient></defs>
    <circle cx="262" cy="266" r="222" fill="#000" opacity=".3"/>
    <circle cx="260" cy="260" r="222" fill="none" stroke="#A87B4F" stroke-width="27"/>
    <circle cx="260" cy="260" r="236" fill="none" stroke="#7B5634" stroke-width="2"/>
    <circle cx="260" cy="260" r="207" fill="url(#p)"/>
    <image href="assets/logo/fachada.svg" x="176" y="98" width="168" height="168"/>
    <image href="assets/logo/rotulo.svg" x="112" y="300" width="296" height="82"/>
    <path d="M436 402C458 452 434 494 458 546" stroke="#C4262E" stroke-width="13" fill="none" stroke-linecap="round"/>
    <path d="M446 396C478 440 478 482 508 522" stroke="#EFE7D6" stroke-width="8" fill="none" stroke-linecap="round" opacity=".9"/>
    ${Array.from({ length: 10 }, (_, i) => {
      const a = (36 * i - 90) * Math.PI / 180, x = 260 + Math.cos(a) * 234, y = 260 + Math.sin(a) * 234;
      return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${36 * i})"><rect x="-16" y="-8" width="32" height="16" rx="3" fill="#2A241C"/><ellipse cy="-3.6" rx="14" ry="5.6" fill="#D6D1C4" stroke="#847E70"/><ellipse cy="3.6" rx="14" ry="5.6" fill="#BEB8AA" stroke="#736D60"/></g>`;
    }).join('')}
  </svg>
</body></html>`;

const srv = spawn(process.execPath, [path.join(raiz, 'scripts', 'servir.mjs'), String(puerto)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 400));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(raiz, 'assets', 'og-logradouro.jpg'), type: 'jpeg', quality: 88 });
  console.log('assets/og-logradouro.jpg generada');
} finally {
  await browser.close();
  srv.kill();
}
