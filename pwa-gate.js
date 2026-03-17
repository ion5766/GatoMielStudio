// ═══════════════════════════════════════════════════════════════════
// pwa-gate.js — GATO MIEL ESTUDIO
// Bloquea la web en móvil y fuerza instalación de la PWA
// Agregar en TODAS las páginas justo después de <body>:
//   <script src="pwa-gate.js"></script>
// ═══════════════════════════════════════════════════════════════════

(function() {
  const esMobil  = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const esPWA    = window.matchMedia('(display-mode: standalone)').matches
                   || window.navigator.standalone === true;

  // Si no es móvil → no hacer nada
  if (!esMobil) return;

  // Si ya está en la PWA instalada → mostrar solo un recordatorio suave
  if (esPWA) {
    // No bloquear — ya está usando la app correcta
    return;
  }

  // ── Está en Chrome móvil (no PWA) → BLOQUEAR ────────────────────
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Actualizar botón cuando el prompt esté listo
    const btn = document.getElementById('gm-gate-btn');
    if (btn) {
      btn.textContent = 'Instalar ahora';
      btn.style.opacity = '1';
    }
  });

  // Crear el overlay de bloqueo
  const css = `
    #gm-gate {
      position: fixed;
      inset: 0;
      z-index: 999999;
      background: #0d0b09;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 28px;
      text-align: center;
      overflow: hidden;
    }
    #gm-gate::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 50% 0%, rgba(196,138,58,0.15) 0%, transparent 65%);
      pointer-events: none;
    }
    .gm-gate-logo {
      width: 88px;
      height: 88px;
      border-radius: 22px;
      object-fit: cover;
      border: 2px solid rgba(196,138,58,0.3);
      box-shadow: 0 0 40px rgba(196,138,58,0.2);
      margin-bottom: 28px;
      animation: gm-pulse 3s ease-in-out infinite;
    }
    @keyframes gm-pulse {
      0%, 100% { box-shadow: 0 0 30px rgba(196,138,58,0.2); }
      50%       { box-shadow: 0 0 55px rgba(196,138,58,0.4); }
    }
    .gm-gate-titulo {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 500;
      color: white;
      margin: 0 0 10px;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }
    .gm-gate-titulo em {
      font-style: italic;
      color: #c48a3a;
    }
    .gm-gate-sub {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      color: rgba(255,255,255,0.45);
      line-height: 1.6;
      margin: 0 0 36px;
      max-width: 280px;
      font-weight: 300;
    }
    .gm-gate-pasos {
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 100%;
      max-width: 300px;
      margin-bottom: 28px;
    }
    .gm-gate-paso {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
      padding: 11px 14px;
      text-align: left;
    }
    .gm-gate-paso-num {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(196,138,58,0.15);
      border: 1px solid rgba(196,138,58,0.3);
      color: #c48a3a;
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .gm-gate-paso-txt {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: rgba(255,255,255,0.6);
      line-height: 1.4;
    }
    .gm-gate-paso-txt strong {
      color: rgba(255,255,255,0.85);
      font-weight: 500;
    }
    #gm-gate-btn {
      width: 100%;
      max-width: 300px;
      padding: 15px 24px;
      background: #c48a3a;
      color: white;
      border: none;
      border-radius: 50px;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.04em;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 8px 28px rgba(196,138,58,0.35);
      margin-bottom: 14px;
    }
    #gm-gate-btn:active {
      transform: scale(0.97);
      background: #a8742f;
    }
    .gm-gate-hint {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      color: rgba(255,255,255,0.2);
      line-height: 1.5;
    }
    .gm-gate-deco {
      position: absolute;
      bottom: -60px;
      left: 50%;
      transform: translateX(-50%);
      width: 300px;
      height: 300px;
      border-radius: 50%;
      border: 1px solid rgba(196,138,58,0.06);
      pointer-events: none;
    }
    .gm-gate-deco-2 {
      position: absolute;
      bottom: -100px;
      left: 50%;
      transform: translateX(-50%);
      width: 440px;
      height: 440px;
      border-radius: 50%;
      border: 1px solid rgba(196,138,58,0.04);
      pointer-events: none;
    }
  `;

  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS     = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Pasos según plataforma
  const pasosHTML = isAndroid ? `
    <div class="gm-gate-paso">
      <div class="gm-gate-paso-num">1</div>
      <span class="gm-gate-paso-txt">Toca el botón <strong>"Instalar ahora"</strong> abajo</span>
    </div>
    <div class="gm-gate-paso">
      <div class="gm-gate-paso-num">2</div>
      <span class="gm-gate-paso-txt">Confirma tocando <strong>"Instalar"</strong> en el aviso</span>
    </div>
    <div class="gm-gate-paso">
      <div class="gm-gate-paso-num">3</div>
      <span class="gm-gate-paso-txt">Abre <strong>Gato Miel</strong> desde tu pantalla de inicio</span>
    </div>
  ` : `
    <div class="gm-gate-paso">
      <div class="gm-gate-paso-num">1</div>
      <span class="gm-gate-paso-txt">Toca el ícono <strong>compartir</strong> (cuadrado con flecha) abajo</span>
    </div>
    <div class="gm-gate-paso">
      <div class="gm-gate-paso-num">2</div>
      <span class="gm-gate-paso-txt">Selecciona <strong>"Agregar a pantalla de inicio"</strong></span>
    </div>
    <div class="gm-gate-paso">
      <div class="gm-gate-paso-num">3</div>
      <span class="gm-gate-paso-txt">Abre <strong>Gato Miel</strong> desde tu pantalla de inicio</span>
    </div>
  `;

  const btnTexto  = isAndroid ? 'Instalar Gato Miel' : 'Ver instrucciones para iPhone';

  const overlay = document.createElement('div');
  overlay.id = 'gm-gate';
  overlay.innerHTML = `
    <style>${css}</style>
    <div class="gm-gate-deco"></div>
    <div class="gm-gate-deco-2"></div>
    <img src="Assets/Img/Logo.jpg" class="gm-gate-logo" alt="Gato Miel">
    <h1 class="gm-gate-titulo">Gato Miel<br><em>Estudio</em></h1>
    <p class="gm-gate-sub">Para una mejor experiencia y recibir notificaciones, instala nuestra app.</p>
    <div class="gm-gate-pasos">${pasosHTML}</div>
    <button id="gm-gate-btn">${btnTexto}</button>
    <p class="gm-gate-hint">Arte cerámico hecho a mano · Lima 🐾</p>
  `;

  // Bloquear scroll del body
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  // Insertar overlay apenas cargue el DOM
  if (document.body) {
    document.body.appendChild(overlay);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(overlay);
    });
  }

  // Acción del botón
  document.getElementById('gm-gate-btn').addEventListener('click', async () => {
    if (isAndroid && deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (outcome === 'accepted') {
        // Instaló → quitar overlay
        overlay.remove();
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }
    } else if (isIOS) {
      alert('En tu iPhone:\n1. Toca el ícono compartir ↑ (abajo del navegador)\n2. Selecciona "Agregar a pantalla de inicio"\n3. Toca "Agregar"\n\n¡Listo! Abre Gato Miel desde tu pantalla de inicio.');
    } else {
      // Android pero aún no hay prompt — mostrar instrucciones manuales
      alert('Para instalar:\n1. Toca los 3 puntos ⋮ arriba a la derecha\n2. Selecciona "Instalar aplicación" o "Agregar a pantalla de inicio"\n3. Confirma y abre Gato Miel desde tu pantalla de inicio.');
    }
  });

})();
