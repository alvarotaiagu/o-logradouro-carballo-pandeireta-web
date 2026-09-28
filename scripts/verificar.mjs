/* Verificación de O Logradouro · «Pandeireta».
   Levanta un servidor estático, abre el sitio con Playwright y comprueba:
   cortina que se retira siempre (normal / sin JS / reduced-motion / CDN
   caído), cookies, mapa bajo clic, menú móvil, las dos densidades, el
   horario en vivo (6 casos), el cursor propio, capturas a 1440 y 390,
   contraste de los tokens de acento derivados y que ningún precio se
   haya inventado fuera de data/carta.json.

   node scripts/verificar.mjs
*/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUERTO = 4311;
const BASE = 'http://127.0.0.1:' + PUERTO;
const CAP = path.join(raiz, 'screenshots');
fs.mkdirSync(CAP, { recursive: true });

const notas = [];
const fallos = [];
function comprobar(ok, mensaje) { (ok ? notas : fallos).push((ok ? 'OK   ' : 'FALLA') + ' · ' + mensaje); }

/* ───────────────── servidor estático ───────────────── */
const tipos = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.json': 'application/json', '.md': 'text/plain; charset=utf-8'
};
const servidor = http.createServer((req, res) => {
  const limpia = decodeURIComponent(req.url.split('?')[0]);
  const destino = path.join(raiz, limpia === '/' ? 'index.html' : limpia);
  if (!destino.startsWith(raiz)) { res.writeHead(403).end('no'); return; }
  if (!fs.existsSync(destino) || fs.statSync(destino).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(path.join(raiz, '404.html')));
    return;
  }
  res.writeHead(200, { 'content-type': tipos[path.extname(destino)] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(fs.readFileSync(destino));
});
await new Promise((r) => servidor.listen(PUERTO, '127.0.0.1', r));

async function rueda(page, vueltas, paso = 650, espera = 130) {
  await page.mouse.move(760, 420);
  let anterior = -1;
  for (let i = 0; i < vueltas; i++) {
    await page.mouse.wheel(0, paso);
    await page.waitForTimeout(espera);
    const y = await page.evaluate(() => Math.round(window.scrollY));
    if (y === anterior) break;
    anterior = y;
  }
  await page.waitForTimeout(1800);
}

const navegador = await chromium.launch({ headless: true });

/* ═══════════════════════ 1. PASE NORMAL, ESCRITORIO ═══════════════════════ */
{
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errores = [];
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  page.on('pageerror', (e) => errores.push('pageerror: ' + e.message));

  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(3500);

  const cortinaFuera = await page.evaluate(() => {
    const c = document.getElementById('cortina');
    return c && getComputedStyle(c).display === 'none';
  });
  comprobar(cortinaFuera, 'la cortina se retira en el pase normal');

  await page.mouse.move(500, 400);
  await page.mouse.move(520, 410);
  await page.waitForTimeout(150);
  const cursorOculto = await page.evaluate(() => getComputedStyle(document.body).cursor === 'none');
  comprobar(cursorOculto, 'cursor nativo oculto (html.con-cursor) tras mover el ratón');

  const conteoVersos = await page.evaluate(() => document.querySelectorAll('.verso').length);
  comprobar(conteoVersos === 68, '68 platos pintados desde data/carta.json (van ' + conteoVersos + ')');

  const conteoDestacados = await page.evaluate(() => document.querySelectorAll('.destacado').length);
  comprobar(conteoDestacados === 3, '3 destacados pintados (van ' + conteoDestacados + ')');

  const ferrenasSonG = await page.evaluate(() => {
    const grupo = document.getElementById('aro-ferrenas');
    return grupo && grupo.children.length > 0 && Array.from(grupo.children).every((n) => n.tagName.toLowerCase() === 'g');
  });
  comprobar(ferrenasSonG, 'las ferreñas son <g> independientes, no <use> compartido');

  await page.screenshot({ path: path.join(CAP, '01-hero-1440.png') });

  /* precios: todo lo que se ve en pantalla tiene que venir de carta.json */
  const datos = JSON.parse(fs.readFileSync(path.join(raiz, 'data', 'carta.json'), 'utf8'));
  const preciosValidos = new Set();
  datos.secciones.forEach((s) => s.platos.forEach((p) => {
    if (p.precio !== null && p.precio !== undefined) preciosValidos.add(p.precio.toFixed(2).replace('.', ','));
    if (p.media) preciosValidos.add(p.media.toFixed(2).replace('.', ','));
  }));
  const preciosEnPagina = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.verso__precio').forEach((el) => {
      const m = el.textContent.match(/\d+,\d\d/g);
      if (m) out.push(...m);
    });
    return out;
  });
  const inventados = preciosEnPagina.filter((p) => !preciosValidos.has(p));
  comprobar(inventados.length === 0, 'ningún precio en pantalla fuera de data/carta.json' + (inventados.length ? ' (sobran: ' + inventados.join(',') + ')' : ''));

  /* mouse-wheel a través de toda la página (Lenis no responde a scrollTo) */
  await rueda(page, 140);
  await page.screenshot({ path: path.join(CAP, '09-final-1440.png') });

  /* no basta con la clase: el botón estuvo «visible» pero tapado por la
     cabecera. Se pregunta qué elemento hay de verdad en su centro. */
  const botonVisible = await page.evaluate(() => {
    const b = document.getElementById('pandeireta-boton');
    if (!b || b.hidden || !b.classList.contains('visible')) return false;
    const r = b.getBoundingClientRect();
    const arriba = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!arriba && b.contains(arriba);
  });
  comprobar(botonVisible, 'la pandereta queda atracada como botón fijo tras el hero, y nada la tapa');

  /* volver arriba y comprobar secciones intermedias con capturas */
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  for (const [id, archivo] of [['casa', '02-casa'], ['carta', '03-carta'], ['destacados', '04-destacados'], ['resenas', '05-resenas'], ['horario', '06-horario']]) {
    await page.evaluate((sel) => { document.getElementById(sel).scrollIntoView(); }, id);
    await page.waitForTimeout(500);
    await page.mouse.wheel(0, 1); // fuerza a Lenis a sincronizar tras el salto directo
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(CAP, archivo + '-1440.png') });
  }

  /* golpe al tocar la pandereta */
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.click('#pandeireta');
  await page.waitForTimeout(300);
  const golpeOk = await page.evaluate(() => document.getElementById('pandeireta').classList.contains('golpe'));
  comprobar(golpeOk, 'tocar la pandereta dispara la clase "golpe"');

  /* botón de son */
  await page.click('#boton-son');
  const sonOk = await page.evaluate(() => document.getElementById('boton-son').getAttribute('aria-pressed') === 'true');
  comprobar(sonOk, 'el botón de son cambia aria-pressed al activarse');
  await page.click('#boton-son');

  /* cookies: display:flex vs [hidden] */
  const cookiesVisible = await page.evaluate(() => getComputedStyle(document.getElementById('cookies')).display !== 'none');
  comprobar(cookiesVisible, 'el aviso de cookies se muestra en la primera visita');
  await page.click('#cookies-aceptar');
  await page.waitForTimeout(200);
  const cookiesOcultas = await page.evaluate(() => getComputedStyle(document.getElementById('cookies')).display === 'none');
  comprobar(cookiesOcultas, 'el botón de cookies SÍ cierra el aviso (display:none real, no solo [hidden])');

  /* mapa solo bajo clic */
  const iframeAntes = await page.evaluate(() => !!document.querySelector('.mapa iframe'));
  comprobar(!iframeAntes, 'no hay iframe de Google Maps antes de pulsar');
  await page.evaluate(() => document.getElementById('horario').scrollIntoView());
  await page.waitForTimeout(400);
  await page.click('.map-consent');
  await page.waitForTimeout(300);
  const iframeDespues = await page.evaluate(() => {
    const f = document.querySelector('.mapa iframe');
    return f && f.src.includes('output=embed');
  });
  comprobar(iframeDespues, 'el iframe de Google Maps se crea solo al pulsar el botón');

  comprobar(errores.length === 0, 'consola limpia en el pase normal' + (errores.length ? (': ' + errores.slice(0, 4).join(' | ')) : ''));

  /* ───────── contraste: tokens derivados, compuestos sobre su fondo real ───────── */
  function luminancia([r, g, b]) {
    const c = [r, g, b].map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contraste(a, b) {
    const la = luminancia(a), lb = luminancia(b);
    const [claro, oscuro] = la > lb ? [la, lb] : [lb, la];
    return (claro + 0.05) / (oscuro + 0.05);
  }
  function parseColor(str) {
    /* color-mix()/color-mix(...,transparent) se calcula como color(srgb r g b / a)
       con canales 0-1, NO como rgb() — hay que distinguirlo o un regex de tres
       números lee 0.43 como canal 0-255 y da un contraste fantasma. */
    const csrgb = str.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/);
    if (csrgb) return { rgb: [+csrgb[1] * 255, +csrgb[2] * 255, +csrgb[3] * 255], a: csrgb[4] !== undefined ? +csrgb[4] : 1 };
    const m = str.match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\)/);
    if (!m) return null;
    return { rgb: [+m[1], +m[2], +m[3]], a: m[4] !== undefined ? +m[4] : 1 };
  }
  function compositar(fg, bg) {
    if (fg.a >= 1) return fg.rgb;
    return fg.rgb.map((c, i) => c * fg.a + bg.rgb[i] * (1 - fg.a));
  }

  const pares = [
    ['.hero__titular', '.hero'],
    ['.hero__sub', '.hero'],
    ['.boton--lazo', '.boton--lazo'],
    ['.cancioneiro__kicker', '.cancioneiro'],
    ['.verso__nombre', '.cancioneiro'],
    ['.verso__desc', '.cancioneiro'],
    ['.copla__nota', '.cancioneiro'],
    ['.destacados__kicker', '.destacados'],
    ['.destacado__precio', '.destacado'],
    ['.marquee__pista span', '.casa'],
    ['.casa__texto', '.casa'],
    ['.pie__nota', '.pie']
  ];
  for (const [selFg, selBg] of pares) {
    const r = await page.evaluate(([selFg, selBg]) => {
      const fg = document.querySelector(selFg);
      const bg = document.querySelector(selBg);
      if (!fg || !bg) return null;
      return { color: getComputedStyle(fg).color, fondo: getComputedStyle(bg).backgroundColor, texto: fg.textContent.trim().slice(0, 24) };
    }, [selFg, selBg]);
    if (!r) { comprobar(false, 'contraste: no se encontró ' + selFg + ' / ' + selBg); continue; }
    const fg = parseColor(r.color);
    const bgc = parseColor(r.fondo) || { rgb: [22, 19, 15], a: 1 };
    if (!fg) { comprobar(false, 'contraste: no se pudo parsear color de ' + selFg); continue; }
    const rgbFinal = compositar(fg, bgc);
    const ratio = contraste(rgbFinal, bgc.rgb);
    comprobar(ratio >= 4.5, 'contraste ' + selFg + ' sobre ' + selBg + ' = ' + ratio.toFixed(2) + ':1 (mínimo 4,5:1)');
  }

  await ctx.close();
}

