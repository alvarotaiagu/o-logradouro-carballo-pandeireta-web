# O Logradouro · «Pandeireta»

Maqueta de una web para **O Logradouro**, taberna real en Rúa Lugo, 2, Carballo (A Coruña).
Concepto: **la web ES la pandereta sobre la que va pintado el logo real de la casa.** Noche,
ritmo y folclore galego sin gaita ni hórreo — la música en directo no tiene fecha confirmada,
así que el ritmo es solo visual, nunca una promesa de conciertos.

Sello de demo: repositorio de trabajo, `noindex` en todas las páginas, no publicado con dominio
propio del negocio.

## Cómo verla

```
node scripts/servir.mjs
```

y abrir `http://127.0.0.1:4310/` (hace falta servirla por HTTP: `fetch('data/carta.json')` no
funciona con doble clic sobre el archivo).

## Mapa de secciones

1. **Hero** — titular char-reveal, la pandereta grande (tocable, se inclina con el cursor), con
   el scroll se encoge y queda como botón fijo del menú.
2. **A casa** — tres datos grandes (dirección, días, horario) + marquee a dos velocidades con
   nombres reales de la carta.
3. **O cancioneiro** — la carta completa (68 platos, 11 secciones = 11 «Coplas» en romanos),
   pintada en vivo desde `data/carta.json`. Título sticky con indicador de compás (6 puntos, 1º
   y 4º marcados como en la muiñeira).
4. **Os destacados** — los 3 `destacados` de `carta.json`, a gran formato.
5. **Reseñas** — 4,6★ / 246 reseñas (verificado en Google Maps el 2026-09-28), con enlace real.
6. **Horario e onde** — horario en vivo (Europe/Madrid), aviso de desayunos, mapa por consentimiento.
7. **Pie** — lockup del logo real sobre piel de pandereta, Instagram y Facebook.

No hay sección «Ao vivo»: la música en directo no tiene fecha confirmada en ninguna fuente
propia del negocio (ver el informe de verificación entregado aparte). Dejar un hueco prometiendo
conciertos sin fecha real habría sido peor que no tener la sección.

## Reskinear esto para un cliente real

- **Datos y carta**: todo sale de `data/carta.json` (copia literal del `carta.json` del brief) y
  de las constantes de `js/main.js` → función `horario()` (turnos) y las direcciones/teléfono en
  `index.html`. Cambiar ahí, no en el HTML de cada sección.
- **Logo**: `assets/logo/*.svg` — vectorización real del logo a tinta (ver `DATOS-LOGRADOURO.md`
  del brief). Para otro negocio, sustituir por su propio logo vectorizado, misma nomenclatura de
  archivos (`fachada`, `rotulo`, `lockup`, `lockup-negativo`, `favicon`) si se reutiliza la
  plantilla, o rehacer el hero si el logo no tiene esta forma de «fachada + rótulo».
- **Paleta**: variables en la cabecera de `css/estilos.css` (`--noche`, `--piel`, `--lazo`,
  `--mostaza`, `--aro`). Los tokens `--lazo-sobre-piel`, `--lazo-sobre-noche`,
  `--mostaza-sobre-noche` están derivados con `color-mix()` para el contraste — no tocar sin
  volver a medir con `scripts/verificar.mjs`.
- **Sonido**: la síntesis de ferreñas está en `js/main.js` → `golpeSonido()`. No usa muestras de
  terceros, así que no hay que sustituir ningún archivo de audio.

## Quitar el mando de maqueta (obligatorio antes de publicar a un cliente)

El mando de densidad (abajo a la izquierda, solo visible con `?revision` en la URL) **no debe
viajar a producción**. Receta:

1. En `index.html`: borrar el script bloqueante del `<head>` marcado
   `[MANDO DE MAQUETA]`, el `<div class="mando" id="mando">` y las clases
   `sin-js`/`densidad-pandeireta` del `<html>` si ya no se usan para nada más.
2. En `css/estilos.css`: borrar el bloque `═ MANDO DE MAQUETA ═` y el bloque
   `═ DENSIDAD SOBRIA ═`.
3. En `js/main.js`: borrar la función `mandoMaqueta()` (bloque `[MANDO DE MAQUETA]`) y las
   referencias a `densidad-cambiada`.
4. En `privacidad.html`: quitar la fila `logradouro-densidad` de la tabla de almacenamiento.
5. Comprobar con:
   ```
   node scripts/comprobar-borrado.mjs
   ```
   Tiene que decir «Sin rastros del mando. Se puede entregar.». Ahora mismo, con el mando
   todavía puesto (así se entrega esta maqueta para que el cliente pueda comparar las dos
   densidades en la reunión), el script marca las líneas como «QUEDA» — eso es lo esperado.

## Verificación

```
node scripts/verificar.mjs
```

Levanta un servidor local, recorre el sitio con Playwright (rueda del ratón, no `scrollTo`,
porque el sitio usa Lenis) y comprueba: la cortina se retira siempre (normal / sin JS /
`prefers-reduced-motion` / con el CDN de GSAP-Lenis bloqueado), el aviso de cookies cierra de
verdad (`display:none` real, no solo `[hidden]`), el mapa solo carga tras un clic, el menú móvil
mide `100dvh` bajo la cabecera con `backdrop-filter`, las dos densidades, el cursor propio oculta
el nativo, el contraste de cada acento derivado (compuesto sobre su fondo real, no a ojo), los 6
casos de horario del brief, y que ningún precio en pantalla esté fuera de `data/carta.json`.
Capturas a 1440 y 390 en `screenshots/`.

## Créditos y fuentes de datos

- Dirección, teléfono, horario base y carta: `o-logradouro-bocetos/DATOS-LOGRADOURO.md` y
  `carta.json`, entregados por el cliente.
- Logo: vectorizado a partir de `o-logradouro-bocetos/logo-original.jpg` (foto real del dibujo a
  tinta sobre la pandereta), con corrección de perspectiva.
- Valoración, reseñas y horario re-verificados en vivo el **2026-09-28** directamente en Google
  Maps (búsqueda `O Logradouro Carballo`). Identidad de Instagram (`@ologradouro`) y Facebook
  (`/OLogradouro`) confirmada el mismo día por bio/dirección.
- Tipografías: Young Serif y Karla, Google Fonts.
- GSAP + ScrollTrigger + Lenis, servidos desde jsDelivr (nunca cdnjs, que no sirve Lenis).

Lista completa de `[VERIFICAR]` / `[PENDIENTE]` en el informe de entrega.
