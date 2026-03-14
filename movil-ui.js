/* ═══════════════════════════════════════════════════════════════
   MOVIL-UI.JS — Navbar móvil estilo Clash Royale
   ═══════════════════════════════════════════════════════════════ */
(function () {
  if (window.innerWidth > 768) return;

  /* ── Detectar página ── */
  const path = window.location.pathname.toLowerCase();
  const pagina =
    path.includes("index") || path === "/" || path.endsWith("/") ? "inicio"
    : path.includes("historial") || path.includes("taller")      ? "talleres"
    : path.includes("coleccion")                                  ? "coleccion"
    : path.includes("comunidad")                                  ? "comunidad"
    : path.includes("tablon")                                     ? "tablon"
    : path.includes("quienes")                                    ? "quienes"
    : path.includes("entrada")                                    ? "entrada"
    : "inicio";

  /* ── Marcar entrada.html para el CSS ── */
  if (pagina === "entrada") document.body.classList.add("page-entrada");

  /* ══ 1. TOPBAR SUPERIOR ══ */
  const topbar = document.createElement("div");
  topbar.className = "mu-topbar";
  topbar.innerHTML = `
    <a href="index.html" class="mu-topbar-logo">
      <img src="Assets/Img/Logo.jpg" alt="Logo" onerror="this.style.display='none'">
      <span>Gato Miel</span>
    </a>
    <div class="mu-topbar-right" id="mu-topbar-right"></div>
  `;
  document.body.insertBefore(topbar, document.body.firstChild);

  /* ══ 2. NAVBAR INFERIOR ══ */
  const items = [
    { id:"inicio",    href:"index.html",                 label:"Inicio",   svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
    { id:"talleres",  href:"historial-De_Talleres.html", label:"Talleres", svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3S3 13.66 3 12"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>' },
    { id:"tablon",    href:"tablon-de-anuncios.html",    label:"Tablón",   center:true, svg:'<svg viewBox="0 0 24 24" fill="white" stroke="none"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>' },
    { id:"coleccion", href:"coleccion.html",             label:"Tienda",   svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>' },
    { id:"comunidad", href:"comunidad.html",             label:"Comunidad",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
  ];

  const navbar = document.createElement("nav");
  navbar.className = "mu-navbar";

  items.forEach(item => {
    const el = document.createElement("a");
    el.href = item.href;
    el.className = "mu-nav-item" + (item.center ? " mu-center-btn" : "") + (item.id === pagina ? " active" : "");
    el.setAttribute("aria-label", item.label);

    if (item.center) {
      el.innerHTML = `<div class="mu-center-circle">${item.svg}</div><span>${item.label}</span>`;
    } else {
      el.innerHTML = `${item.svg}<span>${item.label}</span>`;
    }

    // No recargar si ya estamos en esa página
    el.addEventListener("click", e => {
      if (item.id === pagina) { e.preventDefault(); window.scrollTo({top:0,behavior:"smooth"}); }
    });

    navbar.appendChild(el);
  });

  document.body.appendChild(navbar);

  /* ══ 3. OVERLAY + SHEET DE USUARIO ══ */
  const overlay = document.createElement("div");
  overlay.className = "mu-overlay";
  overlay.addEventListener("click", cerrarSheet);
  document.body.appendChild(overlay);

  const sheet = document.createElement("div");
  sheet.className = "mu-user-sheet";
  sheet.id = "mu-user-sheet";
  sheet.innerHTML = `
    <div class="mu-sheet-handle"></div>
    <div class="mu-sheet-avatar-row">
      <img class="mu-sheet-avatar" id="mu-sheet-avatar" src="Assets/Img/Avatares/GatoMiel.jpeg" alt="Avatar">
      <div>
        <div class="mu-sheet-name" id="mu-sheet-name">Invitado</div>
        <div class="mu-sheet-email" id="mu-sheet-email">Sin sesión iniciada</div>
      </div>
    </div>
    <div id="mu-sheet-btns"></div>
  `;
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

  /* ══ 4. FIREBASE AUTH ══ */
  function setupAuth(user) {
    const topbarRight = document.getElementById("mu-topbar-right");
    const sheetBtns   = document.getElementById("mu-sheet-btns");
    const sheetName   = document.getElementById("mu-sheet-name");
    const sheetEmail  = document.getElementById("mu-sheet-email");
    const sheetAvatar = document.getElementById("mu-sheet-avatar");

    if (user) {
      const avatarSrc = user.photoURL || "Assets/Img/Avatares/GatoMiel.jpeg";
      const nombre    = user.displayName || "Usuario";
      const email     = user.email || "";

      topbarRight.innerHTML = `<img class="mu-topbar-avatar" id="mu-topbar-avatar"
        src="${avatarSrc}" alt="${nombre}"
        onerror="this.src='Assets/Img/Avatares/GatoMiel.jpeg'">`;
      document.getElementById("mu-topbar-avatar").addEventListener("click", abrirSheet);

      sheetAvatar.src   = avatarSrc;
      sheetName.textContent  = nombre;
      sheetEmail.textContent = email;

      const btns = [
        { label:"🛍 Mis pedidos",      fn:"abrirModalCompras"    },
        { label:"🎫 Mis membresías",   fn:"abrirModalMembresias" },
        { label:"Personalizar perfil", fn:"abrirPersonalizar"    },
        { label:"Cerrar sesión",       fn:"cerrarSesion", danger:true },
      ];

      sheetBtns.innerHTML = "";
      btns.forEach(b => {
        const btn = document.createElement("button");
        btn.className = "mu-sheet-btn";
        if (b.danger) btn.style.color = "#f87171";
        btn.textContent = b.label;
        btn.addEventListener("click", () => {
          cerrarSheet();
          setTimeout(() => { if (typeof window[b.fn] === "function") window[b.fn](); }, 250);
        });
        sheetBtns.appendChild(btn);
      });

    } else {
      topbarRight.innerHTML = `<a href="entrada.html" class="mu-topbar-login">🐾 Entrar</a>`;
      sheetName.textContent  = "Invitado";
      sheetEmail.textContent = "Explora sin cuenta";
      sheetBtns.innerHTML = `
        <a href="entrada.html" style="display:flex;align-items:center;gap:12px;padding:13px 4px;
          color:#c48a3a;font-family:'Inter',sans-serif;font-size:14px;font-weight:600;
          text-decoration:none;border-bottom:1px solid rgba(255,255,255,0.06);">
          Iniciar sesión
        </a>`;
    }
  }

  // Esperar a que Firebase auth resuelva el usuario
  let tries = 0;
  const waitAuth = setInterval(() => {
    tries++;
    if (window._firebaseUser !== undefined) {
      clearInterval(waitAuth);
      setupAuth(window._firebaseUser);
    } else if (tries > 40) {
      clearInterval(waitAuth);
      setupAuth(null);
    }
  }, 100);

  /* ══ 5. LABEL FLOTANTE — solo aparece al hacer scroll hacia abajo ══ */
  const labels = {
    inicio:"Inicio", talleres:"Talleres", coleccion:"Colección",
    comunidad:"Comunidad", tablon:"Tablón", quienes:"Quiénes somos"
  };
  const labelText = labels[pagina];

  if (labelText) {
    const label = document.createElement("div");
    label.className = "mu-page-label";
    label.textContent = labelText;
    document.body.appendChild(label);

    let lastY = 0;
    window.addEventListener("scroll", () => {
      const sy = window.scrollY;
      // Solo mostrar si scrolleó hacia ABAJO y pasó de 100px
      if (sy > 100 && sy > lastY) {
        label.classList.add("visible");
      } else {
        label.classList.remove("visible");
      }
      lastY = sy;
    }, { passive: true });
  }

})();