/* ═══════════════════════ 2. MÓVIL, 390×844 ═══════════════════════ */
{
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(CAP, '10-hero-390.png') });

  await page.click('#hamburguesa');
  await page.waitForTimeout(500);
  const menu = await page.evaluate(() => {
    const m = document.getElementById('menu-movil');
    const r = m.getBoundingClientRect();
    return { bottom: r.bottom, alto: r.height, viewport: window.innerHeight };
  });
  comprobar(menu.alto >= menu.viewport - 2, 'el menú móvil mide 100dvh bajo la cabecera con backdrop-filter (alto ' + Math.round(menu.alto) + ' vs viewport ' + menu.viewport + ')');
  await page.screenshot({ path: path.join(CAP, '11-menu-movil-390.png') });
  await page.click('#hamburguesa');
  await page.waitForTimeout(500);

  await rueda(page, 200, 500, 120);
  await page.evaluate(() => document.getElementById('carta').scrollIntoView());
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(CAP, '12-carta-390.png') });

  await ctx.close();
}

/* ═══════════════════════ 3. REDUCED MOTION ═══════════════════════ */
{
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const cortinaFuera = await page.evaluate(() => getComputedStyle(document.getElementById('cortina')).display === 'none');
  comprobar(cortinaFuera, 'con prefers-reduced-motion la cortina se retira igualmente');
  const sonidoApagado = await page.evaluate(() => document.getElementById('boton-son').getAttribute('aria-pressed') === 'false');
  comprobar(sonidoApagado, 'con reduced-motion el son arranca apagado');
  await page.screenshot({ path: path.join(CAP, '20-reduced-motion.png') });
  await ctx.close();
}

