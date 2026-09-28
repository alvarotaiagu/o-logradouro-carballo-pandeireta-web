/* Pone ?v=<huella del contenido> a css/estilos.css y js/main.js en todas las
   páginas. GitHub Pages sirve con max-age=600: sin esto, tras publicar, el
   navegador mezcla durante 10 minutos el HTML nuevo con el CSS/JS viejos.
   Ejecutar antes de cada commit que toque CSS o JS:  node scripts/versionar.mjs */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const recursos = ['css/estilos.css', 'js/main.js'];
const huellas = Object.fromEntries(recursos.map((r) => [r, crypto.createHash('sha1').update(fs.readFileSync(path.join(raiz, r))).digest('hex').slice(0, 8)]));

for (const pagina of fs.readdirSync(raiz).filter((f) => f.endsWith('.html'))) {
  const ruta = path.join(raiz, pagina);
  let html = fs.readFileSync(ruta, 'utf8');
  const antes = html;
  for (const r of recursos) {
    const re = new RegExp('(["\'])' + r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\?v=[0-9a-f]+)?(["\'])', 'g');
    html = html.replace(re, '$1' + r + '?v=' + huellas[r] + '$3');
  }
  if (html !== antes) { fs.writeFileSync(ruta, html); console.log('versionado', pagina); }
}
console.log(huellas);
