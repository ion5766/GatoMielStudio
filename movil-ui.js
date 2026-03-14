(function () {
  if (window.innerWidth > 768) return;

  /* ── Detectar página ── */
  const path = window.location.pathname.toLowerCase();
  const esEntrada = path.includes("entrada");

  /* ── entrada.html: no inyectar NADA, solo marcar el body ── */
  if (esEntrada) {
    document.body.classList.add("mu-entrada");
    return; // salir, no crear topbar ni navbar
  }

  const pagina =
    path.includes("index") || path === "/" || path.endsWith("/") ? "inicio"
    : path.includes("historial") || path.includes("taller")      ? "talleres"
    : path.includes("coleccion")                                  ? "coleccion"
    : path.includes("comunidad")                                  ? "comunidad"
    : path.includes("tablon")                                     ? "tablon"
    : path.includes("quienes")                                    ? "quienes"
    : "inicio";

  /* ══ TOPBAR ══ */
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

  /* ══ NAVBAR ══ */
  const items = [
    { id:"inicio",    href:"index.html",                 label:"Inicio",
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
    { id:"talleres",  href:"historial-De_Talleres.html", label:"Talleres",
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3S3 13.66 3 12"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>' },
    { id:"tablon",    href:"tablon-de-anuncios.html",    label:"Tablón",   center:true,
      svg:'<svg viewBox="0 0 24 24" fill="white" stroke="none"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>' },
    { id:"coleccion", href:"coleccion.html",             label:"Tienda",
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>' },
    { id:"comunidad", href:"comunidad.html",             label:"Comunidad",
      svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
  ];

  const navbar = document.createElement("nav");
  navbar.className = "mu-navbar";
  items.forEach(item => {
    const el = document.createElement("a");
    el.href = item.href;
    el.className = "mu-nav-item" + (item.center ? " mu-center-btn" : "") + (item.id === pagina ? " active" : "");
    el.setAttribute("aria-label", item.label);
    el.innerHTML = item.center
      ? `<div class="mu-center-circle">${item.svg}</div><span>${item.label}</span>`
      : `${item.svg}<span>${item.label}</span>`;
    el.addEventListener("click", e => {
      if (item.id === pagina) { e.preventDefault(); window.scrollTo({top:0,behavior:"smooth"}); }
    });
    navbar.appendChild(el);
  });
  document.body.appendChild(navbar);

  /* ══ OVERLAY + SHEET ══ */
  const overlay = document.createElement("div");
  overlay.className = "mu-overlay";
  overlay.addEventListener("click", cerrarSheet);
  document.body.appendChild(overlay);

  const sheet = document.createElement("div");
  sheet.className = "mu-user-sheet";
  sheet.innerHTML = `
    <div class="mu-sheet-handle"></div>
    <div class="mu-sheet-avatar-row">
      <img class="mu-sheet-avatar" id="mu-sheet-avatar" src="Assets/Img/Avatares/GatoMiel.jpeg" alt="">
      <div>
        <div class="mu-sheet-name"  id="mu-sheet-name">Invitado</div>
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

  /* ══ AUTH ══ */
  function setupAuth(user) {
    const tr = document.getElementById("mu-topbar-right");
    if (user) {
      const src    = user.photoURL || "Assets/Img/Avatares/GatoMiel.jpeg";
      const nombre = user.displayName || "Usuario";
      tr.innerHTML = `<img class="mu-topbar-avatar" id="mu-topbar-avatar"
        src="${src}" onerror="this.src='Assets/Img/Avatares/GatoMiel.jpeg'">`;
      document.getElementById("mu-topbar-avatar").addEventListener("click", abrirSheet);
      document.getElementById("mu-sheet-avatar").src  = src;
      document.getElementById("mu-sheet-name").textContent  = nombre;
      document.getElementById("mu-sheet-email").textContent = user.email || "";
      const acciones = [
        { label:"🛍 Mis pedidos",      fn:"abrirModalCompras"    },
        { label:"🎫 Mis membresías",   fn:"abrirModalMembresias" },
        { label:"Personalizar perfil", fn:"abrirPersonalizar"    },
        { label:"Cerrar sesión",       fn:"cerrarSesion", danger:true },
      ];
      const sb = document.getElementById("mu-sheet-btns");
      sb.innerHTML = "";
      acciones.forEach(a => {
        const btn = document.createElement("button");
        btn.className = "mu-sheet-btn";
        if (a.danger) btn.style.color = "#f87171";
        btn.textContent = a.label;
        btn.addEventListener("click", () => {
          cerrarSheet();
          setTimeout(() => { if (typeof window[a.fn]==="function") window[a.fn](); }, 250);
        });
        sb.appendChild(btn);
      });
    } else {
      tr.innerHTML = `<a href="entrada.html" class="mu-topbar-login">🐾 Entrar</a>`;
      document.getElementById("mu-sheet-name").textContent  = "Invitado";
      document.getElementById("mu-sheet-email").textContent = "Explora sin cuenta";
      document.getElementById("mu-sheet-btns").innerHTML =
        `<a href="entrada.html" style="display:flex;align-items:center;padding:13px 4px;
          color:#c48a3a;font-family:'Inter',sans-serif;font-size:14px;font-weight:600;
          text-decoration:none;">Iniciar sesión</a>`;
    }
  }

  let tries = 0;
  const t = setInterval(() => {
    tries++;
    if (window._firebaseUser !== undefined) { clearInterval(t); setupAuth(window._firebaseUser); }
    else if (tries > 40)                    { clearInterval(t); setupAuth(null); }
  }, 100);

  /* ══ LABEL FLOTANTE ══ */
  const labels = { inicio:"Inicio", talleres:"Talleres", coleccion:"Colección",
                   comunidad:"Comunidad", tablon:"Tablón", quienes:"Quiénes somos" };
  if (labels[pagina]) {
    const lbl = document.createElement("div");
    lbl.className = "mu-page-label";
    lbl.textContent = labels[pagina];
    document.body.appendChild(lbl);
    let lastY = 0;
    window.addEventListener("scroll", () => {
      const sy = window.scrollY;
      lbl.classList.toggle("visible", sy > 100 && sy > lastY);
      lastY = sy;
    }, { passive:true });
  }

})();
