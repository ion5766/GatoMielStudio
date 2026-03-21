(function () {
  var W = window.innerWidth || document.documentElement.clientWidth;
  if (W > 768) return;

  var path = window.location.pathname.toLowerCase();
  if (path.includes("entrada") || path.includes("panel-admin")) {
    document.body.classList.add("mu-entrada");
    return;
  }

  var paginaActual =
    path.includes("historial") || (path.includes("taller") && !path.includes("tablon")) ? "talleres"
    : path.includes("coleccion")  ? "coleccion"
    : path.includes("comunidad")  ? "comunidad"
    : path.includes("tablon")     ? "tablon"
    : path.includes("quienes")    ? "quienes"
    : "inicio";

  var ADMIN_EMAILS = ["jhonanibal576@gmail.com","gatomielstudio@gmail.com"];

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

  /* ══ NAVBAR PAGES ══
     6 items: talleres · coleccion · [INICIO center] · quienes · comunidad · tablon
     To keep center button in the middle, arrange: left3 + center + right2
     Order: talleres, coleccion, INICIO(center), quienes, comunidad [tablon in sheet]
  */
  var PAGINAS = [
    { id:"talleres",  href:"historial-De_Talleres.html", label:"Talleres",
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3S3 13.66 3 12"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>' },
    { id:"coleccion", href:"coleccion.html", label:"Tienda",
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>' },
    { id:"inicio",    href:"index.html", label:"Inicio", center:true,
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
    { id:"quienes",   href:"quienes-somos.html", label:"Nosotros",
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg>' },
    { id:"comunidad", href:"comunidad.html", label:"Comunidad",
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
  ];

  /* Tablón shown in user sheet menu */

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
      if (item.id === paginaActual) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    navbar.appendChild(a);
  });

  document.body.appendChild(navbar);

  /* ══ SWIPE NAVIGATION ══ */
  var ORDEN = ["talleres","coleccion","inicio","quienes","comunidad"];
  var HREFS  = {
    talleres: "historial-De_Talleres.html",
    coleccion: "coleccion.html",
    inicio: "index.html",
    quienes: "quienes-somos.html",
    comunidad: "comunidad.html"
  };
  var idxActual = ORDEN.indexOf(paginaActual);
  if (idxActual === -1) idxActual = 2; // default to inicio

  var touchX = 0, touchY = 0, swipeOK = true;

  document.addEventListener("touchstart", function(e) {
    touchX = e.changedTouches[0].clientX;
    touchY = e.changedTouches[0].clientY;
    swipeOK = true;
  }, { passive: true });

  document.addEventListener("touchmove", function(e) {
    if (Math.abs(e.changedTouches[0].clientY - touchY) > Math.abs(e.changedTouches[0].clientX - touchX)) {
      swipeOK = false;
    }
  }, { passive: true });

  document.addEventListener("touchend", function(e) {
    if (!swipeOK) return;
    var dx = e.changedTouches[0].clientX - touchX;
    var dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 1.8) return;
    // Don't swipe if a modal is open
    if (document.querySelector('.cl-modal.open, .ht-modal[style*="flex"], [id*="overlay"][style*="flex"]')) return;
    var destIdx = dx < 0 ? idxActual + 1 : idxActual - 1;
    if (destIdx < 0 || destIdx >= ORDEN.length) return;
    // Animate out
    document.body.style.opacity = "0";
    document.body.style.transform = "translateX(" + (dx < 0 ? "-20px" : "20px") + ")";
    document.body.style.transition = "opacity 0.15s, transform 0.15s";
    setTimeout(function() {
      window.location.href = HREFS[ORDEN[destIdx]];
    }, 150);
  }, { passive: true });

  /* ══ OVERLAY + SHEET ══ */
  var overlay = document.createElement("div");
  overlay.className = "mu-overlay";
  overlay.addEventListener("click", cerrarSheet);
  document.body.appendChild(overlay);

  var sheet = document.createElement("div");
  sheet.className = "mu-user-sheet";
  sheet.innerHTML =
    '<div class="mu-sheet-handle"></div>' +
    '<div class="mu-sheet-avatar-row">' +
      '<img class="mu-sheet-avatar" id="mu-sheet-avatar" src="Assets/Img/Avatares/GatoMiel.jpeg" onerror="this.src=\'Assets/Img/Avatares/GatoMiel.jpeg\'">' +
      '<div>' +
        '<div class="mu-sheet-name" id="mu-sheet-name">Invitada</div>' +
        '<div class="mu-sheet-email" id="mu-sheet-email">Explora sin cuenta</div>' +
      '</div>' +
    '</div>' +
    '<div id="mu-sheet-btns" class="mu-sheet-btns"></div>';
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

  /* ══ AUTH STATE POLLING ══ */
  function setupAuth(user) {
    var tr = document.getElementById("mu-topbar-right");
    if (!tr) return;
    var isAdmin = user && ADMIN_EMAILS.indexOf((user.email || "").toLowerCase()) !== -1;

    if (user) {
      var src = user.photoURL || "Assets/Img/Avatares/GatoMiel.jpeg";

      var html = '<img class="mu-topbar-avatar" id="mu-topbar-avatar" src="' + src + '" onerror="this.src=\'Assets/Img/Avatares/GatoMiel.jpeg\'">';
      if (isAdmin) {
        html += '<button class="mu-admin-btn" id="mu-admin-btn-topbar" title="Panel admin">' +
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07"/><path d="M4.93 4.93A10 10 0 0 1 19.07 19.07"/></svg>' +
          '<span id="mu-admin-badge"></span>' +
          '</button>';
      }
      tr.innerHTML = html;

      var av = document.getElementById("mu-topbar-avatar");
      if (av) av.addEventListener("click", abrirSheet);

      // Admin button opens admin panel
      var adminTopBtn = document.getElementById("mu-admin-btn-topbar");
      if (adminTopBtn) {
        adminTopBtn.addEventListener("click", function() {
          if (typeof window.abrirModoAdmin === "function") {
            window.abrirModoAdmin();
          } else {
            window.location.href = "index.html#admin";
          }
        });
      }

      // Update sheet
      var el;
      el = document.getElementById("mu-sheet-avatar"); if(el) { el.src = src; }
      el = document.getElementById("mu-sheet-name");   if(el) el.textContent = user.displayName || "Usuaria";
      el = document.getElementById("mu-sheet-email");  if(el) el.textContent = user.email || "";

      // Sheet buttons
      var sb = document.getElementById("mu-sheet-btns");
      if (sb) {
        var acc = isAdmin
          ? [
              { l:"⚙️ Panel admin",    f:"abrirModoAdmin" },
              { l:"🛍 Mis pedidos",     f:"abrirModalCompras" },
              { l:"🎫 Mis membresías",  f:"abrirModalMembresias" },
              { l:"📋 Tablón",          href:"tablon-de-anuncios.html" },
              { l:"Personalizar",       f:"abrirPersonalizar" },
              { l:"Cerrar sesión",      f:"cerrarSesion", danger:true },
            ]
          : [
              { l:"🛍 Mis pedidos",     f:"abrirModalCompras" },
              { l:"🎫 Mis membresías",  f:"abrirModalMembresias" },
              { l:"📋 Tablón",          href:"tablon-de-anuncios.html" },
              { l:"Personalizar",       f:"abrirPersonalizar" },
              { l:"Cerrar sesión",      f:"cerrarSesion", danger:true },
            ];

        sb.innerHTML = "";
        acc.forEach(function(a) {
          if (a.href) {
            var lnk = document.createElement("a");
            lnk.href = a.href;
            lnk.className = "mu-sheet-btn";
            lnk.style.cssText = "text-decoration:none;color:#f0ebe4;";
            lnk.textContent = a.l;
            lnk.addEventListener("click", cerrarSheet);
            sb.appendChild(lnk);
            return;
          }
          var btn = document.createElement("button");
          btn.className = "mu-sheet-btn";
          if (a.danger) {
            btn.style.color = "#f87171";
            btn.style.borderColor = "rgba(239,68,68,0.15)";
          }
          btn.textContent = a.l;
          btn.addEventListener("click", function() {
            cerrarSheet();
            setTimeout(function() {
              if (typeof window[a.f] === "function") window[a.f]();
            }, 260);
          });
          sb.appendChild(btn);
        });
      }

      /* Admin badge — live chat count */
      if (isAdmin) {
        setTimeout(function() {
          var s = document.createElement("script");
          s.type = "module";
          s.textContent =
            'import{initializeApp,getApps}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";' +
            'import{getFirestore,collection,query,where,onSnapshot}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";' +
            'const _a=getApps().length?getApps()[0]:initializeApp({apiKey:"AIzaSyBiJkhAd08hv_fjqGMYOvr-vYXudlj5aSs",authDomain:"gato-miel-estudio.firebaseapp.com",projectId:"gato-miel-estudio",storageBucket:"gato-miel-estudio.firebasestorage.app",messagingSenderId:"150671559458",appId:"1:150671559458:web:6daaf4a78150706db0337b"});' +
            'const _db=getFirestore(_a);' +
            'onSnapshot(query(collection(_db,"chats"),where("noLeidosAdmin","==",true)),function(snap){' +
            '  var b=document.getElementById("mu-admin-badge");if(!b)return;' +
            '  if(snap.size>0){b.textContent=snap.size>9?"9+":snap.size;b.style.display="flex";}' +
            '  else{b.style.display="none";}' +
            '});';
          document.head.appendChild(s);
        }, 1200);
      }

    } else {
      // Guest
      tr.innerHTML = '<a href="entrada.html" class="mu-topbar-login">🐾 Entrar</a>';

      var sb2 = document.getElementById("mu-sheet-btns");
      if (sb2) {
        sb2.innerHTML =
          '<a href="entrada.html" class="mu-sheet-btn" style="text-decoration:none;color:#c48a3a;font-weight:600;border-color:rgba(196,138,58,0.25);background:rgba(196,138,58,0.06);">🐾 Iniciar sesión / Crear cuenta</a>' +
          '<a href="tablon-de-anuncios.html" class="mu-sheet-btn" style="text-decoration:none;color:#f0ebe4;">📋 Tablón de anuncios</a>';
      }
    }
  }

  /* Poll for Firebase user */
  var tries = 0;
  var t = setInterval(function() {
    tries++;
    if (typeof window._firebaseUser !== "undefined") {
      clearInterval(t);
      setupAuth(window._firebaseUser);
    } else if (tries > 60) {
      clearInterval(t);
      setupAuth(null);
    }
  }, 100);

})();
