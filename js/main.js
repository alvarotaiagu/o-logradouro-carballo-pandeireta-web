/* ═══════════════════════════════════════════════════════════════════════
   O Logradouro · «Pandeireta»
   La web ES la pandereta: cortina que golpea el parche, hero donde la
   pandereta se toca y se encoge hasta quedar como botón del menú, ferreñas
   que tintinean según la velocidad del scroll, y un golpe suave en cada
   cambio de sección. Sonido opcional, sintetizado con WebAudio, apagado
   por defecto.

   Banderas separadas a propósito (ver feedback_reduced_motion_content_vs_motion):
     gsapReady  → hay motor de animación (GSAP + ScrollTrigger + Lenis)
     movimiento → además el usuario NO pidió reducir el movimiento
   Lo que sincroniza CONTENIDO (horario, compás activo) se engancha a
   gsapReady a secas; lo puramente decorativo se engancha a movimiento.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esTactil = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var gsapReady = !!(window.gsap && window.ScrollTrigger);
  var movimiento = gsapReady && !reduce;
  var gsap = window.gsap;

  if (gsapReady) gsap.registerPlugin(window.ScrollTrigger);
  if (movimiento) html.classList.add('con-movimiento');

  /* ───────────────────────── idioma (galego / castellano / inglés) ─────────────────────────
     El HTML trae el galego (lo que se ve sin JS). El script del <head> ya
     decidió el idioma; aquí se traduce ANTES de partir los titulares. Los
     platos no se traducen: salen de carta.json tal como los escribe la casa
     (en inglés se avisa de ello). Las citas de las reseñas tampoco: son
     palabras de quien las firma. */
  var IDIOMAS = ['gl', 'es', 'en'];
  var idioma = IDIOMAS.indexOf(html.getAttribute('data-idioma')) > -1 ? html.getAttribute('data-idioma') : 'gl';
  var TXT = {
    'salto': { gl: 'Saltar ao contido', es: 'Saltar al contenido', en: 'Skip to content' },
    'nav.aria': { gl: 'Seccións', es: 'Secciones', en: 'Sections' },
    'nav.casa': { gl: 'A casa', es: 'La casa', en: 'The house' },
    'nav.cancioneiro': { gl: 'A carta', es: 'La carta', en: 'Menu' },
    'nav.destacados': { gl: 'Para empezar', es: 'Para empezar', en: 'Where to start' },
    'nav.resenas': { gl: 'Opinións', es: 'Reseñas', en: 'Reviews' },
    'nav.horario': { gl: 'Horario', es: 'Horario', en: 'Hours' },
    'menu.destacados': { gl: 'Para empezar', es: 'Para empezar', en: 'Where to start' },
    'menu.horario': { gl: 'Horario e onde', es: 'Horario y dónde', en: 'Hours & location' },
    'menu.chamar': { gl: 'Chamar · 637 08 50 37', es: 'Llamar · 637 08 50 37', en: 'Call · 637 08 50 37' },
    'menu.abrir': { gl: 'Abrir menú', es: 'Abrir menú', en: 'Open menu' },
    'menu.cerrar': { gl: 'Pechar menú', es: 'Cerrar menú', en: 'Close menu' },
    'ir.aria': { gl: 'Ir a unha sección', es: 'Ir a una sección', en: 'Go to a section' },
    'ir.inicio': { gl: 'Ir ao inicio', es: 'Ir al inicio', en: 'Go to the top' },
    'ir.casa': { gl: 'Ir a A casa', es: 'Ir a La casa', en: 'Go to The house' },
    'ir.cancioneiro': { gl: 'Ir á carta', es: 'Ir a la carta', en: 'Go to the menu' },
    'ir.destacados': { gl: 'Ir a Para empezar', es: 'Ir a Para empezar', en: 'Go to Where to start' },
    'ir.resenas': { gl: 'Ir a Opinións', es: 'Ir a Reseñas', en: 'Go to Reviews' },
    'ir.horario': { gl: 'Ir a Horario e onde', es: 'Ir a Horario y dónde', en: 'Go to Hours & location' },
    'hero.ubi': { gl: 'Taberna · Rúa Lugo, 2 · Carballo', es: 'Taberna · Rúa Lugo, 2 · Carballo', en: 'Tavern · Rúa Lugo, 2 · Carballo' },
    'hero.titular': { gl: 'Taberna de sempre, carta de agora.', es: 'Taberna de siempre, carta de ahora.', en: 'An old-school tavern with a menu of today.' },
    'hero.sub': { gl: 'Almorzos, tapas, raxo, tortilla á feira e hamburguesas no centro de Carballo. De mércores a domingo, das 10:00 á 1:00.', es: 'Desayunos, tapas, raxo, tortilla á feira y hamburguesas en el centro de Carballo. De miércoles a domingo, de 10:00 a 1:00.', en: 'Breakfast, tapas, raxo, tortilla á feira and burgers in the centre of Carballo. Wednesday to Sunday, 10:00 to 1:00.' },
    'hero.cta': { gl: 'Ver a carta', es: 'Ver la carta', en: 'See the menu' },
    'hero.nota': { gl: '4,6★ · 246 opinións en Google', es: '4,6★ · 246 reseñas en Google', en: '4.6★ · 246 reviews on Google' },
    'hero.pandeireta': { gl: 'Tocar a pandeireta', es: 'Tocar la pandereta', en: 'Play the tambourine' },
    'son.off': { gl: 'Son: apagado', es: 'Sonido: apagado', en: 'Sound: off' },
    'son.on': { gl: 'Son: aceso', es: 'Sonido: encendido', en: 'Sound: on' },
    'casa.dias': { gl: 'Mér–Dom', es: 'Mié–Dom', en: 'Wed–Sun' },
    'casa.pechado': { gl: 'luns e martes, pechado', es: 'lunes y martes, cerrado', en: 'closed Monday and Tuesday' },
    'casa.almorzos': { gl: 'almorzos ata as 13:00', es: 'desayunos hasta las 13:00', en: 'breakfast until 13:00' },
    'casa.texto': { gl: 'Raxo e zorza como sempre, e hamburguesas veganas tamén. Pola mañá, almorzos con nome de persona: o do avó, o da Meli, o de Antón.', es: 'Raxo y zorza como siempre, y también hamburguesas veganas. Por la mañana, almuerzos con nombre de persona: el do avó, el de Meli, el de Antón.', en: 'Raxo and zorza the way they have always been made, and vegan burgers too. In the morning, breakfasts named after people: do avó, Meli, Antón.' },
    'carta.h2': { gl: 'Todo o que hai na carta.', es: 'Todo lo que hay en la carta.', en: 'Everything on the menu.' },
    'carta.sub': { gl: '68 pratos. Se ves <code>—</code> no prezo, pregúntao na barra.', es: '68 platos. Si ves <code>—</code> en el precio, pregúntalo en la barra.', en: '68 dishes, named as the house writes them (in Spanish and Galician). Where the price shows <code>—</code>, ask at the bar.' },
    'carta.error': { gl: 'Non se puido cargar a carta.', es: 'No se pudo cargar la carta.', en: 'The menu could not be loaded.' },
    'carta.media': { gl: 'media', es: 'media', en: 'half' },
    'dest.h2': { gl: 'Se vés por primeira vez.', es: 'Si vienes por primera vez.', en: 'If it is your first time.' },
    'resenas.etq': { gl: 'opinións en Google', es: 'reseñas en Google', en: 'reviews on Google' },
    'resenas.ver': { gl: 'Ver en Google →', es: 'Ver en Google →', en: 'See on Google →' },
    'horario.h2': { gl: 'Onde e cando.', es: 'Dónde y cuándo.', en: 'Where and when.' },
    'horario.tabla': { gl: 'Horario semanal', es: 'Horario semanal', en: 'Weekly hours' },
    'horario.aviso': { gl: 'Almorzos ata as 13:00, con café con leite dobre e zume de laranxa natural.', es: 'Desayunos hasta las 13:00, con café con leche doble y zumo de naranja natural.', en: 'Breakfast until 13:00, with a double white coffee and fresh orange juice.' },
    'mapa.ver': { gl: 'Ver mapa', es: 'Ver mapa', en: 'Show map' },
    'mapa.titulo': { gl: 'Mapa: O Logradouro na Rúa Lugo, Carballo', es: 'Mapa: O Logradouro en la Rúa Lugo, Carballo', en: 'Map: O Logradouro on Rúa Lugo, Carballo' },
    'mapa.nota': { gl: 'Carga un iframe de Google Maps só ao premer aquí.', es: 'Carga un iframe de Google Maps solo al pulsar aquí.', en: 'Loads a Google Maps iframe only when you click here.' },
    'pie.aria': { gl: 'Redes e legal', es: 'Redes y legal', en: 'Social and legal' },
    'pie.aviso': { gl: 'Aviso legal', es: 'Aviso legal', en: 'Legal notice' },
    'pie.privacidade': { gl: 'Privacidade', es: 'Privacidad', en: 'Privacy' },
    'cookies.texto': { gl: 'Este sitio non usa cookies de seguimento. Só garda no teu navegador o idioma e que xa viches este aviso; se o pides, carga o mapa de Google, que si pon as súas. <a href="privacidad.html">Máis detalle</a>.', es: 'Este sitio no usa cookies de seguimiento. Solo guarda en tu navegador el idioma y que ya has visto este aviso; si lo pides, carga el mapa de Google, que sí pone las suyas. <a href="privacidad.html">Más detalle</a>.', en: 'This site uses no tracking cookies. It only stores your language and the fact that you have seen this notice in your browser; if you ask for it, it loads the Google map, which does set its own. <a href="privacidad.html">More details</a>.' },
    'cookies.ok': { gl: 'De acordo', es: 'De acuerdo', en: 'OK' }
  };
  function t(k) { var e = TXT[k]; return e ? (e[idioma] || e.gl) : k; }

  /* los titulares partidos (data-revelar) se rehacen aparte: aquí solo el
     texto; al cambiar de idioma en vivo, cambiarIdioma() los vuelve a partir */
  function traducir() {
    html.lang = idioma;
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (el) {
      if (!el.hasAttribute('data-revelar') || !el.querySelector('.palabra')) el.textContent = t(el.getAttribute('data-i18n'));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-html]'), function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html')); /* solo cadenas propias del diccionario */
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-attr]'), function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (par) {
        var p = par.split(':');
        el.setAttribute(p[0], t(p[1]));
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.idioma [data-idioma]'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-idioma') === idioma ? 'true' : 'false');
    });
  }
  if (idioma !== 'gl') traducir();
  else Array.prototype.forEach.call(document.querySelectorAll('.idioma [data-idioma]'), function (b) {
    b.setAttribute('aria-pressed', b.getAttribute('data-idioma') === 'gl' ? 'true' : 'false');
  });

  function alturaCabecera() {
    return parseFloat(getComputedStyle(html).getPropertyValue('--cab')) || 84;
  }

  function cuandoVisible(nodos, umbral, alEntrar) {
    if (!('IntersectionObserver' in window)) { nodos.forEach(alEntrar); return; }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        obs.unobserve(en.target);
        alEntrar(en.target);
      });
    }, { threshold: umbral });
    nodos.forEach(function (n) { obs.observe(n); });
  }

  /* ───────────────────────── Lenis ───────────────────────── */
  var lenis = null;
  var velocidadLenis = 0;
  var tUltimoScroll = 0;
  if (movimiento && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', function (e) {
      window.ScrollTrigger.update();
      velocidadLenis = Math.abs(e.velocity || 0);
      tUltimoScroll = performance.now();
    });
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    /* lagSmoothing(0) (lo que pide Lenis) se pone al retirar la cortina: con
       él activo, el tirón de la carga en frío hace que la cortina salte su
       trazado y el aro «aparece dibujado» (feedback_cortina_reloj_atascos) */
  }

  function irA(destino) {
    /* el hero está "pineado" por GSAP y se transforma/encoge al pasarlo: su
       rect deja de representar el principio de la página, así que ir a
       "#inicio" (logo, punto de nav) sube al 0 absoluto en vez de fiarse
       del elemento. */
    if (destino === '#inicio' || destino === document.getElementById('inicio')) {
      if (lenis) { lenis.scrollTo(0, { duration: 1.5 }); } else { window.scrollTo(0, 0); }
      return;
    }
    var desfase = -alturaCabecera() + 1;
    if (lenis) { lenis.scrollTo(destino, { offset: desfase, duration: 1.5 }); return; }
    var el = typeof destino === 'string' ? document.querySelector(destino) : destino;
    if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.pageYOffset + desfase);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id === '#' || !document.querySelector(id)) return;
    e.preventDefault();
    cerrarMenu();
    irA(id);
  });

  /* ───────────────────── titulares partidos (char-reveal) ───────────────────── */
  function partir(el) {
    var palabras = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.textContent = '';
    var piezas = [];
    palabras.forEach(function (palabra, i) {
      var caja = document.createElement('span');
      caja.className = 'palabra';
      caja.setAttribute('aria-hidden', 'true');
      var s = document.createElement('span');
      s.className = 'palabra-int';
      s.textContent = palabra;
      caja.appendChild(s);
      piezas.push(s);
      el.appendChild(caja);
      if (i < palabras.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return piezas;
  }

  function revelar(piezas) {
    gsap.to(piezas, { y: 0, duration: 1, ease: 'expo.out', stagger: 0.07 });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-revelar]'), function (el) {
    var piezas = partir(el);
    if (!movimiento) return;
    if (el.closest('.hero')) {
      document.addEventListener('cortina-abriendo', function () { revelar(piezas); }, { once: true });
      return;
    }
    cuandoVisible([el], 0.3, function () { revelar(piezas); });
  });

  /* cambio en vivo: textos, atributos y titulares partidos (que se vuelven a
     partir y se revelan al momento); lo que pinta el JS escucha 'idioma-cambiado' */
  function cambiarIdioma(l) {
    if (l === idioma || IDIOMAS.indexOf(l) < 0) return;
    idioma = l;
    html.setAttribute('data-idioma', l);
    try { localStorage.setItem('logradouro-idioma', l); } catch (e) {}
    if (/[?&]lang=/.test(location.search) && window.history && window.URL) {
      var u = new URL(location.href);
      u.searchParams.set('lang', l);
      history.replaceState(null, '', u);
    }
    traducir();
    Array.prototype.forEach.call(document.querySelectorAll('[data-revelar][data-i18n]'), function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
      var piezas = partir(el);
      if (movimiento) revelar(piezas);
    });
    document.dispatchEvent(new CustomEvent('idioma-cambiado'));
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.idioma [data-idioma]');
    if (b) cambiarIdioma(b.getAttribute('data-idioma'));
  });

  /* ───────────────── construir un par de ferreñas (nunca <use>: cada
     instancia necesita animarse por su cuenta) ───────────────── */
  var nsSVG = 'http://www.w3.org/2000/svg';
  function crearFerrena() {
    var g = document.createElementNS(nsSVG, 'g');
    g.setAttribute('class', 'ferrena');
    g.innerHTML =
      '<rect x="-16" y="-8" width="32" height="16" rx="3" fill="#2A241C"/>' +
      '<g class="ferrena__disco">' +
        '<ellipse cx="0" cy="-3.6" rx="14" ry="5.6" fill="#D6D1C4" stroke="#847E70" stroke-width="1.1"/>' +
        '<ellipse cx="0" cy="3.6" rx="14" ry="5.6" fill="#BEB8AA" stroke="#736D60" stroke-width="1.1"/>' +
        '<circle r="2" fill="#4a463e"/>' +
      '</g>';
    return g;
  }
  function repartirFerrenas(grupo, n, cx, cy, radio, escala) {
    var lista = [];
    for (var i = 0; i < n; i++) {
      var ang = (360 / n) * i - 90;
      var f = crearFerrena();
      var rad = ang * Math.PI / 180;
      var x = cx + Math.cos(rad) * radio;
      var y = cy + Math.sin(rad) * radio;
      f.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + (ang + 90).toFixed(1) + ')' + (escala ? ' scale(' + escala + ')' : ''));
      grupo.appendChild(f);
      lista.push(f);
    }
    return lista;
  }

  var ferrenasHero = repartirFerrenas(document.getElementById('aro-ferrenas'), 10, 260, 260, 234);

  /* ───────────────── WebAudio: ferreñas sintetizadas, sin muestras ───────────────── */
  var actx = null;
  var sonidoActivo = false; /* apagado por defecto siempre, también con reduced-motion */

  function contexto() {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }

  function golpeSonido(intensidad) {
    if (!sonidoActivo) return;
    var ctx = contexto();
    if (!ctx) return;
    intensidad = Math.max(0.15, Math.min(1, intensidad || 0.6));
    var dur = 0.16;
    var buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    var datos = buffer.getChannelData(0);
    for (var i = 0; i < datos.length; i++) datos[i] = (Math.random() * 2 - 1) * (1 - i / datos.length);
    var fuente = ctx.createBufferSource();
    fuente.buffer = buffer;
    var filtro = ctx.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.frequency.value = 3200 + Math.random() * 2400;
    filtro.Q.value = 1.1;
    var ganancia = ctx.createGain();
    ganancia.gain.setValueAtTime(0.0001, ctx.currentTime);
    ganancia.gain.linearRampToValueAtTime(0.5 * intensidad, ctx.currentTime + 0.008);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    fuente.connect(filtro).connect(ganancia).connect(ctx.destination);
    fuente.start();
    fuente.stop(ctx.currentTime + dur + 0.02);
  }

  function vibrar(ms) {
    if (!esTactil || reduce || !navigator.vibrate) return;
    try { navigator.vibrate(ms); } catch (e) {}
  }

  /* un «golpe» de compás: sonido (si está aceso), vibración y aviso al cursor.
     Los toques directos vibran siempre; los golpes que dispara el scroll solo
     con el son aceso, para no zumbar el móvil sin haberlo pedido. */
  function emitirGolpe(intensidad, directo) {
    golpeSonido(intensidad);
    if (directo || sonidoActivo) vibrar(intensidad >= 0.5 ? 14 : 8);
    document.dispatchEvent(new CustomEvent('golpe-compas', { detail: { intensidad: intensidad } }));
  }

  (function botonSon() {
    var btn = document.getElementById('boton-son');
    var txt = document.getElementById('boton-son-texto');
    if (!btn) return;
    function rotular() { if (txt) txt.textContent = t(sonidoActivo ? 'son.on' : 'son.off'); }
    rotular();
    document.addEventListener('idioma-cambiado', rotular);
    btn.addEventListener('click', function () {
      sonidoActivo = !sonidoActivo;
      btn.setAttribute('aria-pressed', sonidoActivo ? 'true' : 'false');
      rotular();
      if (sonidoActivo) { contexto(); golpeSonido(0.7); }
    });
  })();

  /* ───────────────── cortina: la pandereta se monta, golpe, y la onda
     del golpe descubre la página mientras la pandereta vuela a su sitio ─────────────────
     1. Negro con un foco cálido. El aro se traza desde arriba y cada par de
        ferreñas se coloca cuando pasa el trazo; el parche se tensa, el dibujo
        de la fachada se imprime de arriba abajo y el rótulo de izquierda a
        derecha; caen los lazos.
     2. Golpe seco: el parche se hunde, la pandereta tiembla, las ferreñas
        vibran, un destello recorre el parche.
     3. La onda sale del golpe con tres anillos de sonido en su borde y abre
        un agujero en el muro que descubre la página; a la vez la pandereta
        (un clon exacto de la del hero) aterriza sobre la de verdad. */
  (function cortina() {
    var cort = document.getElementById('cortina');
    if (!cort) return;
    var muro = document.getElementById('cortina-muro');
    var relleno = document.getElementById('cortina-relleno');
    var ondas = Array.prototype.slice.call(document.querySelectorAll('#cortina-ondas circle'));
    var luz = document.getElementById('cortina-luz');
    var vuelo = document.getElementById('cortina-vuelo');
    var pie = document.getElementById('cortina-pie');
    var heroSvg = document.getElementById('pandeireta');
    var hecho = false, abierto = false;

    /* el hero empieza a revelarse cuando la onda empieza a abrir, no al final */
    function abrir() {
      if (abierto) return;
      abierto = true;
      document.dispatchEvent(new CustomEvent('cortina-abriendo'));
    }
    function retirar() {
      if (hecho) return;
      hecho = true;
      abrir();
      cort.classList.add('fuera');
      if (vuelo) vuelo.innerHTML = '';
      if (heroSvg) heroSvg.style.removeProperty('visibility');
      document.body.style.removeProperty('overflow');
      if (lenis) { gsap.ticker.lagSmoothing(0); lenis.start(); }
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      document.dispatchEvent(new CustomEvent('cortina-retirada'));
    }

    if (!movimiento || !heroSvg || !vuelo) {
      setTimeout(retirar, reduce ? 250 : 120);
      return;
    }

    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    /* un tirón de carga cuenta como 1/30 s: el trazado no se salta */
    gsap.ticker.lagSmoothing(100, 33);

    /* ── clon de la pandereta del hero (ids renombrados para no chocar) ── */
    var clon = heroSvg.cloneNode(true);
    ['id', 'role', 'tabindex', 'aria-label', 'data-i18n-attr', 'style'].forEach(function (a) { clon.removeAttribute(a); });
    clon.setAttribute('class', 'cortina__svg');
    clon.setAttribute('aria-hidden', 'true');
    Array.prototype.forEach.call(clon.querySelectorAll('[id]'), function (n) { n.id = n.id + '-cortina'; });
    Array.prototype.forEach.call(clon.querySelectorAll('[fill^="url(#"]'), function (n) {
      n.setAttribute('fill', n.getAttribute('fill').replace(')', '-cortina)'));
    });
    vuelo.appendChild(clon);
    heroSvg.style.visibility = 'hidden';

    var q = function (s) { return clon.querySelector(s); };
    var qa = function (s) { return Array.prototype.slice.call(clon.querySelectorAll(s)); };
    var aroBanda = q('.pandeireta__aro');
    var filos = qa('.pandeireta__filo');
    var sombra = q('.pandeireta__sombra');
    var parche = q('.pandeireta__parche');
    var vetas = q('.pandeireta__vetas');
    var fachada = q('.pandeireta__fachada');
    var rotulo = q('.pandeireta__rotulo');
    var lazos = q('.lazos');
    var ferrenas = qa('.ferrena');
    var discos = qa('.ferrena .ferrena__disco');
    var defs = q('defs');

    /* tinta: dos clipPath que crecen (la fachada de arriba abajo, el rótulo de izquierda a derecha) */
    function recorte(id, x, y, ancho, alto) {
      var cp = document.createElementNS(nsSVG, 'clipPath');
      cp.setAttribute('id', id);
      var r = document.createElementNS(nsSVG, 'rect');
      r.setAttribute('x', x); r.setAttribute('y', y); r.setAttribute('width', ancho); r.setAttribute('height', alto);
      cp.appendChild(r);
      defs.appendChild(cp);
      return r;
    }
    var tintaF = recorte('tinta-fachada-cortina', 168, 90, 184, 0);
    var tintaR = recorte('tinta-rotulo-cortina', 104, 292, 0, 98);
    fachada.setAttribute('clip-path', 'url(#tinta-fachada-cortina)');
    rotulo.setAttribute('clip-path', 'url(#tinta-rotulo-cortina)');

    var destello = document.createElementNS(nsSVG, 'circle');
    destello.setAttribute('cx', 260); destello.setAttribute('cy', 260); destello.setAttribute('r', 207);
    destello.setAttribute('fill', 'none'); destello.setAttribute('stroke', '#E9B949'); destello.setAttribute('stroke-width', 6);
    destello.setAttribute('opacity', 0);
    clon.appendChild(destello);

    /* ── medidas: la pandereta de la cortina se monta en el centro, a tamaño
       de cortina, y viaja hasta el rect de la del hero ── */
    var w = 0, h = 0;
    var ancho = heroSvg.getBoundingClientRect().width || 420;
    var tamCortina = Math.min(window.innerWidth * 0.46, 320);
    var centro = { x: window.innerWidth / 2, y: window.innerHeight * 0.44 };
    vuelo.style.width = ancho + 'px';
    vuelo.style.height = ancho + 'px';
    gsap.set(vuelo, { x: centro.x - ancho / 2, y: centro.y - ancho / 2, scale: tamCortina / ancho });
    pie.style.top = (centro.y + tamCortina / 2 + 34) + 'px';

    var onda = { r: 0, p: 0 };
    var plan = null;
    var HUECOS = [16, 40, 70];
    var ALFAS = [0.9, 0.65, 0.4];

    function medir() {
      w = window.innerWidth; h = window.innerHeight;
      muro.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      pintar();
    }

    /* rect completo + círculo interior en sentido contrario: un solo path con
       un agujero que crece, centrado siempre en la pandereta aunque vuele */
    function pintar() {
      var b = vuelo.getBoundingClientRect();
      var cx = b.left + b.width / 2, cy = b.top + b.height / 2, r = onda.r;
      var d = 'M0 0H' + w + 'V' + h + 'H0Z';
      if (r > 0.5) {
        d += ' M' + (cx - r) + ' ' + cy +
          ' A' + r + ' ' + r + ' 0 1 0 ' + (cx + r) + ' ' + cy +
          ' A' + r + ' ' + r + ' 0 1 0 ' + (cx - r) + ' ' + cy + 'Z';
      }
      relleno.setAttribute('d', d);
      ondas.forEach(function (c, i) {
        c.setAttribute('cx', cx.toFixed(1));
        c.setAttribute('cy', cy.toFixed(1));
        c.setAttribute('r', r > 0.5 ? (r + HUECOS[i]).toFixed(1) : 0);
        c.setAttribute('opacity', r > 0.5 ? (ALFAS[i] * (1 - onda.p)).toFixed(3) : 0);
      });
    }

    medir();
    cort.classList.add('cortina--muro');
    window.addEventListener('resize', medir);

    /* ── estado inicial ── */
    var O = { svgOrigin: '260 260' };
    var largos = [aroBanda].concat(filos).map(function (c) {
      c.setAttribute('transform', 'rotate(-90 260 260)'); /* el trazo arranca arriba, como las ferreñas */
      var l = 0;
      try { l = Math.ceil(c.getTotalLength()) + 2; } catch (e) { l = 1500; }
      gsap.set(c, { strokeDasharray: l, strokeDashoffset: l });
      return l;
    });
    gsap.set(sombra, { opacity: 0 });
    gsap.set(parche, Object.assign({ opacity: 0, scale: 0.82 }, O));
    gsap.set(vetas, { opacity: 0 });
    gsap.set(lazos, { opacity: 0, rotation: -38, svgOrigin: '441 399' });
    gsap.set(ferrenas, { opacity: 0 });
    gsap.set(discos, { scale: 0, transformOrigin: '50% 50%' });
    gsap.set(pie, { letterSpacing: '0.6em' });

    /* cada ferreña aparece cuando la cabeza del trazo pasa por ella: se
       invierte el ease del trazo para saber cuándo llega a su ángulo */
    var T_ARO = 0.15, D_ARO = 0.95, EASE_ARO = 'power3.inOut';
    var easeAro = gsap.parseEase(EASE_ARO);
    function cuandoLlega(f) {
      var lo = 0, hi = 1;
      for (var k = 0; k < 22; k++) { var m = (lo + hi) / 2; if (easeAro(m) < f) lo = m; else hi = m; }
      return T_ARO + D_ARO * (lo + hi) / 2;
    }

    var T_GOLPE = 1.95, T_ONDA = 2.1, D_ONDA = 1.4;
    var tl = gsap.timeline({ onComplete: retirar });

    /* 1 · la pandereta se monta */
    tl.to(luz, { opacity: 1, duration: 1.2, ease: 'power1.out' }, 0)
      .to(filos[0], { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 0.05)
      .to(filos[1], { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 0.1)
      .to(aroBanda, { strokeDashoffset: 0, duration: D_ARO, ease: EASE_ARO }, T_ARO);
    ferrenas.forEach(function (f, i) {
      var t = cuandoLlega(i / ferrenas.length) + 0.02;
      tl.to(f, { opacity: 1, duration: 0.12 }, t)
        .fromTo(discos[i], { scale: 0, rotation: -40 }, { scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(3)', immediateRender: false }, t);
    });
    tl.to(sombra, { opacity: 0.28, duration: 0.6 }, 0.8)
      .to(parche, Object.assign({ opacity: 1, scale: 1, duration: 0.65, ease: 'expo.out' }, O), 0.85)
      .to(vetas, { opacity: 0.55, duration: 0.8 }, 0.95)
      .to(tintaF, { attr: { height: 184 }, duration: 0.55, ease: 'power2.inOut' }, 1.05)
      .to(tintaR, { attr: { width: 312 }, duration: 0.6, ease: 'power2.inOut' }, 1.3)
      .to(lazos, { opacity: 1, rotation: 0, svgOrigin: '441 399', duration: 1.3, ease: 'elastic.out(1, 0.32)' }, 1.1)
      .to(pie, { opacity: 0.85, letterSpacing: '0.24em', duration: 0.9, ease: 'expo.out' }, 1.0);

    /* 2 · golpe seco */
    tl.call(function () { golpeSonido(0.85); }, null, T_GOLPE)
      .to(parche, Object.assign({ scale: 0.9, duration: 0.07, ease: 'power2.in' }, O), T_GOLPE)
      .to(parche, Object.assign({ scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.3)' }, O), T_GOLPE + 0.07)
      .to(clon, { keyframes: { x: [0, -6, 5, -3, 2, 0] }, duration: 0.32, ease: 'none' }, T_GOLPE)
      .to(ferrenas, { rotation: '+=18', duration: 0.05, ease: 'power1.inOut', yoyo: true, repeat: 5, stagger: 0.012 }, T_GOLPE)
      .fromTo(destello, Object.assign({ scale: 0.55, opacity: 0.9, attr: { 'stroke-width': 6 } }, O),
        Object.assign({ scale: 1.1, opacity: 0, attr: { 'stroke-width': 1 }, duration: 0.55, ease: 'power2.out', immediateRender: false }, O), T_GOLPE)
      .to(luz, { scale: 1.12, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1 }, T_GOLPE);

    /* 3 · la onda descubre la página y la pandereta aterriza en el hero.
       Si la página arrancó con scroll (el navegador lo restaura), el hero no
       está a la vista: la pandereta no vuela, se desvanece donde está. */
    tl.call(function () {
      var r = heroSvg.getBoundingClientRect();
      var vuela = r.bottom > 0 && r.top < window.innerHeight && r.width > 0;
      var cx = vuela ? r.left + r.width / 2 : centro.x;
      var cy = vuela ? r.top + r.height / 2 : centro.y;
      plan = {
        vuela: vuela,
        x: vuela ? r.left : centro.x - ancho / 2,
        y: vuela ? r.top : centro.y - ancho / 2,
        escala: vuela ? r.width / ancho : (tamCortina / ancho) * 1.15,
        R: Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) + HUECOS[2] + 20
      };
      abrir();
    }, null, T_ONDA - 0.001)
      .to(vuelo, {
        x: function () { return plan.x; },
        y: function () { return plan.y; },
        scale: function () { return plan.escala; },
        opacity: function () { return plan.vuela ? 1 : 0; },
        duration: D_ONDA, ease: 'expo.inOut'
      }, T_ONDA)
      .to(onda, { r: function () { return plan.R; }, p: 1, duration: D_ONDA, ease: 'expo.inOut', onUpdate: pintar }, T_ONDA)
      .to(pie, { opacity: 0, y: -12, duration: 0.45, ease: 'power2.in' }, T_ONDA)
      .to(luz, { opacity: 0, duration: 0.8, ease: 'power2.out' }, T_ONDA);

    setTimeout(retirar, 7000);
  })();

  /* ───────────────── hero: tocar, imán, encoger hasta el botón ───────────────── */
  (function hero() {
    var seccion = document.getElementById('inicio');
    var pandeireta = document.getElementById('pandeireta');
    var escena = seccion ? seccion.querySelector('.hero__escena') : null;
    if (!seccion || !pandeireta) return;

    var ondas = Array.prototype.slice.call(pandeireta.querySelectorAll('.pandeireta__onda'));
    var parche = pandeireta.querySelector('.pandeireta__parche');

    function golpe(intensidad) {
      pandeireta.classList.add('golpe');
      if (gsapReady) {
        gsap.killTweensOf(ondas.concat(parche, ferrenasHero));
        gsap.set(ondas, { opacity: 0, scale: 0.3 });
        gsap.to(ondas, { opacity: 0.5, scale: 1, duration: 0.9, ease: 'power2.out', stagger: 0.12, onComplete: function () { gsap.set(ondas, { opacity: 0 }); } });
        gsap.to(parche, { scale: 0.965, duration: 0.08, ease: 'power2.in', transformOrigin: '50% 50%' });
        gsap.to(parche, { scale: 1, duration: 0.55, ease: 'elastic.out(1,0.4)', delay: 0.08 });
        gsap.to(ferrenasHero, { rotation: '+=16', duration: 0.08, ease: 'power1.inOut', yoyo: true, repeat: 3, stagger: 0.01 });
      }
      emitirGolpe(intensidad || 0.7, true);
      setTimeout(function () { pandeireta.classList.remove('golpe'); }, 500);
    }

    pandeireta.addEventListener('click', function () { golpe(0.75); });
    pandeireta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); golpe(0.75); }
    });

    /* el cursor cerca inclina la pandereta (magnetic). Se inclina el
       contenedor, no la SVG: la SVG ya la gira el scroll y dos tweens sobre
       la misma rotación se pisan. */
    var heroST = null;
    var inclinaX = null;
    if (movimiento && !esTactil && escena) {
      inclinaX = gsap.quickTo(escena, 'rotation', { duration: 0.6, ease: 'power3.out' });
      escena.addEventListener('pointermove', function (e) {
        if (heroST && heroST.progress > 0.001) return;
        var c = escena.getBoundingClientRect();
        var relX = (e.clientX - (c.left + c.width / 2)) / (c.width / 2);
        inclinaX(Math.max(-7, Math.min(7, relX * 7)));
      });
      escena.addEventListener('pointerleave', function () { inclinaX(0); });
    }

    /* ferreñas: tintinean según la velocidad de Lenis (quieto = silencio) */
    if (movimiento) {
      var amplitud = 0;
      var ultimoSonido = 0;
      (function paso(t) {
        amplitud += (velocidadLenis * 1.6 - amplitud) * 0.12;
        if (amplitud > 0.4) {
          var s = Math.min(amplitud, 9);
          ferrenasHero.forEach(function (f, i) {
            var fase = t / 90 + i * 1.7;
            var ang = Math.sin(fase) * s;
            f.style.setProperty('transform', f.getAttribute('transform') ? '' : '');
          });
          gsap.set(ferrenasHero, { rotation: function (i) { return Math.sin(t / 90 + i * 1.7) * s; } });
          if (sonidoActivo && amplitud > 3.2 && t - ultimoSonido > 150) { ultimoSonido = t; golpeSonido(Math.min(1, amplitud / 9)); }
        } else if (amplitud > 0.02) {
          gsap.set(ferrenasHero, { rotation: 0 });
        }
        requestAnimationFrame(paso);
      })(0);
    }

    /* con scroll: gira despacio, se encoge y viaja a la esquina (pin del
       héroe, igual que en las webs hermanas: única forma robusta de que
       "viaje" a un punto fijo del viewport sin pelearse con el flujo). */
    /* la pandereta atracada es el botón del menú: al pulsarla, golpe y menú */
    var boton = document.getElementById('pandeireta-boton');
    if (boton) {
      boton.hidden = false; /* lo oculta la clase, no el atributo: así se puede medir */
      boton.addEventListener('click', function () {
        boton.classList.add('golpe');
        emitirGolpe(0.55, true);
        setTimeout(function () { boton.classList.remove('golpe'); }, 600);
        alternarMenu();
      });
    }
    var atracada = false;
    function atracar(si) {
      if (si === atracada) return;
      atracada = si;
      html.classList.toggle('pandeireta-atracada', si);
      if (boton) boton.classList.toggle('visible', si);
    }

    if (!movimiento) {
      if (boton) {
        window.addEventListener('scroll', function () { atracar(window.scrollY > seccion.offsetHeight * 0.6); }, { passive: true });
      }
      return;
    }

    if (!boton || !escena) return;
    gsap.set(pandeireta, { transformOrigin: '50% 50%' });

    /* SIN pin: fijar el hero dejaba la pantalla vacía mientras la pandereta
       se iba. La página hace scroll normal (el texto sube, «A casa» llega) y
       solo la pandereta vuela: su contenedor compensa el scroll 1:1 y la SVG
       viaja hasta el botón atracado, con el aro al mismo diámetro. */
    var ARO_PANDEIRETA = 471 / 520; /* diámetro exterior del aro / viewBox */
    var ARO_BOTON = 111 / 120;
    function recorrido() { return window.innerHeight * 0.6; }
    function vuelo() {
      /* origen en coordenadas de documento con scroll 0; offset* ignora
         transforms, así da igual en qué punto del vuelo se recalcule */
      var s = seccion.getBoundingClientRect();
      var origenX = s.left + escena.offsetLeft + escena.offsetWidth / 2;
      var origenY = s.top + window.scrollY + escena.offsetTop + escena.offsetHeight / 2;
      var b = boton.getBoundingClientRect();
      var ancho = parseFloat(getComputedStyle(pandeireta).width);
      return {
        x: (b.left + b.width / 2) - origenX,
        y: (b.top + b.height / 2) - origenY,
        escala: (b.width * ARO_BOTON) / (ancho * ARO_PANDEIRETA)
      };
    }

    var tl2 = gsap.timeline({ defaults: { ease: 'none' } });
    tl2.to(escena, { y: recorrido, duration: 1 }, 0) /* compensa el scroll, lineal */
      .to(pandeireta, {
        x: function () { return vuelo().x; },
        y: function () { return vuelo().y; },
        scale: function () { return vuelo().escala; },
        rotation: 360,
        ease: 'power2.inOut',
        duration: 1
      }, 0);

    heroST = window.ScrollTrigger.create({
      trigger: seccion,
      start: 0,
      end: recorrido,
      scrub: true, /* la compensación tiene que ir pegada al scroll: sin retardo */
      invalidateOnRefresh: true,
      animation: tl2,
      /* mientras vuela, la pandereta va por encima de la cabecera: si no, el
         último tramo pasa borroso por detrás del blur */
      onToggle: function (self) { escena.classList.toggle('volando', self.isActive); },
      onUpdate: function (self) {
        if (inclinaX && self.progress > 0.001) inclinaX(0);
        /* abre el hueco (y retira la hamburguesa) antes de que llegue */
        html.classList.toggle('pandeireta-llegando', self.progress > 0.7);
      },
      onLeave: function () { gsap.set(pandeireta, { autoAlpha: 0 }); atracar(true); },
      onEnterBack: function () { gsap.set(pandeireta, { autoAlpha: 1 }); atracar(false); }
    });
  })();

  /* ───────────────── golpe suave en cada cambio de sección + punto activo ───────────────── */
  (function golpesDeSeccion() {
    if (!gsapReady) return;
    var secciones = Array.prototype.slice.call(document.querySelectorAll('main > section'));
    var boton = document.getElementById('pandeireta-boton');
    var puntosNav = Array.prototype.slice.call(document.querySelectorAll('.seccion-nav a'));
    secciones.forEach(function (s) {
      window.ScrollTrigger.create({
        trigger: s,
        start: 'top 55%',
        onEnter: function () { marcarCompas(s); marcarActiva(s.id); },
        onEnterBack: function () { marcarCompas(s); marcarActiva(s.id); }
      });
    });
    function marcarCompas(s) {
      if (!movimiento) return;
      if (boton && boton.classList.contains('visible')) {
        boton.classList.add('golpe');
        setTimeout(function () { boton.classList.remove('golpe'); }, 550);
      }
      emitirGolpe(0.3, false);
    }
    /* qué sección está en pantalla es contenido, no decoración: se actualiza
       también con reduced-motion (ver feedback_reduced_motion_content_vs_motion) */
    function marcarActiva(id) {
      puntosNav.forEach(function (a) { a.classList.toggle('activo', a.dataset.seccion === id); });
    }
  })();

  /* ───────────────── anillo de progreso en el botón-pandeireta ───────────────── */
  (function progresoPagina() {
    var anillo = document.querySelector('.pandeireta-boton__progreso');
    if (!anillo || !gsapReady) return;
    var largo = 0;
    try { largo = Math.ceil(anillo.getTotalLength()); } catch (e) { largo = 358; }
    gsap.set(anillo, { strokeDasharray: largo, strokeDashoffset: largo });
    window.ScrollTrigger.create({
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: function (self) { gsap.set(anillo, { strokeDashoffset: largo * (1 - self.progress) }); }
    });
  })();

  /* ───────────────── botones magnéticos ───────────────── */
  (function imanes() {
    if (!movimiento || esTactil) return;
    Array.prototype.forEach.call(document.querySelectorAll('.iman'), function (el) {
      var aX = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
      var aY = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var c = el.getBoundingClientRect();
        aX((e.clientX - (c.left + c.width / 2)) * 0.28);
        aY((e.clientY - (c.top + c.height / 2)) * 0.35);
      });
      el.addEventListener('pointerleave', function () { aX(0); aY(0); });
    });
  })();

  /* ───────────────── cursor propio ───────────────── */
  (function cursor() {
    if (!movimiento || esTactil) return;
    var c = document.createElement('div');
    var p = document.createElement('div');
    c.className = 'cursor';
    p.className = 'cursor-punto';
    [c, p].forEach(function (n) { n.setAttribute('aria-hidden', 'true'); document.body.appendChild(n); });

    var aX = gsap.quickTo(c, 'x', { duration: 0.28, ease: 'power3.out' });
    var aY = gsap.quickTo(c, 'y', { duration: 0.28, ease: 'power3.out' });

    function mostrar(si) {
      c.classList.toggle('cursor--vivo', si);
      p.classList.toggle('cursor-punto--vivo', si);
    }

    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (!c.classList.contains('cursor--vivo')) {
        gsap.set(c, { x: e.clientX, y: e.clientY });
        html.classList.add('con-cursor');
        mostrar(true);
      }
      gsap.set(p, { x: e.clientX, y: e.clientY });
      aX(e.clientX); aY(e.clientY);
    });
    document.documentElement.addEventListener('mouseleave', function () { mostrar(false); });
    document.documentElement.addEventListener('mouseenter', function () { if (html.classList.contains('con-cursor')) mostrar(true); });
    document.addEventListener('pointerover', function (e) {
      var sobre = !!e.target.closest('a, button, #pandeireta, .map-consent');
      c.classList.toggle('cursor--activo', sobre);
      p.classList.toggle('cursor-punto--activo', sobre);
    });

    /* el aro del cursor late con cada golpe de compás */
    document.addEventListener('golpe-compas', function (e) {
      var fuerza = (e.detail && e.detail.intensidad) || 0.5;
      gsap.fromTo(c, { scale: 1 }, { scale: 1 + fuerza * 0.7, duration: 0.14, ease: 'power2.out', yoyo: true, repeat: 1, overwrite: 'auto' });
    });
  })();

  /* ───────────────── cabecera + menú móvil ───────────────── */
  var cabecera = document.getElementById('cabecera');
  var hamburguesa = document.getElementById('hamburguesa');

  (function cabeceraFija() {
    if (!cabecera) return;
    window.addEventListener('scroll', function () {
      cabecera.classList.toggle('cabecera--fija', window.scrollY > 4);
    }, { passive: true });
  })();

  /* dos botones abren el mismo menú: la hamburguesa (móvil, antes de atracar)
     y la pandereta atracada (siempre después del hero) */
  function alternarMenu(abrir) {
    if (!cabecera) return;
    if (abrir === undefined) abrir = !cabecera.classList.contains('menu-abierto');
    cabecera.classList.toggle('menu-abierto', abrir);
    rotularMenu(abrir);
    if (lenis) { if (abrir) lenis.stop(); else lenis.start(); }
  }
  function rotularMenu(abrir) {
    var etiqueta = t(abrir ? 'menu.cerrar' : 'menu.abrir');
    if (hamburguesa) {
      hamburguesa.setAttribute('aria-expanded', abrir ? 'true' : 'false');
      hamburguesa.querySelector('.visualmente-oculto').textContent = etiqueta;
    }
    var pb = document.getElementById('pandeireta-boton');
    if (pb) { pb.setAttribute('aria-expanded', abrir ? 'true' : 'false'); pb.setAttribute('aria-label', etiqueta); }
  }
  rotularMenu(false);
  document.addEventListener('idioma-cambiado', function () { rotularMenu(!!cabecera && cabecera.classList.contains('menu-abierto')); });
  function cerrarMenu() {
    if (cabecera && cabecera.classList.contains('menu-abierto')) alternarMenu(false);
  }
  if (hamburguesa) hamburguesa.addEventListener('click', function () { alternarMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarMenu(); });

  /* ───────────────── mapa solo bajo clic ───────────────── */
  (function mapa() {
    Array.prototype.forEach.call(document.querySelectorAll('.map-consent'), function (btn) {
      btn.addEventListener('click', function () {
        var marco = document.createElement('iframe');
        marco.src = btn.dataset.mapSrc;
        marco.loading = 'lazy';
        marco.title = btn.dataset.mapTitle || 'Mapa';
        marco.referrerPolicy = 'no-referrer-when-downgrade';
        btn.parentNode.replaceChild(marco, btn);
      });
    });
  })();

  /* ───────────────── aviso de cookies ───────────────── */
  (function cookies() {
    var caja = document.getElementById('cookies');
    var ok = document.getElementById('cookies-aceptar');
    if (!caja || !ok) return;
    var guardado = null;
    try { guardado = localStorage.getItem('logradouro-cookies'); } catch (e) {}
    if (guardado !== 'ok') caja.hidden = false;
    ok.addEventListener('click', function () {
      caja.hidden = true;
      try { localStorage.setItem('logradouro-cookies', 'ok'); } catch (e) {}
    });
  })();

  /* ───────────────── contadores (reseñas) ───────────────── */
  (function contadores() {
    var nodos = Array.prototype.slice.call(document.querySelectorAll('[data-contador]'));
    function formatear(n, el) {
      var dec = parseInt(el.dataset.decimales || '0', 10);
      return dec ? n.toFixed(dec).replace('.', idioma === 'en' ? '.' : ',') : Math.round(n).toString();
    }
    if (movimiento) nodos.forEach(function (el) { el.textContent = formatear(0, el); });
    cuandoVisible(nodos, 0.5, function (el) {
      var fin = parseFloat(el.dataset.contador);
      if (!movimiento) { el.textContent = formatear(fin, el); el.__hecho = true; return; }
      var estado = { v: 0 };
      gsap.to(estado, { v: fin, duration: 1.4, ease: 'power2.out', onUpdate: function () { el.textContent = formatear(estado.v, el); }, onComplete: function () { el.__hecho = true; } });
    });
    /* 4,6 ↔ 4.6 al cambiar de idioma */
    document.addEventListener('idioma-cambiado', function () {
      nodos.forEach(function (el) { if (el.__hecho) el.textContent = formatear(parseFloat(el.dataset.contador), el); });
    });
  })();

  var anio = document.getElementById('anio');
  if (anio) anio.textContent = new Date().getFullYear();

  /* ═══════════════════════════════════════════════════════════════════
     Horario en vivo (Europe/Madrid). Mércores a domingo, 10:00-1:00 (cruza
     a medianoite); luns e martes, pechado. Turnos como [día 0=dom..6=sáb,
     inicio en minutos, fin en minutos — 1500 = 25:00 = a 1:00 do día seguinte].
     ═══════════════════════════════════════════════════════════════════ */
  (function horario() {
    var turnos = [[3, 600, 1500], [4, 600, 1500], [5, 600, 1500], [6, 600, 1500], [0, 600, 1500]];
    var SEM = 7 * 1440;
    var DIAS = {
      gl: { nombres: ['domingo', 'luns', 'martes', 'mércores', 'xoves', 'venres', 'sábado'], abrev: ['Dom', 'Lun', 'Mar', 'Mér', 'Xov', 'Ven', 'Sáb'] },
      es: { nombres: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'], abrev: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] },
      en: { nombres: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], abrev: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }
    };
    /* «á 1:00» / «a la 1:00», pero «ás 10:00» / «a las 10:00»; «at 10:00» */
    function aLas(m) {
      var una = Math.floor((((m % 1440) + 1440) % 1440) / 60) === 1;
      if (idioma === 'en') return 'at ' + hhmm(m);
      if (idioma === 'es') return (una ? 'a la ' : 'a las ') + hhmm(m);
      return (una ? 'á ' : 'ás ') + hhmm(m);
    }
    var FRASES = {
      gl: { abierto: 'Aberto · pecha ', abrimos: 'Abrimos ', volvemos: 'Volvemos o ', cerrado: 'Pechado' },
      es: { abierto: 'Abierto · cierra ', abrimos: 'Abrimos ', volvemos: 'Volvemos el ', cerrado: 'Cerrado' },
      en: { abierto: 'Open · closes ', abrimos: 'We open ', volvemos: 'Back on ', cerrado: 'Closed' }
    };

    function ahora() {
      var p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      var g = function (t) { return p.find(function (x) { return x.type === t; }).value; };
      var d = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday'));
      return { min: d * 1440 + (+g('hour')) * 60 + (+g('minute')), dia: d };
    }
    function hhmm(m) { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }

    function calcular(t) {
      for (var i = 0; i < turnos.length; i++) {
        var d = turnos[i][0], a = turnos[i][1], b = turnos[i][2];
        var S = d * 1440 + a, E = d * 1440 + b;
        if (t.min >= S && t.min < E) return { abierto: true, cierra: b };
      }
      var mejor = null;
      turnos.forEach(function (tu) {
        var S = tu[0] * 1440 + tu[1];
        var falta = ((S - t.min) % SEM + SEM) % SEM;
        if (!mejor || falta < mejor.falta) mejor = { falta: falta, dia: tu[0], inicio: tu[1] };
      });
      var mismoDia = mejor.dia === t.dia && mejor.falta < 1440;
      return { abierto: false, proximoDia: mejor.dia, proximaHora: mejor.inicio, hoyMismo: mismoDia };
    }

    function pinta() {
      var t = ahora();
      var el = document.getElementById('estado');
      if (!el) return;
      var txt = el.querySelector('span');
      var r = calcular(t);
      el.classList.toggle('abierto', r.abierto);
      var F = FRASES[idioma];
      if (r.abierto) {
        txt.textContent = F.abierto + aLas(r.cierra);
      } else if (r.hoyMismo) {
        txt.textContent = F.abrimos + aLas(r.proximaHora);
      } else {
        txt.textContent = F.volvemos + DIAS[idioma].nombres[r.proximoDia] + ' ' + aLas(r.proximaHora);
      }
      pintarTabla(t.dia);
    }

    function pintarTabla(diaHoy) {
      var ul = document.getElementById('horario-tabla');
      if (!ul || ul.childElementCount) return;
      var cerrado = FRASES[idioma].cerrado;
      var filas = [
        [1, cerrado], [2, cerrado], [3, '10:00–1:00'], [4, '10:00–1:00'],
        [5, '10:00–1:00'], [6, '10:00–1:00'], [0, '10:00–1:00']
      ];
      filas.forEach(function (f) {
        var li = document.createElement('li');
        if (f[0] === diaHoy) li.className = 'hoy';
        li.innerHTML = '<span>' + DIAS[idioma].abrev[f[0]] + '</span><span>' + f[1] + '</span>';
        ul.appendChild(li);
      });
    }

    pinta();
    setInterval(pinta, 30000);
    document.addEventListener('idioma-cambiado', function () {
      var ul = document.getElementById('horario-tabla');
      if (ul) ul.innerHTML = '';
      pinta();
    });
    window.__horarioTest = { calcular: calcular, hhmm: hhmm }; /* enganche para verify.mjs */
  })();

  /* ═══════════════════════════════════════════════════════════════════
     Carta: pinta la carta y «Para empezar» desde data/carta.json.
     ═══════════════════════════════════════════════════════════════════ */
  (function carta() {
    var contCoplas = document.getElementById('coplas');
    var contDestacados = document.getElementById('destacados-lista');
    if (!contCoplas && !contDestacados) return;

    function num2(n) { return String(n).padStart(2, '0'); }

    function euros(n) {
      if (n === null || n === undefined) return '<span class="sin-precio">—</span>';
      return n.toFixed(2).replace('.', ',') + ' €';
    }
    function buscarPlato(nombre, datos) {
      for (var s = 0; s < datos.secciones.length; s++) {
        var p = datos.secciones[s].platos.find(function (x) { return x.nombre === nombre; });
        if (p) return p;
      }
      return null;
    }

    fetch('data/carta.json').then(function (r) { return r.json(); }).then(function (datos) {

      /* ───── coplas ───── */
      if (contCoplas) {
        var total = datos.secciones.length;
        var etiquetaCopla = function (n) {
          return num2(n) + ' <span class="copla__de">/ ' + num2(total) + '</span>';
        };
        /* al cambiar de idioma: «media» ↔ «half» (el «03 / 11» no cambia) */
        document.addEventListener('idioma-cambiado', function () {
          Array.prototype.forEach.call(contCoplas.querySelectorAll('.copla__num[data-n]'), function (el) {
            el.innerHTML = etiquetaCopla(+el.getAttribute('data-n'));
          });
          Array.prototype.forEach.call(document.querySelectorAll('.media__etq'), function (el) { el.textContent = t('carta.media'); });
          var pn = document.querySelector('.copla-actual__num[data-n]');
          if (pn) pn.textContent = num2(+pn.getAttribute('data-n')) + ' / ' + num2(total);
        });
        var pildora = document.getElementById('copla-actual');
        var pildoraNum = pildora ? pildora.querySelector('.copla-actual__num') : null;
        var pildoraTit = pildora ? pildora.querySelector('.copla-actual__tit') : null;
        if (pildora && gsapReady) {
          window.ScrollTrigger.create({
            trigger: contCoplas,
            start: 'top 40%',
            end: 'bottom 40%',
            onToggle: function (self) { pildora.classList.toggle('visible', self.isActive); }
          });
        }
        datos.secciones.forEach(function (sec, i) {
          var copla = document.createElement('article');
          copla.className = 'copla';
          copla.id = 'copla-' + sec.id;

          var cab = document.createElement('div');
          cab.className = 'copla__cab';
          var esEstribillo = sec.id === 'almorzos';
          cab.innerHTML =
            '<p class="copla__num" data-n="' + (i + 1) + '">' + etiquetaCopla(i + 1) + '</p>' +
            '<h3 class="copla__titulo">' + sec.titulo + '</h3>' +
            (sec.gl && sec.gl !== sec.titulo ? '<p class="copla__gl">«' + sec.gl + '»</p>' : '') +
            (sec.nota ? '<p class="copla__nota">' + sec.nota + '</p>' : '') +
            '<div class="compas" aria-hidden="true"><i class="forte"></i><i></i><i></i><i class="forte"></i><i></i><i></i></div>';
          copla.appendChild(cab);

          var lista = document.createElement('ol');
          lista.className = 'copla__lista' + (sec.platos.length > 6 ? ' copla__lista--dosCol' : '');
          sec.platos.forEach(function (plato, j) {
            var li = document.createElement('li');
            li.className = 'verso' + (esEstribillo ? ' verso--estribillo' : '');
            var precioHtml = euros(plato.precio);
            if (plato.media) precioHtml += '<span class="media"><span class="media__etq">' + t('carta.media') + '</span> ' + euros(plato.media) + '</span>';
            li.innerHTML =
              '<span class="verso__n">' + (j + 1) + '</span>' +
              '<span class="verso__nombre">' + plato.nombre + (plato.desc ? '<span class="verso__desc">' + plato.desc + '</span>' : '') + '</span>' +
              '<span class="verso__precio">' + precioHtml + '</span>';
            lista.appendChild(li);
          });
          copla.appendChild(lista);
          contCoplas.appendChild(copla);

          /* revelado con solapes: todas las filas casi a la vez, no en cadena */
          var versos = Array.prototype.slice.call(lista.children);
          cuandoVisible([lista], 0.1, function () {
            if (!movimiento) return;
            gsap.to(versos, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: { each: 0.02, from: 'start' } });
          });

          /* píldora de móvil: qué copla estás leyendo (contenido: también con reduced-motion) */
          if (pildora && gsapReady) {
            window.ScrollTrigger.create({
              trigger: copla,
              start: 'top 40%',
              end: 'bottom 40%',
              onToggle: function (self) {
                if (!self.isActive) return;
                pildoraNum.textContent = num2(i + 1) + ' / ' + num2(total);
                pildoraNum.setAttribute('data-n', i + 1);
                pildoraTit.textContent = sec.titulo;
              }
            });
          }

          /* indicador de compás: avanza con el scroll de ESA lista (contenido, no solo movimiento) */
          if (gsapReady) {
            var puntos = Array.prototype.slice.call(cab.querySelectorAll('.compas i'));
            window.ScrollTrigger.create({
              trigger: lista,
              start: 'top 70%',
              end: 'bottom 30%',
              scrub: true,
              onUpdate: function (self) {
                var idx = self.progress > 0 ? Math.min(5, Math.floor(self.progress * 6)) : -1;
                puntos.forEach(function (p, k) {
                  p.classList.toggle('lleno', k <= idx);
                  p.classList.toggle('activo', k === idx);
                });
              }
            });
          }
        });
        if (gsapReady) window.ScrollTrigger.refresh();
      }

      /* ───── destacados ───── */
      if (contDestacados && datos.destacados) {
        datos.destacados.forEach(function (nombre, i) {
          var plato = buscarPlato(nombre, datos);
          var el = document.createElement('article');
          el.className = 'destacado';
          el.innerHTML =
            '<span class="destacado__num">' + String(i + 1).padStart(2, '0') + '</span>' +
            '<span><span class="destacado__nombre">' + nombre + '</span>' +
            (plato && plato.desc ? '<span class="destacado__desc">' + plato.desc + '</span>' : '') + '</span>' +
            '<span class="destacado__precio">' + (plato ? euros(plato.precio) : '') + '</span>';
          contDestacados.appendChild(el);
        });
      }

      /* ───── marquee: nombres reales de la carta, dos velocidades ───── */
      construirMarquee(datos);
    }).catch(function (err) {
      console.error('No se pudo cargar data/carta.json', err);
      if (contCoplas) contCoplas.innerHTML = '<p style="padding:2rem;opacity:.6">' + t('carta.error') + '</p>';
    });

    function construirMarquee(datos) {
      var pista1 = document.getElementById('marquee-1');
      var pista2 = document.getElementById('marquee-2');
      if (!pista1 || !pista2) return;
      function nombresDe(ids) {
        return datos.secciones.filter(function (s) { return ids.indexOf(s.id) > -1; })
          .reduce(function (acc, s) { return acc.concat(s.platos.map(function (p) { return p.nombre; })); }, []);
      }
      var lista1 = nombresDe(['raciones', 'tapas', 'tortillas']);
      var lista2 = nombresDe(['cocina', 'bocatas', 'almorzos']).map(function (n, i) {
        var s = datos.secciones.find(function (sec) { return sec.platos.some(function (p) { return p.nombre === n; }); });
        var p = s.platos.find(function (p) { return p.nombre === n; });
        return (p && p.gl) ? p.gl : n;
      });
      [[pista1, lista1], [pista2, lista2]].forEach(function (par) {
        var pista = par[0], nombres = par[1];
        var grupo = document.createElement('div');
        nombres.forEach(function (n) { var s = document.createElement('span'); s.textContent = n; grupo.appendChild(s); });
        pista.appendChild(grupo);
        var copias = 3;
        for (var i = 0; i < copias; i++) { var c = grupo.cloneNode(true); c.setAttribute('aria-hidden', 'true'); pista.appendChild(c); }
        if (!movimiento) return;
        var x = 0, base = pista === pista1 ? 0.55 : 0.9, impulso = 0;
        var hueco = parseFloat(getComputedStyle(pista).columnGap) || 0;
        (function paso() {
          if (!html.classList.contains('densidad-sobria') || pista === pista1) {
            /* un ciclo = grupo + el hueco hasta la copia siguiente, o salta al dar la vuelta */
            var ancho = (grupo.offsetWidth + hueco) || 1;
            /* acelera con la velocidad del scroll, como las ferreñas; sin
               eventos de Lenis en 120 ms se da por parado */
            var v = performance.now() - tUltimoScroll > 120 ? 0 : Math.min(velocidadLenis, 30);
            impulso += (v - impulso) * 0.08;
            x -= base * (1 + impulso * 0.12);
            if (x <= -ancho) x += ancho;
            pista.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
          }
          requestAnimationFrame(paso);
        })();
      });
    }
  })();

  /* las medidas cambian cuando llega la webfont, y también cada vez que una
     copla con content-visibility:auto pasa de su altura estimada
     (contain-intrinsic-size) a su altura real al acercarse al viewport: sin
     este reajuste, el final de página que maneja ScrollTrigger (anillo de
     progreso, punto activo) se queda corto — ver feedback_content_visibility_calle_larga. */
  if (gsapReady) {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { window.ScrollTrigger.refresh(); });
    }
    if ('ResizeObserver' in window) {
      var refrescoPend;
      new ResizeObserver(function () {
        clearTimeout(refrescoPend);
        refrescoPend = setTimeout(function () { window.ScrollTrigger.refresh(); }, 150);
      }).observe(document.documentElement);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     [MANDO DE MAQUETA] — SOLO REVISIÓN INTERNA. NO PUBLICAR.
     Borrar este bloque entero, el bloque CSS marcado igual en estilos.css,
     el <div class="mando"> del HTML y el script bloqueante del <head>.
     ═══════════════════════════════════════════════════════════════════════ */
  (function mandoMaqueta() {
    var mando = document.getElementById('mando');
    if (!mando) return;
    if (!/[?&]revision\b/.test(window.location.search)) return;
    mando.hidden = false;
    var botones = Array.prototype.slice.call(mando.querySelectorAll('[data-densidad]'));

    function aplicar(d) {
      html.classList.remove('densidad-pandeireta', 'densidad-sobria');
      html.classList.add('densidad-' + d);
      botones.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.densidad === d ? 'true' : 'false'); });
      try { localStorage.setItem('logradouro-densidad', d); } catch (e) {}
      document.dispatchEvent(new CustomEvent('densidad-cambiada', { detail: d }));
      if (window.ScrollTrigger) setTimeout(function () { window.ScrollTrigger.refresh(); }, 80);
    }

    var actual = html.classList.contains('densidad-sobria') ? 'sobria' : 'pandeireta';
    botones.forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.densidad === actual ? 'true' : 'false');
      b.addEventListener('click', function () { aplicar(b.dataset.densidad); });
    });
  })();
  /* ═══════════ fin del bloque [MANDO DE MAQUETA] ═══════════ */

})();
