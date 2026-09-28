/* Smoke test de las mejoras añadidas tras la entrega: anillo de progreso, nav
   de puntos, contador de coplas (+ píldora de móvil), pulso del cursor en el
   golpe, latido del estado «aberto», marquee que acelera con el scroll y
   vibración táctil. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(__dirname, '..');
const puerto = 4312;
const base = 'http://127.0.0.1:' + puerto;

let ok = 0, mal = 0;
function comprobar(cond, msg) {
  console.log((cond ? 'OK    ' : 'FALLA ') + '· ' + msg);
  if (cond) ok++; else mal++;
}

function romano(n) {
  const vals = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [v, s] of vals) while (n >= v) { out += s; n -= v; }
  return out;
}

async function esperarCortina(page) {
  await page.waitForFunction(() => document.getElementById('cortina').classList.contains('fuera'), { timeout: 8000 });
  await page.waitForTimeout(400);
}

/* rueda hasta pasar una y concreta */
async function bajarHasta(page, hasta, paso = 120) {
  let y = await page.evaluate(() => scrollY);
  for (let i = 0; i < 400 && y < hasta - 5; i++) {
    await page.mouse.wheel(0, Math.min(paso, hasta - y));
    await page.waitForTimeout(50);
    y = await page.evaluate(() => scrollY);
  }
  await page.waitForTimeout(1300);
}

function datosPin(page) {
  return page.evaluate(() => { const s = window.ScrollTrigger.getAll().find((s) => s.trigger && s.trigger.id === 'inicio'); return { start: s.start, end: s.end }; });
}

/* ya pasado el final del vuelo: la pandereta se quedó donde aterrizó y
   desde ahí sube con la página, así que se descuenta lo scrolleado de más */
function medirAterrizaje(page) {
  return page.evaluate(() => {
    const s = window.ScrollTrigger.getAll().find((s) => s.trigger && s.trigger.id === 'inicio');
    const pand = document.getElementById('pandeireta');
    const a = pand.getBoundingClientRect();
    const c = document.getElementById('pandeireta-boton').getBoundingClientRect();
    const extra = window.scrollY - s.end;
    const escala = window.gsap.getProperty(pand, 'scale');
    const aroPand = parseFloat(getComputedStyle(pand).width) * escala * (471 / 520);
    const aroBoton = c.width * (111 / 120);
    return { dx: Math.abs((a.x + a.width / 2) - (c.x + c.width / 2)), dy: Math.abs((a.y + a.height / 2) + extra - (c.y + c.height / 2)), dAro: Math.abs(aroPand - aroBoton), progreso: s.progress };
  });
}

/* ¿hay contenido en pantalla o un hueco vacío? distancia del final del texto
   del hero al principio de «A casa», y si «A casa» ya asoma */
function huecoHero(page) {
  return page.evaluate(() => {
    const m = document.querySelector('.hero__marco').getBoundingClientRect();
    const c = document.querySelector('.casa__datos').getBoundingClientRect();
    return { hueco: Math.round(c.top - m.bottom), casaAsoma: c.top < window.innerHeight, alto: window.innerHeight };
  });
}

/* ¿qué elemento hay de verdad en el centro del botón atracado? */
function botonSinTapar(page) {
  return page.evaluate(() => {
    const b = document.getElementById('pandeireta-boton');
    const r = b.getBoundingClientRect();
    const arriba = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!arriba && b.contains(arriba) && b.classList.contains('visible');
  });
}

/* contraste REAL de un punto del nav: se hace captura del recorte y se lee
   el píxel central (punto) y una esquina (fondo) con un canvas en la página */
async function contrastePunto(page) {
  const r = await page.$eval('.seccion-nav a span', (el) => { const b = el.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
  const png = await page.screenshot({ clip: { x: r.x - 10, y: r.y - 10, width: 20, height: 20 } });
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const px = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3));
    const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const punto = px(Math.floor(img.width / 2), Math.floor(img.height / 2));
    const fondo = px(1, 1);
    const [l1, l2] = [lum(punto), lum(fondo)].sort((a, b) => b - a);
    return { punto, fondo, ratio: (l1 + 0.05) / (l2 + 0.05) };
  }, png.toString('base64'));
}

