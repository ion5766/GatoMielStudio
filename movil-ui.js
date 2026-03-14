/* ═══════════════════════════════════════════════════════════════
   MOVIL-UI.JS — Inyecta la navbar estilo Clash Royale en móvil
   Incluir en cada HTML: <script src="movil-ui.js"></script>
   ═══════════════════════════════════════════════════════════════ */

(function () {
  // Solo actuar en móvil
  if (window.innerWidth > 768) return;

  /* ── Detectar página actual ── */
  const path = window.location.pathname.toLowerCase();
  const pagina =
    path.includes("index") || path === "/" || path.endsWith("/")
      ? "inicio"
      : path.includes("historial") || path.includes("taller")
      ? "talleres"
      : path.includes("coleccion")
      ? "coleccion"
      : path.includes("comunidad")
      ? "comunidad"
      : path.includes("tablon")
      ? "tablon"
      : path.includes("quienes")
      ? "quienes"
      : path.includes("entrada")
      ? "entrada"
      : "inicio";

  /* ══ 1. TOPBAR SUPERIOR ══ */
  const topbar = document.createElement("div");
  topbar.className = "mu-topbar";
  topbar.innerHTML = `
    <a href="index.html" class="mu-topbar-logo">
      <img src="Assets/Img/Logo.jpg" alt="Logo" onerror="this.style.display='none'">
      <span>Gato Miel</span>
    </a>
    <div class="mu-topbar-right" id="mu-topbar-right">
      <!-- Se rellena con Firebase -->
    </div>
  `;
  document.body.insertBefore(topbar, document.body.firstChild);

  /* ══ 2. NAVBAR INFERIOR ══ */
  const items = [
    {
      id: "inicio",
      href: "index.html",
      label: "Inicio",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>`,
    },
    {
      id: "talleres",
      href: "historial-De_Talleres.html",
      label: "Talleres",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="8" r="6"/>
              <path d="M12 14c-5 0-8 2.5-8 4v2h16v-2c0-1.5-3-4-8-4z"/>
            </svg>`,
    },
    {
      id: "tablon",
      href: "tablon-de-anuncios.html",
      label: "Tablón",
      center: true,
      svg: `<svg viewBox="0 0 24 24" fill="white" stroke="none">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>`,
    },
    {
      id: "coleccion",
      href: "coleccion.html",
      label: "Tienda",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>`,
    },
    {
      id: "comunidad",
      href: "comunidad.html",
      label: "Comunidad",
      svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>`,
    },
  ];

  const navbar = document.createElement("nav");
  navbar.className = "mu-navbar";
  navbar.setAttribute("role", "navigation");
  navbar.setAttribute("aria-label", "Navegación principal");

  items.forEach((item) => {
    const el = document.createElement("a");
    el.href = item.href;
    el.className =
      "mu-nav-item" +
      (item.center ? " mu-center-btn" : "") +
      (item.id === pagina ? " active" : "");
    el.setAttribute("aria-label", item.label);

    if (item.center) {
      el.innerHTML = `
        <div class="mu-center-circle">${item.svg}</div>
        <span>${item.label}</span>
      `;
    } else {
      el.innerHTML = `${item.svg}<span>${item.label}</span>`;
    }

    // Evitar recarga si ya estamos en esa página
    el.addEventListener("click", (e) => {
      if (item.id === pagina) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    navbar.appendChild(el);
  });

  document.body.appendChild(navbar);

  /* ══ 3. SHEET DE USUARIO (bottom drawer) ══ */
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

  /* ══ 4. INTEGRAR CON FIREBASE AUTH (si está disponible) ══ */
  function setupAuth(user) {
    const topbarRight = document.getElementById("mu-topbar-right");
    const sheetBtns = document.getElementById("mu-sheet-btns");
    const sheetName = document.getElementById("mu-sheet-name");
    const sheetEmail = document.getElementById("mu-sheet-email");
    const sheetAvatar = document.getElementById("mu-sheet-avatar");

    if (user) {
      // Usuario logueado
      const avatarSrc =
        user.photoURL || "Assets/Img/Avatares/GatoMiel.jpeg";
      const nombre = user.displayName || "Usuario";
      const email = user.email || "";

      // Topbar: avatar clickable
      topbarRight.innerHTML = `
        <img class="mu-topbar-avatar" id="mu-topbar-avatar"
          src="${avatarSrc}" alt="${nombre}"
          onerror="this.src='Assets/Img/Avatares/GatoMiel.jpeg'">
      `;
      document.getElementById("mu-topbar-avatar").addEventListener("click", abrirSheet);

      // Sheet info
      sheetAvatar.src = avatarSrc;
      sheetName.textContent = nombre;
      sheetEmail.textContent = email;

      // Botones del sheet
      const btns = [
        { label: "🛍 Mis pedidos",    action: "abrirModalCompras",    icon: svgBag() },
        { label: "🎫 Mis membresías", action: "abrirModalMembresias", icon: svgTicket() },
        { label: "Personalizar perfil", action: "abrirPersonalizar",  icon: svgEdit() },
        { label: "Cerrar sesión",       action: "cerrarSesion",       icon: svgLogout(), danger: true },
      ];

      sheetBtns.innerHTML = "";
      btns.forEach((b) => {
        const btn = document.createElement("button");
        btn.className = "mu-sheet-btn";
        if (b.danger) btn.style.color = "#f87171";
        btn.innerHTML = `${b.icon}<span>${b.label}</span>`;
        btn.addEventListener("click", () => {
          cerrarSheet();
          setTimeout(() => {
            if (typeof window[b.action] === "function") window[b.action]();
          }, 250);
        });
        sheetBtns.appendChild(btn);
      });
    } else {
      // Invitado
      topbarRight.innerHTML = `
        <a href="entrada.html" class="mu-topbar-login">🐾 Entrar</a>
      `;

      sheetName.textContent = "Invitado";
      sheetEmail.textContent = "Explora sin cuenta";
      sheetBtns.innerHTML = `
        <a href="entrada.html" style="display:flex;align-items:center;gap:12px;padding:13px 4px;color:#c48a3a;font-family:'Inter',sans-serif;font-size:14px;font-weight:600;text-decoration:none;border-bottom:1px solid rgba(255,255,255,0.06);">
          ${svgLogin()}<span>Iniciar sesión</span>
        </a>
      `;
    }
  }

  // Esperar a que Firebase esté listo (puede tardar unos ms)
  let authTries = 0;
  const waitAuth = setInterval(() => {
    authTries++;
    if (window._firebaseUser !== undefined) {
      clearInterval(waitAuth);
      setupAuth(window._firebaseUser);
    } else if (authTries > 30) {
      clearInterval(waitAuth);
      setupAuth(null); // invitado por defecto
    }
  }, 100);

  /* ══ 5. LABEL DE PÁGINA AL HACER SCROLL ══ */
  const labels = {
    inicio:    "Inicio",
    talleres:  "Talleres",
    coleccion: "Colección",
    comunidad: "Comunidad",
    tablon:    "Tablón",
    quienes:   "Quiénes somos",
    entrada:   "",
  };
  const labelText = labels[pagina] || "";

  if (labelText) {
    const label = document.createElement("div");
    label.className = "mu-page-label";
    label.textContent = labelText;
    document.body.appendChild(label);

    let lastScrollY = 0;
    window.addEventListener(
      "scroll",
      () => {
        const sy = window.scrollY;
        if (sy > 80 && sy > lastScrollY) {
          label.classList.add("visible");
        } else {
          label.classList.remove("visible");
        }
        lastScrollY = sy;
      },
      { passive: true }
    );
  }

  /* ══ 6. SVG HELPERS ══ */
  function svgBag() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
  }
  function svgTicket() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/></svg>`;
  }
  function svgEdit() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  }
  function svgLogout() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
  }
  function svgLogin() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`;
  }
})();
