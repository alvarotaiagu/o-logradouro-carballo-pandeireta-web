/* Smoke test de las dos mejoras nuevas: anillo de progreso + nav de puntos. */
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

const srv = spawn(process.execPath, [path.join(raiz, 'scripts', 'servir.mjs'), String(puerto)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 400));

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base + '/', { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('cortina').classList.contains('fuera'), { timeout: 8000 });
  await page.waitForTimeout(400);

  // anillo arranca prácticamente vacío (recién entramos al hero)
  const off0 = await page.$eval('.pandeireta-boton__progreso', (el) => getComputedStyle(el).strokeDashoffset);
  const largo0 = await page.$eval('.pandeireta-boton__progreso', (el) => getComputedStyle(el).strokeDasharray);
  comprobar(off0 !== '' && off0 !== '0px', 'anillo de progreso tiene dashoffset inicial (' + off0 + ' de ' + largo0 + ')');

  // scroll hasta el fondo con la rueda (Lenis no responde a scrollTo), hasta que se estabilice
  let previo = -1, actual = 0;
  for (let i = 0; i < 200 && actual !== previo; i++) {
    previo = actual;
    await page.mouse.wheel(0, 1500);
    await page.waitForTimeout(50);
    actual = await page.evaluate(() => window.scrollY);
  }
  await page.waitForTimeout(800);

  const off1 = await page.$eval('.pandeireta-boton__progreso', (el) => getComputedStyle(el).strokeDashoffset);
  comprobar(parseFloat(off1) < 10, 'anillo casi lleno al llegar al final (offset final ' + off1 + ')');

  const activoAlFinal = await page.evaluate(() => { const el = document.querySelector('.seccion-nav a.activo'); return el ? el.dataset.seccion : null; });
  comprobar(activoAlFinal === 'horario', 'el punto "horario" queda activo al fondo de la página (salió: ' + activoAlFinal + ')');

  // click en el primer punto (hero) debe subir arriba del todo
  await page.click('.seccion-nav a[data-seccion="inicio"]', { force: true });
  await page.waitForTimeout(2200);
  const scrollY = await page.evaluate(() => window.scrollY);
  comprobar(scrollY < 80, 'clic en el punto "inicio" vuelve arriba (scrollY=' + scrollY + ')');

  const offVuelta = await page.$eval('.pandeireta-boton__progreso', (el) => getComputedStyle(el).strokeDashoffset);
  comprobar(parseFloat(offVuelta) > parseFloat(largo0.replace('px', '')) * 0.8, 'el anillo vuelve a vaciarse al subir (offset=' + offVuelta + ')');

  // reduced-motion: el anillo debe seguir moviéndose con el contenido (es info, no decoración)
  const page2 = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await page2.goto(base + '/', { waitUntil: 'load' });
  await page2.waitForFunction(() => document.getElementById('cortina').classList.contains('fuera'), { timeout: 8000 });
  await page2.waitForTimeout(400);
  let prev2 = -1, cur2 = 0;
  for (let i = 0; i < 200 && cur2 !== prev2; i++) {
    prev2 = cur2;
    await page2.mouse.wheel(0, 1500);
    await page2.waitForTimeout(40);
    cur2 = await page2.evaluate(() => window.scrollY);
  }
  await page2.waitForTimeout(400);
  const offReduce = await page2.$eval('.pandeireta-boton__progreso', (el) => getComputedStyle(el).strokeDashoffset);
  comprobar(parseFloat(offReduce) < 10, 'con reduced-motion el anillo también llega casi lleno al fondo (' + offReduce + ')');
  await page2.close();

  // mobile: el nav de puntos se oculta (el hueco es del menú hamburguesa)
  const page3 = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page3.goto(base + '/', { waitUntil: 'load' });
  await page3.waitForTimeout(2500);
  const visibleMovil = await page3.$eval('.seccion-nav', (el) => getComputedStyle(el).display !== 'none');
  comprobar(!visibleMovil, 'en móvil (390px) el nav de puntos está oculto');
  await page3.close();
} finally {
  await browser.close();
  srv.kill();
}

console.log('='.repeat(70));
console.log(ok + ' OK · ' + mal + ' FALLA(S)');
process.exit(mal ? 1 : 0);
