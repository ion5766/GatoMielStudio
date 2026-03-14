/* ═══════════════════════════════════════════════════════════
   MOVIL-UI.JS — Navegación estilo Clash Royale
   Deslizamiento horizontal entre páginas en móvil
   ═══════════════════════════════════════════════════════════ */
(function () {
  var W = window.innerWidth || document.documentElement.clientWidth;
  if (W > 768) return;

  var path    = window.location.pathname.toLowerCase();
  var esEntrada = path.includes("entrada");
  if (esEntrada) { document.body.classList.add("mu-entrada"); return; }

  /* ── Orden de páginas (igual que Clash Royale de izq a der) ── */
  var PAGINAS = [
    { id:"talleres",  href:"historial-De_Talleres.html", label:"Talleres",
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3S3 13.66 3 12"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>' },
    { id:"coleccion", href:"coleccion.html",             label:"Tienda",
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>' },
    { id:"inicio",    href:"index.html",                 label:"Inicio",   center:true,
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
    { id:"comunidad", href:"comunidad.html",             label:"Comunidad",
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
    { id:"tablon",    href:"tablon-de-anuncios.html",    label:"Tablón",
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' },
  ];

  /* ── Página actual ── */
  var paginaActual =
    path.includes("historial") || path.includes("taller-1") ? "talleres"
    : path.includes("coleccion")  ? "coleccion"
    : path.includes("comunidad")  ? "comunidad"
    : path.includes("tablon")     ? "tablon"
    : "inicio";

  var idxActual = PAGINAS.findIndex(function(p){ return p.id === paginaActual; });
  if (idxActual < 0) idxActual = 2; // inicio por defecto

  var idxPrev = idxActual - 1;
  var idxNext = idxActual + 1;
  var paginaPrev = idxPrev >= 0          ? PAGINAS[idxPrev] : null;
  var paginaNext = idxNext < PAGINAS.length ? PAGINAS[idxNext] : null;

  /* ══ TOPBAR ══ */
  var topbar = document.createElement("div");
  topbar.className = "mu-topbar";
  topbar.innerHTML =
    '<a href="index.html" class="mu-topbar-logo">' +
      '<img src="Assets/Img/Logo.jpg" alt="GM" onerror="this.style.display=\'none\'">' +
      '<span>Gato Miel</span>' +
    '</a>' +
    '<div class="mu-topbar-right" id="mu-topbar-right"></div>';
  document.body.insertBefore(topbar, document.body.firstChild);

  /* ══ FLECHAS LATERALES (estilo Clash Royale) ══ */
  if (paginaPrev) {
    var btnPrev = document.createElement("a");
    btnPrev.href = paginaPrev.href;
    btnPrev.className = "mu-arrow mu-arrow-left";
    btnPrev.setAttribute("aria-label", "Ir a " + paginaPrev.label);
    btnPrev.innerHTML =
      '<div class="mu-arrow-btn">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
      '</div>' +
      '<span class="mu-arrow-label">' + paginaPrev.label + '</span>';
    document.body.appendChild(btnPrev);
  }

  if (paginaNext) {
    var btnNext = document.createElement("a");
    btnNext.href = paginaNext.href;
    btnNext.className = "mu-arrow mu-arrow-right";
    btnNext.setAttribute("aria-label", "Ir a " + paginaNext.label);
    btnNext.innerHTML =
      '<div class="mu-arrow-btn">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
      '</div>' +
      '<span class="mu-arrow-label">' + paginaNext.label + '</span>';
    document.body.appendChild(btnNext);
  }

  /* ══ NAVBAR INFERIOR ══ */
  var navbar = document.createElement("nav");
  navbar.className = "mu-navbar";

  PAGINAS.forEach(function(item) {
    var a = document.createElement("a");
    a.href = item.href;
    a.className = "mu-nav-item" + (item.center ? " mu-center-btn" : "") + (item.id === paginaActual ? " active" : "");
    a.setAttribute("aria-label", item.label);

    if (item.center) {
      a.innerHTML = '<div class="mu-center-circle">' + item.svg + '</div><span>' + item.label + '</span>';
    } else {
      a.innerHTML = item.svg + '<span>' + item.label + '</span>';
    }

    a.addEventListener("click", function(e) {
      if (item.id === paginaActual) { e.preventDefault(); window.scrollTo({top:0,behavior:"smooth"}); }
    });
    navbar.appendChild(a);
  });

  document.body.appendChild(navbar);

  /* ══ SWIPE táctil ══ */
  var touchStartX = 0;
  var touchStartY = 0;
  var swipeUmbral = 60; // px mínimos para considerar swipe

  document.addEventListener("touchstart", function(e) {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });

  document.addEventListener("touchend", function(e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;

    // Solo swipe si el movimiento horizontal es mayor al vertical
    if (Math.abs(dx) < swipeUmbral || Math.abs(dx) < Math.abs(dy) * 1.5) return;

    if (dx < 0 && paginaNext) {
      // Swipe izquierda → página siguiente
      _irAPagina(paginaNext.href);
    } else if (dx > 0 && paginaPrev) {
      // Swipe derecha → página anterior
      _irAPagina(paginaPrev.href);
    }
  }, { passive: true });

  function _irAPagina(href) {
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.18s";
    setTimeout(function() { window.location.href = href; }, 180);
  }

  /* ══ SHEET USUARIO ══ */
  var overlay = document.createElement("div");
  overlay.className = "mu-overlay";
  overlay.addEventListener("click", cerrarSheet);
  document.body.appendChild(overlay);

  var sheet = document.createElement("div");
  sheet.className = "mu-user-sheet";
  sheet.innerHTML =
    '<div class="mu-sheet-handle"></div>' +
    '<div class="mu-sheet-avatar-row">' +
      '<img class="mu-sheet-avatar" id="mu-sheet-avatar" src="Assets/Img/Avatares/GatoMiel.jpeg">' +
      '<div>' +
        '<div class="mu-sheet-name" id="mu-sheet-name">Invitado</div>' +
        '<div class="mu-sheet-email" id="mu-sheet-email">Explora sin cuenta</div>' +
      '</div>' +
    '</div>' +
    '<div id="mu-sheet-btns"></div>';
  document.body.appendChild(sheet);

  function abrirSheet() {
    sheet.classList.add("open");
    overlay.classList.add("visible");
    document.body.style.overflow = "hidden";
  }
  function cerrarSheet() {
    sheet.classList.remove("open");
    overlay.classList.remove("visible");
    document.body.style.overflow = "";
  }

  /* ══ AUTH ══ */
  function setupAuth(user) {
    var tr = document.getElementById("mu-topbar-right");
    if (!tr) return;
    if (user) {
      var src = user.photoURL || "Assets/Img/Avatares/GatoMiel.jpeg";
      tr.innerHTML = '<img class="mu-topbar-avatar" id="mu-topbar-avatar" src="' + src + '" onerror="this.src=\'Assets/Img/Avatares/GatoMiel.jpeg\'">';
      var av = document.getElementById("mu-topbar-avatar");
      if (av) av.addEventListener("click", abrirSheet);
      var el;
      el = document.getElementById("mu-sheet-avatar"); if(el) el.src = src;
      el = document.getElementById("mu-sheet-name");   if(el) el.textContent = user.displayName || "Usuario";
      el = document.getElementById("mu-sheet-email");  if(el) el.textContent = user.email || "";
      var sb = document.getElementById("mu-sheet-btns");
      if (sb) {
        var acc = [
          {l:"🛍 Mis pedidos",      f:"abrirModalCompras"},
          {l:"🎫 Mis membresías",   f:"abrirModalMembresias"},
          {l:"Personalizar perfil", f:"abrirPersonalizar"},
          {l:"Cerrar sesión",       f:"cerrarSesion", d:true},
        ];
        sb.innerHTML = "";
        acc.forEach(function(a) {
          var btn = document.createElement("button");
          btn.className = "mu-sheet-btn";
          if (a.d) btn.style.color = "#f87171";
          btn.textContent = a.l;
          btn.addEventListener("click", function() {
            cerrarSheet();
            setTimeout(function(){ if(typeof window[a.f]==="function") window[a.f](); }, 250);
          });
          sb.appendChild(btn);
        });
      }
    } else {
      tr.innerHTML = '<a href="entrada.html" class="mu-topbar-login">🐾 Entrar</a>';
      var sn = document.getElementById("mu-sheet-name");  if(sn) sn.textContent = "Invitado";
      var se = document.getElementById("mu-sheet-email"); if(se) se.textContent = "Explora sin cuenta";
      var sb2 = document.getElementById("mu-sheet-btns");
      if(sb2) sb2.innerHTML = '<a href="entrada.html" style="display:block;padding:13px 2px;color:#c48a3a;font-family:Inter,sans-serif;font-size:14px;font-weight:600;text-decoration:none;">Iniciar sesión</a>';
    }
  }

  var tries = 0;
  var t = setInterval(function() {
    tries++;
    if (typeof window._firebaseUser !== "undefined") { clearInterval(t); setupAuth(window._firebaseUser); }
    else if (tries > 50) { clearInterval(t); setupAuth(null); }
  }, 100);

})();
