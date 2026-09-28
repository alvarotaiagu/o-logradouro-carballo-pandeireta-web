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
const GALEGO = ['pechado', 'mércores', 'opinións', 'Pola mañá', 'Saltar ao', 'Chamar', 'Onde e cando', 'Almorzos ata', 'pregúntao', 'Privacidade', 'De acordo', 'só ao premer', 'primeira vez', 'Son: ', 'luns', 'Volvemos o ', 'Aberto'];

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
  comprobar(gl.lang === 'gl' && gl.h1 === 'Taberna de sempre, carta de agora.' && gl.pulsado === 'gl', 'por defecto: galego (lang=' + gl.lang + ', «' + gl.h1 + '»)');
  await p.waitForSelector('.verso');
  const cartaGl = await p.evaluate(() => Array.from(document.querySelectorAll('.copla__titulo, .verso__nombre, .verso__desc, .copla__nota, .destacado__nombre, .destacado__desc, .marquee__pista span')).map((e) => e.textContent).join(' | '));
  const castEnGl = ['Tostada', 'Albóndigas', 'Raciones', 'lechuga', 'cebolla', 'Postres', 'Tabla', 'Hasta las', 'huevo', 'Desayunos', 'De la cocina', 'Zumos', 'setas', ' y '].filter((w) => cartaGl.includes(w));
  comprobar(castEnGl.length === 0 && cartaGl.includes('Racións') && cartaGl.includes('Albóndegas'), 'galego: a carta en galego' + (castEnGl.length ? ' (quedan: ' + castEnGl.join(', ') + ')' : ''));

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
  comprobar(es.h1 === 'Taberna de siempre, carta de ahora.' && es.h1Visible, 'el titular partido se rehace en castellano y queda visible («' + es.h1 + '»)');
  comprobar(es.nav === 'La casa' && es.son === 'Sonido: apagado', 'nav y botón de sonido en castellano (' + es.nav + ' / ' + es.son + ')');
  comprobar(/^(Abierto · cierra|Abrimos|Volvemos el)/.test(es.estado) && /Cerrado/.test(es.tabla), 'horario en vivo en castellano: «' + es.estado + '» · ' + es.tabla);
  comprobar(es.guardado === 'es', 'la elección se guarda (localStorage)');
  const cartaEs = await p.evaluate(() => Array.from(document.querySelectorAll('.copla__titulo, .verso__nombre, .verso__desc, .destacado__nombre')).map((e) => e.textContent).join(' | '));
  const galEnEs = ['Racións', 'Albóndegas', 'Torrada', 'leituga', 'cebola', 'Sobremesas', 'Táboa', 'ovos', 'Da cociña'].filter((w) => cartaEs.includes(w));
  comprobar(galEnEs.length === 0 && cartaEs.includes('Raciones') && cartaEs.includes('Albóndigas'), 'castellano: la carta en castellano' + (galEnEs.length ? ' (quedan: ' + galEnEs.join(', ') + ')' : ''));
  const restos = (await textoVisibleSinCartaNiCitas(p));
  const pillados = GALEGO.filter((w) => restos.includes(w));
  comprobar(pillados.length === 0, 'sin restos de galego fuera de la carta y las citas' + (pillados.length ? ': ' + pillados.join(', ') : ''));

  /* ── recarga: se recuerda ── */
  await p.reload({ waitUntil: 'load' });
  await esperarCortina(p);
  const tras = await p.evaluate(() => ({ lang: document.documentElement.lang, h1: document.querySelector('.hero__titular').getAttribute('aria-label') }));
  comprobar(tras.lang === 'es' && tras.h1 === 'Taberna de siempre, carta de ahora.', 'al recargar sigue en castellano');
  const cadaClave = await p.evaluate(() => Array.from(document.querySelectorAll('[data-i18n]')).filter((el) => !el.hasAttribute('data-revelar')).map((el) => el.textContent.trim()));
  comprobar(cadaClave.every((s) => s.length > 0), 'ningún texto traducible se queda vacío (' + cadaClave.length + ' elementos)');

  /* ── páginas legales y 404 siguen el idioma ── */
  for (const [ruta, esperado] of [['/privacidad.html', 'Privacidad y cookies'], ['/aviso-legal.html', 'Objeto'], ['/no-existe', 'Esta página no existe.']]) {
    await p.goto(base + ruta, { waitUntil: 'load' });
    const vis = await p.evaluate(() => document.body.innerText);
    const esGl = /Privacidade e cookies|Obxecto|páxina non existe/.test(vis);
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
  comprobar(deVuelta.lang === 'gl' && deVuelta.h1 === 'Taberna de sempre, carta de agora.' && /^(Aberto|Abrimos|Volvemos o)/.test(deVuelta.estado), 'de vuelta a galego: «' + deVuelta.estado + '»');

  /* ── inglés ── */
  await p.click('.idioma [data-idioma="en"]');
  await p.waitForTimeout(1400);
  const en = await p.evaluate(() => ({
    lang: document.documentElement.lang,
    h1: document.querySelector('.hero__titular').getAttribute('aria-label'),
    nav: Array.from(document.querySelectorAll('.cabecera__nav a')).map((a) => a.textContent).join('|'),
    son: document.getElementById('boton-son-texto').textContent,
    estado: document.querySelector('#estado span').textContent,
    tabla: document.querySelector('#horario-tabla li').textContent,
    copla: document.querySelector('.copla__num').textContent.replace(/\s+/g, ' ').trim(),
    media: (document.querySelector('.media__etq') || {}).textContent || '(sin medias)',
    mapa: document.querySelector('.map-consent').getAttribute('data-map-title')
  }));
  comprobar(en.lang === 'en' && en.h1 === 'A classic tavern with a menu for today.', 'inglés: <html lang="en"> y titular «' + en.h1 + '»');
  comprobar(en.nav === 'About|Menu|Where to start|Reviews|Hours' && en.son === 'Sound: off', 'inglés: nav y sonido (' + en.nav + ' / ' + en.son + ')');
  comprobar(/^(Open · closes at|We open at|Back on \w+day at)/.test(en.estado) && /Closed/.test(en.tabla), 'inglés: horario en vivo «' + en.estado + '» · ' + en.tabla);
  comprobar(en.copla === '01 / 11' && en.media === 'half' && en.mapa.startsWith('Map:'), 'inglés: carta «' + en.copla + '», «' + en.media + '», título del mapa');
  /* la carta también cambia: títulos, platos, descripciones, destacados, marquee y formato del precio */
  const cartaEn = await p.evaluate(() => ({
    titulos: Array.from(document.querySelectorAll('.copla__titulo')).map((h) => h.textContent),
    platos: Array.from(document.querySelectorAll('.verso__nombre, .verso__desc, .copla__nota, .destacado__nombre, .destacado__desc, .marquee__pista span')).map((e) => e.textContent).join(' | '),
    precio: document.querySelector('.verso__precio').textContent.trim(),
    titulo: document.title
  }));
  comprobar(cartaEn.titulos.join('|') === 'Breakfast|Breakfasts with a name|Tapas|Sharing plates|Tortillas|Sandwiches and burgers|From the kitchen|Salads|Vegan options|Desserts|Drinks', 'inglés: títulos de la carta (' + cartaEn.titulos.join(', ') + ')');
  const CASTELLANO_CARTA = ['Tostada', 'Albóndigas', 'Raciones', 'Hamburguesa', 'lechuga', 'cebolla', 'unidades', 'Postres', 'Bebidas', 'Ensalada', 'Tabla', 'Hasta las', 'Cada desayuno', 'Zumos', 'huevo'];
  const castEn = CASTELLANO_CARTA.filter((w) => cartaEn.platos.includes(w));
  comprobar(castEn.length === 0, 'inglés: carta, destacados y marquee sin castellano' + (castEn.length ? ': ' + castEn.join(', ') : ''));
  comprobar(/^€\d+\.\d\d$/.test(cartaEn.precio) && cartaEn.titulo.includes('Tavern'), 'inglés: precio «' + cartaEn.precio + '» y <title> «' + cartaEn.titulo + '»');
  const MARCAS = ['Horario', 'Destacados', 'Ver mapa', 'Aviso legal', 'Sonido', 'Son:', 'reseñas', 'opinións', 'Llamar', 'Chamar', 'Ver el', 'Ver o', 'Pechado', 'Cerrado', 'De acuerdo', 'De acordo', 'Saltar', 'Taberna ·', 'Privacidad'];
  const restosEn = await textoVisibleSinCartaNiCitas(p);
  const pilladosEn = MARCAS.filter((w) => restosEn.includes(w));
  comprobar(pilladosEn.length === 0, 'inglés: sin restos de galego ni castellano fuera de la carta y las citas' + (pilladosEn.length ? ': ' + pilladosEn.join(', ') : ''));
  for (const [ruta, esperado, prohibido] of [['/privacidad.html', 'Privacy and cookies', /Privacidade e cookies|Privacidad y cookies/], ['/aviso-legal.html', 'Legal notice', /Obxecto|Objeto/], ['/no-existe', 'This page does not exist.', /páxina non existe|página no existe/]]) {
    await p.goto(base + ruta, { waitUntil: 'load' });
    const vis = await p.evaluate(() => document.body.innerText);
    comprobar(vis.includes(esperado) && !prohibido.test(vis), 'inglés: ' + ruta + ' solo con el bloque en inglés');
  }
  await p.goto(base + '/', { waitUntil: 'load' });
  await esperarCortina(p);
  await p.click('.idioma [data-idioma="gl"]');
  await p.waitForTimeout(600);

  comprobar(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await ctx.close();

  /* ── ?lang=es en una visita nueva, con reduced-motion ── */
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const p2 = await ctx2.newPage();
  await p2.goto(base + '/?lang=es', { waitUntil: 'load' });
  await esperarCortina(p2);
  const r2 = await p2.evaluate(() => ({ lang: document.documentElement.lang, h1: document.querySelector('.hero__titular').textContent.replace(/\s+/g, ' ').trim(), menu: document.querySelector('#menu-movil nav a').textContent }));
  comprobar(r2.lang === 'es' && r2.h1 === 'Taberna de siempre, carta de ahora.' && r2.menu === 'La casa', 'enlace con ?lang=es en móvil y reduced-motion: «' + r2.h1 + '»');
  await p2.screenshot({ path: path.join(raiz, 'screenshots', '50-es-hero-390.png') });
  await ctx2.close();
} finally {
  await browser.close();
  srv.kill();
}
console.log('='.repeat(70));
console.log(ok + ' OK · ' + mal + ' FALLA(S)');
process.exit(mal ? 1 : 0);
