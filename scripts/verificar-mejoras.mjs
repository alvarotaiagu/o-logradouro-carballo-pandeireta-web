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