/* ═══════════════════════ 4. SIN JAVASCRIPT ═══════════════════════ */
{
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const cortinaFuera = await page.evaluate(() => {
    const c = document.getElementById('cortina');
    return !c || getComputedStyle(c).display === 'none';
  });
  comprobar(cortinaFuera, 'sin JavaScript la cortina no tapa la página (CSS html.sin-js)');
  await page.screenshot({ path: path.join(CAP, '21-sin-js.png') });
  await ctx.close();
}

/* ═══════════════════════ 5. CDN BLOQUEADO ═══════════════════════ */
{
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.route('**jsdelivr.net/**', (route) => route.abort());
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  const cortinaFuera = await page.evaluate(() => getComputedStyle(document.getElementById('cortina')).display === 'none');
  comprobar(cortinaFuera, 'con el CDN de GSAP/Lenis bloqueado la cortina se retira igualmente (red de seguridad)');
  await page.screenshot({ path: path.join(CAP, '22-sin-cdn.png') });
  await ctx.close();
}

/* ═══════════════════════ 6. HORARIO EN VIVO: 6 CASOS ═══════════════════════ */
{
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  const casos = [
    { nombre: 'jueves 00:30 → abierto (turno del miércoles)', dia: 4, hora: 0, min: 30, esperaAbierto: true },
    { nombre: 'lunes 00:30 → abierto (turno del domingo)', dia: 1, hora: 0, min: 30, esperaAbierto: true },
    { nombre: 'lunes 01:30 → cerrado, "Volvemos o mércores"', dia: 1, hora: 1, min: 30, esperaAbierto: false, esperaHoyMismo: false, esperaDia: 3 },
    { nombre: 'martes 12:00 → cerrado', dia: 2, hora: 12, min: 0, esperaAbierto: false },
    { nombre: 'miércoles 09:50 → cerrado, "Abrimos ás 10:00"', dia: 3, hora: 9, min: 50, esperaAbierto: false, esperaHoyMismo: true },
    { nombre: 'sábado 12:30 → abierto, aviso de desayunos visible', dia: 6, hora: 12, min: 30, esperaAbierto: true }
  ];
  for (const c of casos) {
    const r = await page.evaluate((c) => {
      const t = { dia: c.dia, min: c.dia * 1440 + c.hora * 60 + c.min };
      return window.__horarioTest.calcular(t);
    }, c);
    let ok = r.abierto === c.esperaAbierto;
    if (ok && c.esperaHoyMismo !== undefined) ok = r.hoyMismo === c.esperaHoyMismo;
    if (ok && c.esperaDia !== undefined) ok = r.proximoDia === c.esperaDia;
    comprobar(ok, 'horario: ' + c.nombre + ' → ' + JSON.stringify(r));
  }
  const avisoDesayunos = await page.evaluate(() => !!document.querySelector('.horario__aviso'));
  comprobar(avisoDesayunos, 'el aviso de desayunos hasta las 13:00 está siempre en el DOM (no depende de la hora)');
  await ctx.close();
}

