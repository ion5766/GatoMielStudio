// ═══════════════════════════════════════════════════════════════════
// pwa-gate.js — GATO MIEL ESTUDIO
// ═══════════════════════════════════════════════════════════════════

(function() {
  const esMobil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const esPWA   = window.matchMedia('(display-mode: standalone)').matches
                  || window.navigator.standalone === true;

  if (!esMobil || esPWA) return;

  let deferredPrompt  = null;
  let yaInstalado     = false;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById('gm-gate-btn');
    if (btn) { btn.textContent = '📲 Instalar Gato Miel'; btn.style.opacity='1'; btn.style.pointerEvents='auto'; }
  });

  window.addEventListener('appinstalled', () => {
    yaInstalado = true;
    localStorage.setItem('gm-pwa-installed','1');
    mostrarYaInstalado();
  });

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  const css = `
    #gm-gate{position:fixed;inset:0;z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 28px;text-align:center;overflow:hidden;}
    #gm-gate video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;}
    #gm-gate-overlay{position:absolute;inset:0;background:rgba(8,6,4,0.72);z-index:1;}
    #gm-gate-content{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;width:100%;}
    .gm-gate-logo{width:86px;height:86px;border-radius:22px;object-fit:cover;border:2px solid rgba(196,138,58,0.4);box-shadow:0 0 50px rgba(196,138,58,0.25);margin-bottom:22px;animation:gm-pulse 3s ease-in-out infinite;}
    @keyframes gm-pulse{0%,100%{box-shadow:0 0 30px rgba(196,138,58,0.2);}50%{box-shadow:0 0 60px rgba(196,138,58,0.5);}}
    .gm-gate-titulo{font-family:'Playfair Display',serif;font-size:30px;font-weight:500;color:white;margin:0 0 8px;letter-spacing:-0.02em;line-height:1.2;}
    .gm-gate-titulo em{font-style:italic;color:#c48a3a;}
    .gm-gate-sub{font-family:'Inter',sans-serif;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.7;margin:0 0 28px;max-width:280px;font-weight:300;}
    .gm-gate-pasos{display:flex;flex-direction:column;gap:8px;width:100%;max-width:310px;margin-bottom:22px;}
    .gm-gate-paso{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.09);backdrop-filter:blur(10px);border-radius:14px;padding:12px 15px;text-align:left;}
    .gm-gate-paso-num{width:26px;height:26px;border-radius:50%;background:rgba(196,138,58,0.2);border:1px solid rgba(196,138,58,0.4);color:#c48a3a;font-family:'Inter',sans-serif;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .gm-gate-paso-txt{font-family:'Inter',sans-serif;font-size:12px;color:rgba(255,255,255,0.6);line-height:1.4;}
    .gm-gate-paso-txt strong{color:white;font-weight:500;}
    #gm-gate-btn{width:100%;max-width:310px;padding:16px 24px;background:#c48a3a;color:white;border:none;border-radius:50px;font-family:'Inter',sans-serif;font-size:14px;font-weight:600;letter-spacing:0.04em;cursor:pointer;box-shadow:0 10px 32px rgba(196,138,58,0.4);margin-bottom:14px;transition:all 0.2s;}
    #gm-gate-btn:active{transform:scale(0.97);background:#a8742f;}
    .gm-gate-hint{font-family:'Inter',sans-serif;font-size:11px;color:rgba(255,255,255,0.2);}

    /* Ya instalada */
    #gm-gate-instalado{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;width:100%;animation:fadeUp .5s ease;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
    .gm-inst-check{width:90px;height:90px;background:linear-gradient(135deg,#c48a3a,#e8b870);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:38px;margin:0 auto 24px;box-shadow:0 0 60px rgba(196,138,58,0.5);}
    .gm-inst-titulo{font-family:'Playfair Display',serif;font-size:26px;color:white;margin:0 0 12px;line-height:1.2;}
    .gm-inst-titulo em{font-style:italic;color:#c48a3a;}
    .gm-inst-sub{font-family:'Inter',sans-serif;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;margin:0 0 10px;max-width:280px;}
    .gm-inst-tip{background:rgba(196,138,58,0.12);border:1px solid rgba(196,138,58,0.25);border-radius:14px;padding:14px 18px;max-width:310px;margin-bottom:28px;}
    .gm-inst-tip p{font-family:'Inter',sans-serif;font-size:12px;color:rgba(255,255,255,0.6);margin:0;line-height:1.6;}
    .gm-inst-tip strong{color:#c48a3a;font-weight:600;}
  `;

  const pasosHTML = isIOS ? `
    <div class="gm-gate-paso"><div class="gm-gate-paso-num">1</div><span class="gm-gate-paso-txt">Toca el ícono <strong>compartir ↑</strong> en Safari</span></div>
    <div class="gm-gate-paso"><div class="gm-gate-paso-num">2</div><span class="gm-gate-paso-txt">Selecciona <strong>"Agregar a pantalla de inicio"</strong></span></div>
    <div class="gm-gate-paso"><div class="gm-gate-paso-num">3</div><span class="gm-gate-paso-txt">Toca <strong>"Agregar"</strong> y abre Gato Miel 🐾</span></div>
  ` : `
    <div class="gm-gate-paso"><div class="gm-gate-paso-num">1</div><span class="gm-gate-paso-txt">Toca <strong>"Instalar Gato Miel"</strong> abajo</span></div>
    <div class="gm-gate-paso"><div class="gm-gate-paso-num">2</div><span class="gm-gate-paso-txt">Confirma tocando <strong>"Instalar"</strong> en el aviso</span></div>
    <div class="gm-gate-paso"><div class="gm-gate-paso-num">3</div><span class="gm-gate-paso-txt">Abre <strong>Gato Miel</strong> desde tu pantalla de inicio 🐾</span></div>
  `;

  function mostrarYaInstalado() {
    const content = document.getElementById('gm-gate-content');
    if (!content) return;
    content.innerHTML = `
      <div id="gm-gate-instalado">
        <div class="gm-inst-check">🎉</div>
        <h2 class="gm-inst-titulo">¡Ya casi<br><em>estás lista!</em></h2>
        <p class="gm-inst-sub">Gato Miel Estudio ya está instalada en tu celular.</p>
        <div class="gm-inst-tip">
          <p>🔍 Busca el ícono de <strong>Gato Miel</strong> en tu pantalla de inicio y ábrela desde ahí para la mejor experiencia 🐾</p>
        </div>
      </div>
    `;
  }

  const overlay = document.createElement('div');
  overlay.id = 'gm-gate';
  overlay.innerHTML = `
    <style>${css}</style>
    <video autoplay muted loop playsinline>
      <source src="Assets/Video/VideoPresentacion.mp4" type="video/mp4">
    </video>
    <div id="gm-gate-overlay"></div>
    <div id="gm-gate-content">
      <img src="Assets/Img/Logo.jpg" class="gm-gate-logo" alt="Gato Miel" onerror="this.style.display='none'">
      <h1 class="gm-gate-titulo">Gato Miel<br><em>Estudio</em></h1>
      <p class="gm-gate-sub">Para una mejor experiencia y recibir notificaciones, instala nuestra app gratuita.</p>
      <div class="gm-gate-pasos">${pasosHTML}</div>
      <button id="gm-gate-btn">${isIOS ? '📋 Ver instrucciones' : '📲 Instalar Gato Miel'}</button>
      <p class="gm-gate-hint">Arte cerámico hecho a mano · Lima 🐾</p>
    </div>
  `;

  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  const insertar = () => {
    const viejo = document.getElementById('gm-gate');
    if (viejo) viejo.remove();
    document.body.appendChild(overlay);

    document.getElementById('gm-gate-btn').addEventListener('click', async () => {
      if (isIOS) {
        alert('En tu iPhone:\n\n1. Toca el ícono compartir ↑ (barra inferior de Safari)\n2. Toca "Agregar a pantalla de inicio"\n3. Toca "Agregar"\n\n¡Listo! Abre Gato Miel desde tu inicio 🐾');
      } else if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        if (outcome === 'accepted') {
          mostrarYaInstalado();
        } else {
          const btn = document.getElementById('gm-gate-btn');
          if (btn) btn.textContent = '📋 Instalar manualmente';
        }
      } else {
        // Ya instalada o no hay prompt
        mostrarYaInstalado();
      }
    });
  };

  if (document.body) { insertar(); }
  else { document.addEventListener('DOMContentLoaded', insertar); }

})();
