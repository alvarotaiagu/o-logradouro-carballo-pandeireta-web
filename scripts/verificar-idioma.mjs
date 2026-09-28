/* Verificación del selector galego / castellano. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const puerto = 4321;
const base = 'http://127.0.0.1:' + puerto;
let ok = 0, mal = 0;
function comprobar(cond, msg) { console.log((cond ? 'OK    ' : 'FALLA ') + '· ' + msg); if (cond) ok++; else mal++; }

/* palabras que delatan galego olvidado en la versión castellana (fuera de la
   carta y de las citas, que se quedan como las escribe la casa / quien firma) */
const GALEGO = ['pechado', 'mércores', 'opinións', 'enteiro', 'Saltar ao', 'Chamar', 'Onde e cando', 'Almorzos ata', 'aínda', 'Privacidade', 'De acordo', 'só ao premer', 'repertorio da casa', 'Son: ', 'luns', 'Volvemos o ', 'Aberto'];

async function esperarCortina(page) {
  await page.waitForFunction(() => document.getElementById('cortina').classList.contains('fuera'), { timeout: 8000 });
  await page.waitForTimeout(500);
}

function textoVisibleSinCartaNiCitas(page) {
  return page.evaluate(() => {
    const clon = document.body.cloneNode(true);
    clon.querySelectorAll('#coplas, #destacados-lista, .resenas__citas, .marquee, script, style, .mando, .cortina').forEach((n) => n.remove());
    return clon.textContent.replace(/\s+/g, ' ');
  });
}

