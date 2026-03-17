// ═══════════════════════════════════════════════════════════════════
// pwa-gate.js — GATO MIEL ESTUDIO
// Bloquea la web en móvil y fuerza instalación de la PWA
// Agregar en TODAS las páginas justo después de <body>:
//   <script src="pwa-gate.js"></script>
// ═══════════════════════════════════════════════════════════════════

(function() {
  const esMobil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const esPWA   = window.matchMedia('(display-mode: standalone)').matches
                  || window.navigator.standalone === true;

  // Si no es móvil o ya está en la PWA → no hacer nada
  if (!esMobil || esPWA) return;

  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById('gm-gate-btn');
    if (btn) {
      btn.textContent = '📲 Instalar Gato Miel';
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    }
  });

  // Detectar cuando se instala la PWA
  window.addEventListener('appinstalled', () => {
    // Guardamos que ya instaló
    localStorage.setItem('gm-pwa-installed', '1');
    const overlay = document.getElementById('gm-gate');
    if (overlay) {
      overlay.innerHTML = `
        <style>
          #gm-gate { position:fixed;inset:0;z-index:999999;background:#0d0b09;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center; }
          .gm-check { width:80px;height:80px;background:linear-gradient(135deg,#c48a3a,#e8b870);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:36px;margin:0 auto 24px;box-shadow:0 0 50px rgba(196,138,58,0.4); }
          .gm-ok-title { font-family:'Playfair Display',serif;font-size:26px;color:white;margin:0 0 10px; }
          .gm-ok-sub { font-family:'Inter',sans-serif;font-size:14px;color:rgba(255,255,255,0.5);margin:0 0 32px;line-height:1.6; }
          .gm-ok-btn { background:#c48a3a;color:white;border:none;border-radius:50px;padding:14px 32px;font-family:'Inter',sans-serif;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 8px 24px rgba(196,138,58,0.35); }
        </style>
        <div class="gm-check">✓</div>
        <h2 class="gm-ok-title">¡App instalada!</h2>
        <p class="gm-ok-sub">Busca el ícono de Gato Miel en tu pantalla de inicio y ábrela desde ahí.</p>
        <button class="gm-ok-btn" onclick="window.close()">Entendido 🐾</button>
      `;
    }
  });

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  const css = `
    #gm-gate {
      position:fixed;inset:0;z-index:999999;background:#0d0b09;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:32px 28px;text-align:center;overflow:hidden;
    }
    #gm-gate::before {
      content:'';position:absolute;inset:0;
      background:radial-gradient(ellipse at 50% 0%,rgba(196,138,58,0.15) 0%,transparent 65%);
      pointer-events:none;
    }
    .gm-gate-logo {
      width:80px;height:80px;border-radius:20px;object-fit:cover;
      border:2px solid rgba(196,138,58,0.3);
      box-shadow:0 0 40px rgba(196,138,58,0.2);
      margin-bottom:24px;
      animation:gm-pulse 3s ease-in-out infinite;
    }
    @keyframes gm-pulse {
      0%,100%{box-shadow:0 0 30px rgba(196,138,58,0.2);}
      50%{box-shadow:0 0 55px rgba(196,138,58,0.4);}
    }
    .gm-gate-titulo {
      font-family:'Playfair Display',serif;font-size:26px;font-weight:500;
      color:white;margin:0 0 8px;letter-spacing:-0.02em;line-height:1.2;
    }
    .gm-gate-titulo em{font-style:italic;color:#c48a3a;}
    .gm-gate-sub {
      font-family:'Inter',sans-serif;font-size:13px;color:rgba(255,255,255,0.45);
      line-height:1.6;margin:0 0 28px;max-width:280px;font-weight:300;
    }
    .gm-gate-pasos {
      display:flex;flex-direction:column;gap:8px;
      width:100%;max-width:300px;margin-bottom:24px;
    }
    .gm-gate-paso {
      display:flex;align-items:center;gap:12px;
      background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
      border-radius:12px;padding:11px 14px;text-align:left;
    }
    .gm-gate-paso-num {
      width:24px;height:24px;border-radius:50%;
      background:rgba(196,138,58,0.15);border:1px solid rgba(196,138,58,0.3);
      color:#c48a3a;font-family:'Inter',sans-serif;font-size:11px;font-weight:700;
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
    }
    .gm-gate-paso-txt {
      font-family:'Inter',sans-serif;font-size:12px;
      color:rgba(255,255,255,0.55);line-height:1.4;
    }
    .gm-gate-paso-txt strong{color:rgba(255,255,255,0.85);font-weight:500;}
    #gm-gate-btn {
      width:100%;max-width:300px;padding:15px 24px;
      background:#c48a3a;color:white;border:none;border-radius:50px;
      font-family:'Inter',sans-serif;font-size:14px;font-weight:600;
      letter-spacing:0.04em;cursor:pointer;
      box-shadow:0 8px 28px rgba(196,138,58,0.35);
      margin-bottom:12px;transition:all 0.2s;
    }
    #gm-gate-btn:active{transform:scale(0.97);background:#a8742f;}
    .gm-gate-hint {
      font-family:'Inter',sans-serif;font-size:11px;
      color:rgba(255,255,255,0.18);line-height:1.5;
    }
    .gm-gate-deco {
      position:absolute;bottom:-60px;left:50%;transform:translateX(-50%);
      width:300px;height:300px;border-radius:50%;
      border:1px solid rgba(196,138,58,0.06);pointer-events:none;
    }
  `;

  const pasosHTML = isIOS ? `
    <div class="gm-gate-paso">
      <div class="gm-gate-paso-num">1</div>
      <span class="gm-gate-paso-txt">Toca el ícono <strong>compartir ↑</strong> en la barra de Safari</span>
    </div>
    <div class="gm-gate-paso">
      <div class="gm-gate-paso-num">2</div>
      <span class="gm-gate-paso-txt">Selecciona <strong>"Agregar a pantalla de inicio"</strong></span>
    </div>
    <div class="gm-gate-paso">
      <div class="gm-gate-paso-num">3</div>
      <span class="gm-gate-paso-txt">Toca <strong>"Agregar"</strong> y abre Gato Miel desde tu inicio</span>
    </div>
  ` : `
    <div class="gm-gate-paso">
      <div class="gm-gate-paso-num">1</div>
      <span class="gm-gate-paso-txt">Toca <strong>"Instalar Gato Miel"</strong> abajo</span>
    </div>
    <div class="gm-gate-paso">
      <div class="gm-gate-paso-num">2</div>
      <span class="gm-gate-paso-txt">Confirma tocando <strong>"Instalar"</strong> en el aviso</span>
    </div>
    <div class="gm-gate-paso">
      <div class="gm-gate-paso-num">3</div>
      <span class="gm-gate-paso-txt">Abre <strong>Gato Miel</strong> desde tu pantalla de inicio</span>
    </div>
  `;

  const btnTexto = isIOS ? '📋 Ver instrucciones' : '📲 Instalar Gato Miel';

  const overlay = document.createElement('div');
  overlay.id = 'gm-gate';
  overlay.innerHTML = `
    <style>${css}</style>
    <div class="gm-gate-deco"></div>
    <img src="Assets/Img/Logo.jpg" class="gm-gate-logo" alt="Gato Miel"
         onerror="this.style.display='none'">
    <h1 class="gm-gate-titulo">Gato Miel<br><em>Estudio</em></h1>
    <p class="gm-gate-sub">Para una mejor experiencia y recibir notificaciones, instala nuestra app gratuita.</p>
    <div class="gm-gate-pasos">${pasosHTML}</div>
    <button id="gm-gate-btn">${btnTexto}</button>
    <p class="gm-gate-hint">Arte cerámico hecho a mano · Lima 🐾</p>
  `;

  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  const insertarOverlay = () => {
    // Remover overlay anterior si existe
    const viejo = document.getElementById('gm-gate');
    if (viejo) viejo.remove();
    document.body.appendChild(overlay);
    document.getElementById('gm-gate-btn').addEventListener('click', async () => {
      if (isIOS) {
        alert('En tu iPhone:\n\n1. Toca el ícono compartir ↑ (barra inferior de Safari)\n2. Desliza y toca "Agregar a pantalla de inicio"\n3. Toca "Agregar"\n\n¡Listo! Abre Gato Miel desde tu pantalla de inicio 🐾');
      } else if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        if (outcome === 'dismissed') {
          // Usuario rechazó — mostrar instrucciones manuales
          document.getElementById('gm-gate-btn').textContent = '📋 Instalar manualmente';
          deferredPrompt = null;
        }
        // Si aceptó → el evento 'appinstalled' se encarga
      } else {
        // No hay prompt disponible → instrucciones manuales
        alert('Para instalar Gato Miel:\n\n1. Toca los 3 puntos ⋮ arriba a la derecha en Chrome\n2. Selecciona "Instalar aplicación" o "Agregar a pantalla de inicio"\n3. Confirma y abre Gato Miel desde tu pantalla de inicio 🐾');
      }
    });
  };

  if (document.body) {
    insertarOverlay();
  } else {
    document.addEventListener('DOMContentLoaded', insertarOverlay);
  }

})();
