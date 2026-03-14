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

  /* ══ NAVBAR ══ */
  var PAGINAS = [
    { id:"talleres",  href:"historial-De_Talleres.html", label:"Talleres",
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3S3 13.66 3 12"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>' },
    { id:"coleccion", href:"coleccion.html", label:"Tienda",
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>' },
    { id:"inicio",    href:"index.html", label:"Inicio", center:true,
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
    { id:"comunidad", href:"comunidad.html", label:"Comunidad",
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
    { id:"tablon",    href:"tablon-de-anuncios.html", label:"Tablón",
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' },
  ];

  var navbar = document.createElement("nav");
  navbar.className = "mu-navbar";
  PAGINAS.forEach(function(item) {
    var a = document.createElement("a");
    a.href = item.href;
    a.className = "mu-nav-item" + (item.center ? " mu-center-btn" : "") + (item.id === paginaActual ? " active" : "");
    a.setAttribute("aria-label", item.label);
    a.innerHTML = item.center
      ? '<div class="mu-center-circle">' + item.svg + '</div><span>' + item.label + '</span>'
      : item.svg + '<span>' + item.label + '</span>';
    a.addEventListener("click", function(e) {
      if (item.id === paginaActual) { e.preventDefault(); window.scrollTo({top:0,behavior:"smooth"}); }
    });
    navbar.appendChild(a);
  });
  document.body.appendChild(navbar);

  /* ══ SWIPE ══ */
  var ORDEN = ["talleres","coleccion","inicio","comunidad","tablon"];
  var HREFS  = { talleres:"historial-De_Talleres.html", coleccion:"coleccion.html", inicio:"index.html", comunidad:"comunidad.html", tablon:"tablon-de-anuncios.html" };
  var idxActual = ORDEN.indexOf(paginaActual);
  var touchX = 0, touchY = 0, swipeOK = true;

  document.addEventListener("touchstart", function(e) {
    touchX = e.changedTouches[0].clientX;
    touchY = e.changedTouches[0].clientY;
    swipeOK = true;
  }, { passive:true });
  document.addEventListener("touchmove", function(e) {
    if (Math.abs(e.changedTouches[0].clientY - touchY) > Math.abs(e.changedTouches[0].clientX - touchX)) swipeOK = false;
  }, { passive:true });
  document.addEventListener("touchend", function(e) {
    if (!swipeOK) return;
    var dx = e.changedTouches[0].clientX - touchX;
    var dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 1.8) return;
    if (document.querySelector('.cl-modal.open,[id*="modal"][style*="flex"],[id*="Modal"][style*="flex"]')) return;
    var destIdx = dx < 0 ? idxActual + 1 : idxActual - 1;
    if (destIdx < 0 || destIdx >= ORDEN.length) return;
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.15s";
    setTimeout(function(){ window.location.href = HREFS[ORDEN[destIdx]]; }, 150);
  }, { passive:true });

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
      '<img class="mu-sheet-avatar" id="mu-sheet-avatar" src="Assets/Img/Avatares/GatoMiel.jpeg">' +
      '<div><div class="mu-sheet-name" id="mu-sheet-name">Invitado</div>' +
      '<div class="mu-sheet-email" id="mu-sheet-email">Explora sin cuenta</div></div>' +
    '</div><div id="mu-sheet-btns"></div>';
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
    var isAdmin = user && ADMIN_EMAILS.indexOf((user.email||"").toLowerCase()) !== -1;

    if (user) {
      var src = user.photoURL || "Assets/Img/Avatares/GatoMiel.jpeg";
      var html = '<img class="mu-topbar-avatar" id="mu-topbar-avatar" src="' + src + '" onerror="this.src=\'Assets/Img/Avatares/GatoMiel.jpeg\'">';
      if (isAdmin) {
        html += '<a href="panel-admin.html" class="mu-admin-btn" id="mu-admin-btn">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
          '<span id="mu-admin-badge"></span></a>';
      }
      tr.innerHTML = html;
      var av = document.getElementById("mu-topbar-avatar");
      if (av) av.addEventListener("click", abrirSheet);

      var el;
      el = document.getElementById("mu-sheet-avatar"); if(el) el.src = src;
      el = document.getElementById("mu-sheet-name");   if(el) el.textContent = user.displayName || "Usuario";
      el = document.getElementById("mu-sheet-email");  if(el) el.textContent = user.email || "";

      var sb = document.getElementById("mu-sheet-btns");
      if (sb) {
        var acc = isAdmin
          ? [{l:"💬 Panel de mensajes", href:"panel-admin.html"}, {l:"Personalizar perfil",f:"abrirPersonalizar"}, {l:"Cerrar sesión",f:"cerrarSesion",d:true}]
          : [{l:"🛍 Mis pedidos",f:"abrirModalCompras"},{l:"🎫 Mis membresías",f:"abrirModalMembresias"},{l:"Personalizar perfil",f:"abrirPersonalizar"},{l:"Cerrar sesión",f:"cerrarSesion",d:true}];
        sb.innerHTML = "";
        acc.forEach(function(a) {
          if (a.href) {
            var lnk = document.createElement("a");
            lnk.href = a.href; lnk.className = "mu-sheet-btn";
            lnk.style.textDecoration = "none"; lnk.textContent = a.l;
            sb.appendChild(lnk); return;
          }
          var btn = document.createElement("button");
          btn.className = "mu-sheet-btn";
          if (a.d) btn.style.color = "#f87171";
          btn.textContent = a.l;
          btn.addEventListener("click", function() {
            cerrarSheet();
            setTimeout(function(){
              if (typeof window[a.f]==="function") window[a.f]();
            }, 250);
          });
          sb.appendChild(btn);
        });
      }

      /* Badge en tiempo real para admin */
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
      tr.innerHTML = '<a href="entrada.html" class="mu-topbar-login">🐾 Entrar</a>';
      var sn=document.getElementById("mu-sheet-name"); if(sn) sn.textContent="Invitado";
      var se=document.getElementById("mu-sheet-email"); if(se) se.textContent="Explora sin cuenta";
      var sb2=document.getElementById("mu-sheet-btns");
      if(sb2) sb2.innerHTML='<a href="entrada.html" style="display:block;padding:13px 2px;color:#c48a3a;font-family:Inter,sans-serif;font-size:14px;font-weight:600;text-decoration:none;">Iniciar sesión</a>';
    }
  }

  var tries=0, t=setInterval(function(){
    tries++;
    if(typeof window._firebaseUser!=="undefined"){clearInterval(t);setupAuth(window._firebaseUser);}
    else if(tries>60){clearInterval(t);setupAuth(null);}
  },100);

})();