const srv = spawn(process.execPath, [path.join(raiz, 'scripts', 'servir.mjs'), String(puerto)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 400));
const browser = await chromium.launch();
try {
  /* ── galego por defecto ── */
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(e.message));
  await p.goto(base + '/', { waitUntil: 'load' });
  await esperarCortina(p);
  const gl = await p.evaluate(() => ({ lang: document.documentElement.lang, h1: document.querySelector('.hero__titular').getAttribute('aria-label'), pulsado: document.querySelector('.idioma [aria-pressed="true"]').dataset.idioma }));
  comprobar(gl.lang === 'gl' && gl.h1 === 'Bar de sempre, a ritmo novo.' && gl.pulsado === 'gl', 'por defecto: galego (lang=' + gl.lang + ', «' + gl.h1 + '»)');

  /* ── cambio en vivo a castellano ── */
  await p.click('.idioma [data-idioma="es"]');
  await p.waitForTimeout(1400);
  const es = await p.evaluate(() => {
    const h1 = document.querySelector('.hero__titular');
    const piezas = Array.from(h1.querySelectorAll('.palabra-int'));
    return {
      lang: document.documentElement.lang,
      h1: h1.getAttribute('aria-label'),
      h1Visible: piezas.length > 0 && piezas.every((s) => Math.abs(window.gsap.getProperty(s, 'y')) < 1),
      nav: document.querySelector('.cabecera__nav a').textContent,
      son: document.getElementById('boton-son-texto').textContent,
      estado: document.querySelector('#estado span').textContent,
      tabla: document.querySelector('#horario-tabla li').textContent,
      guardado: localStorage.getItem('logradouro-idioma'),
      pulsado: document.querySelector('.idioma [aria-pressed="true"]').dataset.idioma
    };
  });
  comprobar(es.lang === 'es' && es.pulsado === 'es', 'al pulsar ES: <html lang="es"> y botón ES pulsado');
  comprobar(es.h1 === 'Bar de siempre, a ritmo nuevo.' && es.h1Visible, 'el titular partido se rehace en castellano y queda visible («' + es.h1 + '»)');
  comprobar(es.nav === 'La casa' && es.son === 'Sonido: apagado', 'nav y botón de sonido en castellano (' + es.nav + ' / ' + es.son + ')');
  comprobar(/^(Abierto · cierra|Abrimos|Volvemos el)/.test(es.estado) && /Cerrado/.test(es.tabla), 'horario en vivo en castellano: «' + es.estado + '» · ' + es.tabla);
  comprobar(es.guardado === 'es', 'la elección se guarda (localStorage)');
  const restos = (await textoVisibleSinCartaNiCitas(p));
  const pillados = GALEGO.filter((w) => restos.includes(w));
  comprobar(pillados.length === 0, 'sin restos de galego fuera de la carta y las citas' + (pillados.length ? ': ' + pillados.join(', ') : ''));

  /* ── recarga: se recuerda ── */
  await p.reload({ waitUntil: 'load' });
  await esperarCortina(p);
  const tras = await p.evaluate(() => ({ lang: document.documentElement.lang, h1: document.querySelector('.hero__titular').getAttribute('aria-label') }));
  comprobar(tras.lang === 'es' && tras.h1 === 'Bar de siempre, a ritmo nuevo.', 'al recargar sigue en castellano');
  const cadaClave = await p.evaluate(() => Array.from(document.querySelectorAll('[data-i18n]')).filter((el) => !el.hasAttribute('data-revelar')).map((el) => el.textContent.trim()));
  comprobar(cadaClave.every((s) => s.length > 0), 'ningún texto traducible se queda vacío (' + cadaClave.length + ' elementos)');

  /* ── páginas legales y 404 siguen el idioma ── */
  for (const [ruta, esperado] of [['/privacidad.html', 'Privacidad y cookies'], ['/aviso-legal.html', 'Objeto'], ['/no-existe', 'Esta copla no existe.']]) {
    await p.goto(base + ruta, { waitUntil: 'load' });
    const vis = await p.evaluate(() => document.body.innerText);
    const esGl = /Privacidade e cookies|Obxecto|copla non existe/.test(vis);
    comprobar(vis.includes(esperado) && !esGl, ruta + ' en castellano, sin el bloque galego a la vista');
  }
  const tabla = await p.goto(base + '/privacidad.html').then(() => p.evaluate(() => document.body.innerText.includes('logradouro-idioma')));
  comprobar(tabla, 'privacidad declara la nueva clave logradouro-idioma');

  /* ── volver a galego ── */
  await p.goto(base + '/', { waitUntil: 'load' });
  await esperarCortina(p);
  await p.click('.idioma [data-idioma="gl"]');
  await p.waitForTimeout(800);
  const deVuelta = await p.evaluate(() => ({ lang: document.documentElement.lang, estado: document.querySelector('#estado span').textContent, h1: document.querySelector('.hero__titular').getAttribute('aria-label') }));
  comprobar(deVuelta.lang === 'gl' && deVuelta.h1 === 'Bar de sempre, a ritmo novo.' && /^(Aberto|Abrimos|Volvemos o)/.test(deVuelta.estado), 'de vuelta a galego: «' + deVuelta.estado + '»');
  comprobar(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await ctx.close();

  /* ── ?lang=es en una visita nueva, con reduced-motion ── */
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const p2 = await ctx2.newPage();
  await p2.goto(base + '/?lang=es', { waitUntil: 'load' });
  await esperarCortina(p2);
  const r2 = await p2.evaluate(() => ({ lang: document.documentElement.lang, h1: document.querySelector('.hero__titular').textContent.replace(/\s+/g, ' ').trim(), menu: document.querySelector('#menu-movil nav a').textContent }));
  comprobar(r2.lang === 'es' && r2.h1 === 'Bar de siempre, a ritmo nuevo.' && r2.menu === 'La casa', 'enlace con ?lang=es en móvil y reduced-motion: «' + r2.h1 + '»');
  await p2.screenshot({ path: path.join(raiz, 'screenshots', '50-es-hero-390.png') });
  await ctx2.close();
} finally {
  await browser.close();
  srv.kill();
}
console.log('='.repeat(70));
console.log(ok + ' OK · ' + mal + ' FALLA(S)');
process.exit(mal ? 1 : 0);