/* rueda hasta que el scroll deja de moverse (Lenis no responde a scrollTo) */
async function bajarAlFondo(page, paso = 1500) {
  let previo = -1, actual = 0;
  for (let i = 0; i < 200 && actual !== previo; i++) {
    previo = actual;
    await page.mouse.wheel(0, paso);
    await page.waitForTimeout(50);
    actual = await page.evaluate(() => window.scrollY);
  }
  await page.waitForTimeout(800);
}

const srv = spawn(process.execPath, [path.join(raiz, 'scripts', 'servir.mjs'), String(puerto)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 400));

const browser = await chromium.launch();
try {
  /* ═════════ cortina ═════════ */
  const pc = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await pc.addInitScript(() => {
    /* tirón de 700 ms en cuanto existe el clon: el aro no puede aparecer ya dibujado */
    document.addEventListener('DOMContentLoaded', () => {
      const iv = setInterval(() => {
        if (!document.querySelector('.cortina__svg')) return;
        clearInterval(iv);
        requestAnimationFrame(() => {
          const t = performance.now();
          while (performance.now() - t < 700) {}
          /* se mide dentro de la página 60 ms después: el 'load' de Playwright
             llega mucho más tarde (fuentes, imágenes) y el aro ya estaría hecho */
          setTimeout(() => {
            const aro = document.querySelector('.cortina__svg .pandeireta__aro');
            window.__trasTiron = {
              clon: !!aro,
              heroOculta: getComputedStyle(document.getElementById('pandeireta')).visibility === 'hidden',
              dibujado: 1 - parseFloat(getComputedStyle(aro).strokeDashoffset) / parseFloat(getComputedStyle(aro).strokeDasharray)
            };
          }, 60);
        });
      }, 5);
    });
  });
  await pc.goto(base + '/', { waitUntil: 'load' });
  await pc.waitForFunction(() => window.__trasTiron, { timeout: 5000 });
  const c1 = await pc.evaluate(() => window.__trasTiron);
  comprobar(c1.clon && c1.heroOculta, 'cortina: monta el clon de la pandereta y oculta la del hero mientras dura');
  comprobar(c1.dibujado < 0.5, 'cortina: tras un tirón de 700 ms el aro no aparece ya dibujado (' + (c1.dibujado * 100).toFixed(0) + ' %)');
  await pc.waitForFunction(() => /A/.test(document.getElementById('cortina-relleno').getAttribute('d') || ''), { timeout: 6000 });
  const agujero = await pc.evaluate(() => ({ fondo: getComputedStyle(document.getElementById('cortina')).backgroundColor }));
  comprobar(agujero.fondo === 'rgba(0, 0, 0, 0)', 'cortina: la onda abre un agujero real en el muro (capa transparente, no un fondo opaco encima)');
  await pc.waitForFunction(() => document.getElementById('cortina').classList.contains('fuera'), { timeout: 8000 });
  const c2 = await pc.evaluate(() => ({ clonFuera: !document.querySelector('.cortina__svg'), heroVisible: getComputedStyle(document.getElementById('pandeireta')).visibility === 'visible' }));
  comprobar(c2.clonFuera && c2.heroVisible, 'cortina: al retirarse quita el clon y la pandereta del hero vuelve a verse');
  await pc.close();

  /* ═════════ escritorio ═════════ */
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base + '/', { waitUntil: 'load' });
  await esperarCortina(page);

  const off0 = await page.$eval('.pandeireta-boton__progreso', (el) => getComputedStyle(el).strokeDashoffset);
  const largo0 = await page.$eval('.pandeireta-boton__progreso', (el) => getComputedStyle(el).strokeDasharray);
  comprobar(off0 !== '' && off0 !== '0px', 'anillo de progreso tiene dashoffset inicial (' + off0 + ' de ' + largo0 + ')');

  // cursor: el aro late al tocar la pandereta
  const caja = await page.$eval('#pandeireta', (el) => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await page.mouse.move(caja.x - 30, caja.y - 30);
  await page.mouse.move(caja.x, caja.y, { steps: 5 });
  await page.waitForTimeout(250);
  await page.mouse.click(caja.x, caja.y);
  await page.waitForTimeout(90);
  const escalaCursor = await page.evaluate(() => window.gsap.getProperty(document.querySelector('.cursor'), 'scale'));
  comprobar(escalaCursor > 1.1, 'el aro del cursor late con el golpe (scale=' + Number(escalaCursor).toFixed(2) + ')');
  await page.waitForTimeout(500);
  const escalaReposo = await page.evaluate(() => window.gsap.getProperty(document.querySelector('.cursor'), 'scale'));
  comprobar(Math.abs(escalaReposo - 1) < 0.02, 'y vuelve a su tamaño (scale=' + Number(escalaReposo).toFixed(2) + ')');

  // vuelo del hero: aterriza sobre el botón, el texto no desaparece, el botón no queda tapado
  const pin = await datosPin(page);
  const fijado = await page.evaluate(() => !!document.getElementById('inicio').closest('.pin-spacer'));
  comprobar(!fijado, 'el hero no se fija: la página sigue avanzando mientras vuela la pandereta');
  await bajarHasta(page, pin.start + (pin.end - pin.start) * 0.5);
  const opTexto = await page.$eval('.hero__marco', (el) => getComputedStyle(el).opacity);
  comprobar(opTexto === '1', 'el texto del hero sigue visible durante el vuelo (opacity ' + opTexto + ')');
  await bajarHasta(page, pin.end + 40, 60);
  const at = await medirAterrizaje(page);
  comprobar(at.dx < 2 && at.dy < 2 && at.dAro < 2, 'la pandereta aterriza exactamente sobre el botón (Δx ' + at.dx.toFixed(1) + ', Δy ' + at.dy.toFixed(1) + ', Δaro ' + at.dAro.toFixed(1) + ' px)');
  const hh = await huecoHero(page);
  comprobar(hh.casaAsoma && hh.hueco < hh.alto * 0.35, 'al acabar el vuelo «A casa» ya está en pantalla y el hueco es corto (' + hh.hueco + ' px de ' + hh.alto + ')');
  await bajarHasta(page, pin.end + 200);
  comprobar(await botonSinTapar(page), 'la pandereta atracada se ve: en su centro no hay otra cosa encima');
  const solape = await page.evaluate(() => {
    const a = document.getElementById('pandeireta-boton').getBoundingClientRect();
    const t = document.querySelector('.cabecera__tel').getBoundingClientRect();
    return t.right > a.left - 4;
  });
  comprobar(!solape, 'el teléfono de la cabecera se aparta y no toca la pandereta');
  await page.click('#pandeireta-boton');
  await page.waitForTimeout(700);
  const menuAbierto = await page.evaluate(() => ({ clase: document.getElementById('cabecera').classList.contains('menu-abierto'), aria: document.getElementById('pandeireta-boton').getAttribute('aria-expanded'), navOculto: getComputedStyle(document.querySelector('.seccion-nav')).visibility === 'hidden' }));
  comprobar(menuAbierto.clase && menuAbierto.aria === 'true', 'pulsar la pandereta abre el menú (aria-expanded=' + menuAbierto.aria + ')');
  comprobar(menuAbierto.navOculto, 'con el menú abierto los puntos del nav se ocultan');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  const menuCerrado = await page.evaluate(() => !document.getElementById('cabecera').classList.contains('menu-abierto') && document.getElementById('pandeireta-boton').getAttribute('aria-expanded') === 'false');
  comprobar(menuCerrado, 'Escape lo cierra y la pandereta vuelve a aria-expanded=false');

  // marquee: mismo espacio texto→siguiente texto dentro de una copia y entre copias
  const huecos = await page.evaluate(() => {
    const pista = document.getElementById('marquee-1');
    const spans = Array.from(pista.querySelectorAll('span')).slice(0, 40);
    const out = [];
    for (let i = 0; i < spans.length - 1; i++) {
      const rg = document.createRange();
      rg.selectNodeContents(spans[i].firstChild);
      const finTexto = rg.getBoundingClientRect().right;
      out.push(Math.round(spans[i + 1].getBoundingClientRect().left - finTexto));
    }
    return out;
  });
  comprobar(Math.max(...huecos) - Math.min(...huecos) <= 1, 'marquee: el punto queda a la misma distancia entre todas las palabras (huecos ' + Math.min(...huecos) + '–' + Math.max(...huecos) + ' px)');

  // nav de puntos: contraste real sobre sección oscura y sobre la carta (piel)
  const cOscura = await contrastePunto(page);
  comprobar(cOscura.ratio >= 3, 'punto del nav sobre fondo oscuro: ' + cOscura.ratio.toFixed(2) + ':1 (mín. 3:1 de componente de interfaz)');
  const yCarta = await page.evaluate(() => document.getElementById('carta').getBoundingClientRect().top + scrollY + 500);
  await bajarHasta(page, yCarta, 400);
  const cClara = await contrastePunto(page);
  comprobar(cClara.ratio >= 3, 'punto del nav sobre la carta (piel): ' + cClara.ratio.toFixed(2) + ':1 — punto ' + cClara.punto + ' / fondo ' + cClara.fondo);
  comprobar(await botonSinTapar(page), 'sobre la carta la pandereta atracada sigue viéndose');

  // marquee: velocidad media por frame, quieto vs con scroll
  await page.evaluate(() => {
    window.__muestra = (ms) => new Promise((res) => {
      const el = document.getElementById('marquee-1');
      let prev = null, suma = 0, n = 0;
      const t0 = performance.now();
      (function f() {
        const m = /translate3d\(([-\d.]+)px/.exec(el.style.transform);
        const x = m ? parseFloat(m[1]) : 0;
        if (prev !== null) { const d = prev - x; if (d > 0 && d < 200) { suma += d; n++; } }
        prev = x;
        if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(n ? suma / n : 0);
      })();
    });
  });
  await page.waitForTimeout(600);
  const vQuieto = await page.evaluate(() => window.__muestra(700));
  const muestra = page.evaluate(() => window.__muestra(700));
  for (let i = 0; i < 16; i++) { await page.mouse.wheel(0, 260); await page.waitForTimeout(40); }
  const vScroll = await muestra;
  comprobar(vScroll > vQuieto * 1.5, 'el marquee acelera con el scroll (' + vQuieto.toFixed(2) + ' → ' + vScroll.toFixed(2) + ' px/frame)');
  await page.waitForTimeout(1500);
  const vVuelta = await page.evaluate(() => window.__muestra(600));
  comprobar(vVuelta < vQuieto * 1.3, 'y vuelve a su ritmo al parar (' + vVuelta.toFixed(2) + ' px/frame)');

  // contador de coplas en la cabecera sticky
  const coplas = await page.$$eval('.copla', (els) => els.length);
  const numPrimera = await page.$eval('.copla__num', (el) => el.textContent.trim());
  comprobar(numPrimera === 'Copla I de ' + romano(coplas), 'la cabecera de la copla lleva el total: «' + numPrimera + '» (' + coplas + ' coplas)');

  // estado «aberto»: mostaza + latido; pechado: sin latido
  const estado = await page.evaluate(() => {
    const el = document.getElementById('estado');
    const i = el.querySelector('i');
    const antes = el.classList.contains('abierto');
    el.classList.add('abierto');
    const abierto = { fondo: getComputedStyle(i).backgroundColor, anim: getComputedStyle(i, '::before').animationName, anim2: getComputedStyle(i, '::after').animationName };
    el.classList.remove('abierto');
    const cerrado = { anim: getComputedStyle(i, '::before').animationName };
    el.classList.toggle('abierto', antes);
    return { abierto, cerrado };
  });
  comprobar(estado.abierto.fondo === 'rgb(233, 185, 73)', 'estado aberto: punto mostaza de la paleta (' + estado.abierto.fondo + ')');
  comprobar(estado.abierto.anim === 'latido' && estado.abierto.anim2 === 'latido-debil', 'estado aberto: latido fuerte + débil (' + estado.abierto.anim + ' / ' + estado.abierto.anim2 + ')');
  comprobar(estado.cerrado.anim === 'none', 'estado pechado: sin latido (' + estado.cerrado.anim + ')');

  // anillo + punto activo al fondo
  await bajarAlFondo(page);
  const off1 = await page.$eval('.pandeireta-boton__progreso', (el) => getComputedStyle(el).strokeDashoffset);
  comprobar(parseFloat(off1) < 10, 'anillo casi lleno al llegar al final (offset final ' + off1 + ')');
  const activoAlFinal = await page.evaluate(() => { const el = document.querySelector('.seccion-nav a.activo'); return el ? el.dataset.seccion : null; });
  comprobar(activoAlFinal === 'horario', 'el punto "horario" queda activo al fondo de la página (salió: ' + activoAlFinal + ')');

  await page.click('.seccion-nav a[data-seccion="inicio"]', { force: true });
  await page.waitForTimeout(2200);
  const scrollY = await page.evaluate(() => window.scrollY);
  comprobar(scrollY < 80, 'clic en el punto "inicio" vuelve arriba (scrollY=' + scrollY + ')');
  const offVuelta = await page.$eval('.pandeireta-boton__progreso', (el) => getComputedStyle(el).strokeDashoffset);
  comprobar(parseFloat(offVuelta) > parseFloat(largo0) * 0.8, 'el anillo vuelve a vaciarse al subir (offset=' + offVuelta + ')');
  await page.close();

  /* ═════════ reduced-motion ═════════ */
  const page2 = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await page2.goto(base + '/', { waitUntil: 'load' });
  await esperarCortina(page2);
  await bajarAlFondo(page2);
  const offReduce = await page2.$eval('.pandeireta-boton__progreso', (el) => getComputedStyle(el).strokeDashoffset);
  comprobar(parseFloat(offReduce) < 10, 'con reduced-motion el anillo también llega casi lleno al fondo (' + offReduce + ')');
  await page2.close();

  /* ═════════ móvil: nav oculto + píldora de copla ═════════ */
  const page3 = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page3.addInitScript(() => { try { localStorage.setItem('logradouro-cookies', 'ok'); } catch (e) {} });
  await page3.goto(base + '/', { waitUntil: 'load' });
  await esperarCortina(page3);
  const visibleMovil = await page3.$eval('.seccion-nav', (el) => getComputedStyle(el).display !== 'none');
  comprobar(!visibleMovil, 'en móvil (390px) el nav de puntos está oculto');
  const pildoraAntes = await page3.$eval('#copla-actual', (el) => el.classList.contains('visible'));
  comprobar(!pildoraAntes, 'la píldora de copla no se ve en el hero');

  const pinM = await datosPin(page3);
  await bajarHasta(page3, pinM.end + 40, 60);
  const atM = await medirAterrizaje(page3);
  comprobar(atM.dx < 2 && atM.dy < 2 && atM.dAro < 2, 'móvil: la pandereta aterriza exactamente sobre el botón (Δx ' + atM.dx.toFixed(1) + ', Δy ' + atM.dy.toFixed(1) + ', Δaro ' + atM.dAro.toFixed(1) + ' px)');
  const hhM = await huecoHero(page3);
  comprobar(hhM.casaAsoma && hhM.hueco < hhM.alto * 0.35, 'móvil: al acabar el vuelo «A casa» ya está en pantalla y el hueco es corto (' + hhM.hueco + ' px de ' + hhM.alto + ')');
  await bajarHasta(page3, pinM.end + 200);
  const hamb = await page3.$eval('#hamburguesa', (el) => getComputedStyle(el).visibility);
  comprobar(hamb === 'hidden' && await botonSinTapar(page3), 'móvil: la pandereta atracada sustituye a la hamburguesa y se ve (hamburguesa ' + hamb + ')');

  let pildora = null;
  for (let i = 0; i < 80; i++) {
    await page3.mouse.wheel(0, 500);
    await page3.waitForTimeout(60);
    pildora = await page3.$eval('#copla-actual', (el) => ({ visible: el.classList.contains('visible'), num: el.querySelector('.copla-actual__num').textContent, tit: el.querySelector('.copla-actual__tit').textContent, opacidad: getComputedStyle(el).opacity }));
    if (pildora.visible && pildora.num) break;
  }
  comprobar(pildora.visible && /^Copla [IVX]+ de XI$/.test(pildora.num) && pildora.tit.length > 0, 'en la carta aparece la píldora: «' + pildora.num + ' · ' + pildora.tit + '»');
  await page3.waitForTimeout(1200); // que se asiente la inercia de Lenis y el fundido
  await page3.screenshot({ path: path.join(raiz, 'screenshots', '40-pildora-copla-390.png') });

  await bajarAlFondo(page3);
  const pildoraFin = await page3.$eval('#copla-actual', (el) => el.classList.contains('visible'));
  comprobar(!pildoraFin, 'la píldora se retira al salir de la carta');
  await page3.close();

  /* ═════════ táctil: vibración ═════════ */
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => {
    try { localStorage.setItem('logradouro-cookies', 'ok'); } catch (e) {}
    window.__vib = [];
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: (p) => { window.__vib.push(p); return true; } });
  });
  const page4 = await ctx.newPage();
  await page4.goto(base + '/', { waitUntil: 'load' });
  await esperarCortina(page4);
  await page4.tap('#pandeireta');
  await page4.waitForTimeout(150);
  const vibToque = await page4.evaluate(() => window.__vib.slice());
  comprobar(vibToque.length >= 1, 'tocar la pandereta en móvil vibra (' + JSON.stringify(vibToque) + ')');

  await page4.evaluate(() => { window.__vib.length = 0; });
  for (let i = 0; i < 12; i++) { await page4.mouse.wheel(0, 600); await page4.waitForTimeout(80); }
  await page4.waitForTimeout(600);
  const vibScrollSinSon = await page4.evaluate(() => window.__vib.length);
  comprobar(vibScrollSinSon === 0, 'con el son apagado, los golpes de sección NO vibran (' + vibScrollSinSon + ' llamadas)');
  await page4.close();

  const page5 = await ctx.newPage();
  await page5.goto(base + '/', { waitUntil: 'load' });
  await esperarCortina(page5);
  await page5.tap('#boton-son');
  await page5.evaluate(() => { window.__vib.length = 0; });
  for (let i = 0; i < 12; i++) { await page5.mouse.wheel(0, 600); await page5.waitForTimeout(80); }
  await page5.waitForTimeout(600);
  const vibScrollConSon = await page5.evaluate(() => window.__vib.length);
  comprobar(vibScrollConSon >= 1, 'con el son aceso, los golpes de sección vibran (' + vibScrollConSon + ' llamadas)');
  await ctx.close();

  /* ═════════ táctil + reduced-motion: nunca vibra ═════════ */
  const ctxR = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  await ctxR.addInitScript(() => {
    window.__vib = [];
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: (p) => { window.__vib.push(p); return true; } });
  });
  const page6 = await ctxR.newPage();
  await page6.goto(base + '/', { waitUntil: 'load' });
  await esperarCortina(page6);
  await page6.tap('#pandeireta');
  await page6.waitForTimeout(150);
  const vibReduce = await page6.evaluate(() => window.__vib.length);
  comprobar(vibReduce === 0, 'con reduced-motion tocar la pandereta no vibra (' + vibReduce + ' llamadas)');
  await ctxR.close();
} finally {
  await browser.close();
  srv.kill();
}

console.log('='.repeat(70));
console.log(ok + ' OK · ' + mal + ' FALLA(S)');
process.exit(mal ? 1 : 0);
