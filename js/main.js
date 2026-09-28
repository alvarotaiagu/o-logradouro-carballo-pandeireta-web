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

  /* ───────────────────────── idioma (galego / castellano) ─────────────────────────
     El HTML trae el galego (lo que se ve sin JS). El script del <head> ya
     decidió el idioma; aquí se traduce ANTES de partir los titulares. La carta
     no se traduce: sale de carta.json tal como la escribe la casa. Las citas
     de las reseñas tampoco: son palabras de quien las firma. */
  var idioma = html.getAttribute('data-idioma') === 'es' ? 'es' : 'gl';
  var TXT = {
    'salto': { gl: 'Saltar ao contido', es: 'Saltar al contenido' },
    'nav.aria': { gl: 'Seccións', es: 'Secciones' },
    'nav.casa': { gl: 'A casa', es: 'La casa' },
    'nav.cancioneiro': { gl: 'O cancioneiro', es: 'El cancionero' },
    'nav.resenas': { gl: 'Opinións', es: 'Reseñas' },
    'menu.destacados': { gl: 'Os destacados', es: 'Los destacados' },
    'menu.horario': { gl: 'Horario e onde', es: 'Horario y dónde' },
    'menu.chamar': { gl: 'Chamar · 637 08 50 37', es: 'Llamar · 637 08 50 37' },
    'menu.abrir': { gl: 'Abrir menú', es: 'Abrir menú' },
    'menu.cerrar': { gl: 'Pechar menú', es: 'Cerrar menú' },
    'ir.aria': { gl: 'Ir a unha sección', es: 'Ir a una sección' },
    'ir.inicio': { gl: 'Ir ao inicio', es: 'Ir al inicio' },
    'ir.casa': { gl: 'Ir a A casa', es: 'Ir a La casa' },
    'ir.cancioneiro': { gl: 'Ir a O cancioneiro', es: 'Ir a El cancionero' },
    'ir.destacados': { gl: 'Ir a Os destacados', es: 'Ir a Los destacados' },
    'ir.resenas': { gl: 'Ir a Opinións', es: 'Ir a Reseñas' },
    'ir.horario': { gl: 'Ir a Horario e onde', es: 'Ir a Horario y dónde' },
    'hero.titular': { gl: 'Bar de sempre, a ritmo novo.', es: 'Bar de siempre, a ritmo nuevo.' },
    'hero.sub': { gl: 'Raxo, tortilla á feira e o cancioneiro enteiro da casa. De mércores a domingo, das 10:00 á 1:00.', es: 'Raxo, tortilla á feira y el cancionero entero de la casa. De miércoles a domingo, de 10:00 a 1:00.' },
    'hero.cta': { gl: 'Ver o cancioneiro', es: 'Ver el cancionero' },
    'hero.nota': { gl: '4,6★ · 246 opinións en Google', es: '4,6★ · 246 reseñas en Google' },
    'hero.pandeireta': { gl: 'Tocar a pandeireta', es: 'Tocar la pandereta' },
    'son.off': { gl: 'Son: apagado', es: 'Sonido: apagado' },
    'son.on': { gl: 'Son: aceso', es: 'Sonido: encendido' },
    'casa.dias': { gl: 'Mér–Dom', es: 'Mié–Dom' },
    'casa.pechado': { gl: 'luns e martes, pechado', es: 'lunes y martes, cerrado' },
    'casa.almorzos': { gl: 'almorzos ata as 13:00', es: 'desayunos hasta las 13:00' },
    'casa.texto': { gl: 'Unha taberna de sempre na Rúa Lugo, con carta propia en galego e almorzos con nome propio. O de sempre, servido ao ritmo de agora.', es: 'Una taberna de siempre en la Rúa Lugo, con carta propia en gallego y almuerzos con nombre propio. Lo de siempre, servido al ritmo de ahora.' },
    'carta.h2': { gl: 'A carta, en once coplas.', es: 'La carta, en once coplas.' },
    'carta.sub': { gl: '68 pratos. Prezo <code>—</code> significa que aínda non o confirmamos.', es: '68 platos. Precio <code>—</code> significa que aún no lo hemos confirmado.' },
    'carta.error': { gl: 'Non se puido cargar a carta.', es: 'No se pudo cargar la carta.' },
    'dest.h2': { gl: 'O repertorio da casa.', es: 'El repertorio de la casa.' },
    'resenas.etq': { gl: 'opinións en Google', es: 'reseñas en Google' },
    'horario.h2': { gl: 'Onde e cando.', es: 'Dónde y cuándo.' },
    'horario.aviso': { gl: 'Almorzos ata as 13:00, con café con leite dobre e zume de laranxa natural.', es: 'Desayunos hasta las 13:00, con café con leche doble y zumo de naranja natural.' },
    'mapa.nota': { gl: 'Carga un iframe de Google Maps só ao premer aquí.', es: 'Carga un iframe de Google Maps solo al pulsar aquí.' },
    'pie.aria': { gl: 'Redes e legal', es: 'Redes y legal' },
    'pie.privacidade': { gl: 'Privacidade', es: 'Privacidad' },
    'cookies.texto': { gl: 'Este sitio non usa cookies de seguimento. Só garda no teu navegador o idioma e que xa viches este aviso; se o pides, carga o mapa de Google, que si pon as súas. <a href="privacidad.html">Máis detalle</a>.', es: 'Este sitio no usa cookies de seguimiento. Solo guarda en tu navegador el idioma y que ya has visto este aviso; si lo pides, carga el mapa de Google, que sí pone las suyas. <a href="privacidad.html">Más detalle</a>.' },
    'cookies.ok': { gl: 'De acordo', es: 'De acuerdo' }
  };
  function t(k) { var e = TXT[k]; return e ? e[idioma] : k; }

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
    gsap.ticker.lagSmoothing(0);
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
      document.addEventListener('cortina-retirada', function () { revelar(piezas); }, { once: true });
      return;
    }
    cuandoVisible([el], 0.3, function () { revelar(piezas); });
  });

  /* cambio en vivo: textos, atributos y titulares partidos (que se vuelven a
     partir y se revelan al momento); lo que pinta el JS escucha 'idioma-cambiado' */
  function cambiarIdioma(l) {
    if (l === idioma || (l !== 'gl' && l !== 'es')) return;
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
  var ferrenasCortina = repartirFerrenas(document.getElementById('cortina-ferrenas'), 8, 200, 200, 150, 0.6);

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

  /* ───────────────── cortina: aro que se dibuja, golpe, onda que descubre ───────────────── */
  (function cortina() {
    var cort = document.getElementById('cortina');
    if (!cort) return;
    var muro = document.getElementById('cortina-muro');
    var relleno = document.getElementById('cortina-relleno');
    var aro = document.getElementById('cortina-aro');
    var parche = document.getElementById('cortina-parche');
    var pie = document.getElementById('cortina-pie');
    var hecho = false;

    function retirar() {
      if (hecho) return;
      hecho = true;
      cort.classList.add('fuera');
      document.body.style.removeProperty('overflow');
      if (lenis) lenis.start();
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      document.dispatchEvent(new CustomEvent('cortina-retirada'));
    }

    if (!movimiento) {
      setTimeout(retirar, reduce ? 250 : 120);
      return;
    }

    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();

    var w = 0, h = 0;
    var onda = { r: 0 };

    function medir() {
      w = window.innerWidth; h = window.innerHeight;
      muro.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      pintar();
    }

    /* rect completo + círculo interior en sentido de giro contrario: un
       solo path con un agujero circular que crece (mismo truco que las
       webs hermanas para la cortina de arco). */
    function pintar() {
      var cx = w / 2, cy = h * 0.42, r = onda.r;
      var d = 'M0 0H' + w + 'V' + h + 'H0Z';
      if (r > 0) {
        d += ' M' + (cx - r) + ' ' + cy +
          ' A' + r + ' ' + r + ' 0 1 0 ' + (cx + r) + ' ' + cy +
          ' A' + r + ' ' + r + ' 0 1 0 ' + (cx - r) + ' ' + cy + 'Z';
      }
      relleno.setAttribute('d', d);
    }

    medir();
    window.addEventListener('resize', medir);

    var lAro = 0;
    try { lAro = Math.ceil(aro.getTotalLength()) + 2; } catch (e) { lAro = 943; }
    gsap.set(aro, { strokeDasharray: lAro, strokeDashoffset: lAro });
    gsap.set(ferrenasCortina, { rotation: 0, transformOrigin: '50% 50%' });

    var tl = gsap.timeline({ onComplete: retirar });
    tl.to(aro, { strokeDashoffset: 0, duration: 1.05, ease: 'power2.inOut' }, 0)
      .to(parche, { opacity: 1, duration: 0.5, ease: 'power1.out' }, 0.65)
      .to(pie, { opacity: 1, duration: 0.5 }, 0.95)
      /* golpe seco: el parche se hunde, las ferreñas tiemblan */
      .to(parche, { scale: 0.93, duration: 0.09, ease: 'power2.in' }, 1.35)
      .to(parche, { scale: 1, duration: 0.5, ease: 'elastic.out(1,0.4)' }, 1.44)
      .to(ferrenasCortina, { rotation: 14, duration: 0.07, ease: 'power1.inOut', stagger: 0.015 }, 1.35)
      .to(ferrenasCortina, { rotation: -10, duration: 0.09, ease: 'power1.inOut', stagger: 0.015 }, 1.43)
      .to(ferrenasCortina, { rotation: 0, duration: 0.4, ease: 'elastic.out(1,0.5)', stagger: 0.015 }, 1.53)
      .call(function () { golpeSonido(0.85); }, null, 1.35)
      /* onda concéntrica: crece y descubre la página, expo.inOut */
      .to([pie], { opacity: 0, duration: 0.3 }, 1.9)
      .to(onda, { r: Math.hypot(w, h) * 0.75, duration: 1.3, ease: 'expo.inOut', onUpdate: pintar }, 2.0);

    setTimeout(retirar, 6500);
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
      return dec ? n.toFixed(dec).replace('.', ',') : Math.round(n).toString();
    }
    if (movimiento) nodos.forEach(function (el) { el.textContent = formatear(0, el); });
    cuandoVisible(nodos, 0.5, function (el) {
      var fin = parseFloat(el.dataset.contador);
      if (!movimiento) { el.textContent = formatear(fin, el); return; }
      var estado = { v: 0 };
      gsap.to(estado, { v: fin, duration: 1.4, ease: 'power2.out', onUpdate: function () { el.textContent = formatear(estado.v, el); } });
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
      es: { nombres: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'], abrev: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] }
    };
    /* «á 1:00» / «a la 1:00», pero «ás 10:00» / «a las 10:00» */
    function aLas(m) {
      var una = Math.floor((((m % 1440) + 1440) % 1440) / 60) === 1;
      if (idioma === 'es') return (una ? 'a la ' : 'a las ') + hhmm(m);
      return (una ? 'á ' : 'ás ') + hhmm(m);
    }

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
      var es = idioma === 'es';
      if (r.abierto) {
        txt.textContent = (es ? 'Abierto · cierra ' : 'Aberto · pecha ') + aLas(r.cierra);
      } else if (r.hoyMismo) {
        txt.textContent = 'Abrimos ' + aLas(r.proximaHora);
      } else {
        txt.textContent = (es ? 'Volvemos el ' : 'Volvemos o ') + DIAS[idioma].nombres[r.proximoDia] + ' ' + aLas(r.proximaHora);
      }
      pintarTabla(t.dia);
    }

    function pintarTabla(diaHoy) {
      var ul = document.getElementById('horario-tabla');
      if (!ul || ul.childElementCount) return;
      var cerrado = idioma === 'es' ? 'Cerrado' : 'Pechado';
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
     Carta: pinta O cancioneiro y Os destacados desde data/carta.json.
     ═══════════════════════════════════════════════════════════════════ */
  (function carta() {
    var contCoplas = document.getElementById('coplas');
    var contDestacados = document.getElementById('destacados-lista');
    if (!contCoplas && !contDestacados) return;

    function romano(n) {
      var vals = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
      var out = '';
      vals.forEach(function (v) { while (n >= v[0]) { out += v[1]; n -= v[0]; } });
      return out;
    }
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
        var total = romano(datos.secciones.length);
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
            '<p class="copla__num">Copla ' + romano(i + 1) + ' <span class="copla__de">de ' + total + '</span></p>' +
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
            if (plato.media) precioHtml += '<span class="media">media ' + euros(plato.media) + '</span>';
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
                pildoraNum.textContent = 'Copla ' + romano(i + 1) + ' de ' + total;
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
                var idx = Math.min(5, Math.floor(self.progress * 6));
                puntos.forEach(function (p, k) { p.classList.toggle('activo', k === idx); });
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
