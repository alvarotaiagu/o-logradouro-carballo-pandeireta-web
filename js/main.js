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
  if (movimiento && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', function (e) {
      window.ScrollTrigger.update();
      velocidadLenis = Math.abs(e.velocity || 0);
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

  (function botonSon() {
    var btn = document.getElementById('boton-son');
    var txt = document.getElementById('boton-son-texto');
    if (!btn) return;
    btn.addEventListener('click', function () {
      sonidoActivo = !sonidoActivo;
      btn.setAttribute('aria-pressed', sonidoActivo ? 'true' : 'false');
      if (txt) txt.textContent = sonidoActivo ? 'Son: aceso' : 'Son: apagado';
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
      golpeSonido(intensidad || 0.7);
      setTimeout(function () { pandeireta.classList.remove('golpe'); }, 500);
    }

    pandeireta.addEventListener('click', function () { golpe(0.75); });
    pandeireta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); golpe(0.75); }
    });

    /* el cursor cerca inclina la pandereta (magnetic) */
    if (movimiento && !esTactil && escena) {
      var inclinaX = gsap.quickTo(pandeireta, 'rotation', { duration: 0.6, ease: 'power3.out' });
      escena.addEventListener('pointermove', function (e) {
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
    var boton = document.getElementById('pandeireta-boton');
    if (!movimiento) {
      if (boton) {
        cuandoVisible([document.getElementById('casa') || seccion], 0.01, function () { boton.hidden = false; boton.classList.add('visible'); });
      }
      return;
    }

    var contenido = seccion.querySelector('.hero__marco');
    gsap.set(pandeireta, { transformOrigin: '50% 50%' });

    var tl2 = gsap.timeline({ defaults: { ease: 'none' } });
    tl2.to(pandeireta, { scale: 0.16, rotation: 300, x: function () { return (window.innerWidth / 2 - 64) - pandeireta.getBoundingClientRect().width * 0.08; }, y: function () { return -(window.innerHeight / 2) + 60; }, duration: 1 }, 0)
      .to(contenido, { opacity: 0, y: -30, duration: 0.6 }, 0);

    window.ScrollTrigger.create({
      trigger: seccion,
      start: 'top top',
      end: '+=115%',
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      animation: tl2,
      onLeave: function () {
        if (boton) { boton.hidden = false; requestAnimationFrame(function () { boton.classList.add('visible'); }); }
      },
      onEnterBack: function () {
        if (boton) boton.classList.remove('visible');
      }
    });

    if (boton) {
      boton.addEventListener('click', function () {
        boton.classList.add('golpe');
        golpeSonido(0.55);
        setTimeout(function () { boton.classList.remove('golpe'); }, 600);
        irA('#carta');
      });
    }
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
      if (sonidoActivo) golpeSonido(0.3);
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
  })();

  /* ───────────────── cabecera + menú móvil ───────────────── */
  var cabecera = document.getElementById('cabecera');
  var boton = document.getElementById('hamburguesa');

  (function cabeceraFija() {
    if (!cabecera) return;
    window.addEventListener('scroll', function () {
      cabecera.classList.toggle('cabecera--fija', window.scrollY > 4);
    }, { passive: true });
  })();

  function cerrarMenu() {
    if (!cabecera || !boton || !cabecera.classList.contains('menu-abierto')) return;
    cabecera.classList.remove('menu-abierto');
    boton.setAttribute('aria-expanded', 'false');
    boton.querySelector('.visualmente-oculto').textContent = 'Abrir menú';
    if (lenis) lenis.start();
  }
  if (boton) {
    boton.addEventListener('click', function () {
      var abierto = cabecera.classList.toggle('menu-abierto');
      boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      boton.querySelector('.visualmente-oculto').textContent = abierto ? 'Cerrar menú' : 'Abrir menú';
      if (lenis) { if (abierto) lenis.stop(); else lenis.start(); }
    });
  }
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
    var nombres = ['domingo', 'luns', 'martes', 'mércores', 'xoves', 'venres', 'sábado'];
    var abrev = ['Dom', 'Lun', 'Mar', 'Mér', 'Xov', 'Ven', 'Sáb'];

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
      if (r.abierto) {
        txt.textContent = 'Aberto · pecha ás ' + hhmm(r.cierra);
      } else if (r.hoyMismo) {
        txt.textContent = 'Abrimos ás ' + hhmm(r.proximaHora);
      } else {
        txt.textContent = 'Volvemos o ' + nombres[r.proximoDia] + ' ás ' + hhmm(r.proximaHora);
      }
      pintarTabla(t.dia);
    }

    function pintarTabla(diaHoy) {
      var ul = document.getElementById('horario-tabla');
      if (!ul || ul.childElementCount) return;
      var filas = [
        [1, 'Pechado'], [2, 'Pechado'], [3, '10:00–1:00'], [4, '10:00–1:00'],
        [5, '10:00–1:00'], [6, '10:00–1:00'], [0, '10:00–1:00']
      ];
      filas.forEach(function (f) {
        var li = document.createElement('li');
        if (f[0] === diaHoy) li.className = 'hoy';
        li.innerHTML = '<span>' + abrev[f[0]] + '</span><span>' + f[1] + '</span>';
        ul.appendChild(li);
      });
    }

    pinta();
    setInterval(pinta, 30000);
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
        datos.secciones.forEach(function (sec, i) {
          var copla = document.createElement('article');
          copla.className = 'copla';
          copla.id = 'copla-' + sec.id;

          var cab = document.createElement('div');
          cab.className = 'copla__cab';
          var esEstribillo = sec.id === 'almorzos';
          cab.innerHTML =
            '<p class="copla__num">Copla ' + romano(i + 1) + '</p>' +
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
      if (contCoplas) contCoplas.innerHTML = '<p style="padding:2rem;opacity:.6">Non se puido cargar a carta.</p>';
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
        var x = 0, base = pista === pista1 ? 0.55 : 0.9;
        (function paso() {
          if (!html.classList.contains('densidad-sobria') || pista === pista1) {
            var ancho = grupo.offsetWidth || 1;
            x -= base;
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