/* ═══════════════════════ 7. DENSIDAD SOBRIA (?revision) ═══════════════════════ */
{
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/?revision', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const mandoVisible = await page.evaluate(() => !document.getElementById('mando').hidden);
  comprobar(mandoVisible, 'el mando de maqueta solo aparece con ?revision');
  await page.click('[data-densidad="sobria"]');
  await page.waitForTimeout(500);
  const esSobria = await page.evaluate(() => document.documentElement.classList.contains('densidad-sobria'));
  comprobar(esSobria, 'el mando cambia a densidad sobria');
  await page.screenshot({ path: path.join(CAP, '30-sobria-hero-1440.png') });
  await page.evaluate(() => document.getElementById('casa').scrollIntoView());
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(CAP, '31-sobria-casa-1440.png') });
  await ctx.close();

  const ctx2 = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const page2 = await ctx2.newPage();
  await page2.goto(BASE + '/', { waitUntil: 'load' });
  await page2.waitForTimeout(1500);
  const mandoOculto = await page2.evaluate(() => document.getElementById('mando').hidden);
  comprobar(mandoOculto, 'sin ?revision el mando queda oculto (el enlace que recibe el cliente sale limpio)');
  await ctx2.close();
}

/* ═══════════════════════ 8. NOINDEX EN TODAS LAS PÁGINAS ═══════════════════════ */
{
  const paginas = ['index.html', '404.html', 'aviso-legal.html', 'privacidad.html'];
  for (const p of paginas) {
    const html = fs.readFileSync(path.join(raiz, p), 'utf8');
    comprobar(/<meta\s+name="robots"\s+content="noindex,\s*nofollow"/.test(html), 'noindex en ' + p);
  }
}

/* ═══════════════════════ 9. RENDIMIENTO: LONGTASK DESDE fonts.ready ═══════════════════════ */
{
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(function () {
    window.__huecos = [];
    window.__inicioMedida = 0;
    document.fonts && document.fonts.ready.then(function () {
      window.__inicioMedida = performance.now();
      var anterior = performance.now();
      function paso(t) {
        var hueco = t - anterior;
        if (t >= window.__inicioMedida && hueco > 50) window.__huecos.push(Math.round(hueco));
        anterior = t;
        requestAnimationFrame(paso);
      }
      requestAnimationFrame(paso);
    });
  });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(4500);
  const huecos = await page.evaluate(() => window.__huecos);
  comprobar(true, 'huecos >50ms desde fonts.ready (informativo, no bloqueante): ' + JSON.stringify(huecos));
  await ctx.close();
}

await new Promise((r) => servidor.close(r));
await navegador.close();

console.log('\nO Logradouro · Pandeireta — verificación');
console.log('='.repeat(70));
notas.forEach((n) => console.log(n));
fallos.forEach((n) => console.log(n));
console.log('='.repeat(70));
console.log(notas.length + ' OK · ' + fallos.length + ' FALLA(S)');
if (fallos.length) process.exitCode = 1;
