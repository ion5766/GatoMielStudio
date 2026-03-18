/* ================================================
   GATO MIEL â Chat flotante completo
   MODIFICADO: en mÃ³vil el fab y la ventana suben
   por encima de la navbar inferior (68px)
   ================================================ */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc,
  query, orderBy, where, onSnapshot,
  doc, setDoc, updateDoc, getDoc, getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBiJkhAd08hv_fjqGMYOvr-vYXudlj5aSs",
  authDomain: "gato-miel-estudio.firebaseapp.com",
  projectId: "gato-miel-estudio",
  storageBucket: "gato-miel-estudio.firebasestorage.app",
  messagingSenderId: "150671559458",
  appId: "1:150671559458:web:6daaf4a78150706db0337b"
};

const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const ADMIN_EMAILS  = ["jhonanibal576@gmail.com", "gatomielstudio@gmail.com"];
const esAdmin = (email) => email && ADMIN_EMAILS.includes(email.toLowerCase());
const MSG_SALUDO    = "Hola ð¾ bienvenid@ a Gato Miel Estudio! Te respondemos muy pronto â¨";

/* ââ PosiciÃ³n segÃºn dispositivo ââ */
const esMovil = () => (window.innerWidth || document.documentElement.clientWidth) <= 768;
const FAB_BOTTOM_PC    = "28px";
const FAB_BOTTOM_MOVIL = "86px";   /* navbar 68px + 18px margen */
const WIN_BOTTOM_PC    = "94px";
const WIN_BOTTOM_MOVIL = "152px";  /* fab bottom 86 + fab 54 + 12 */
const FAB_LEFT         = "20px";

// ââ HTML âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const chatHTML = `
<style>
  #chat-fab {
    position: fixed;
    bottom: ${FAB_BOTTOM_PC}; left: ${FAB_LEFT};
    width: 54px; height: 54px; border-radius: 50%;
    background: #1a1714; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 24px rgba(0,0,0,0.22);
    z-index: 9995; transition: transform 0.3s, background 0.3s;
  }
  #chat-fab:hover { transform: scale(1.1); background: #c48a3a; }
  #chat-badge {
    position: absolute; top: 4px; right: 4px;
    width: 13px; height: 13px; background: #e74c3c;
    border-radius: 50%; border: 2px solid white; display: none;
    animation: pulseBadge 1.8s infinite;
  }
  @keyframes pulseBadge { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }

  #chat-window {
    position: fixed;
    bottom: ${WIN_BOTTOM_PC}; left: ${FAB_LEFT};
    width: 330px; height: 470px;
    border-radius: 20px;
    display: none; flex-direction: column;
    z-index: 9995;
    animation: chatAppear 0.32s cubic-bezier(0.34,1.56,0.64,1);
  }

  /* En mÃ³vil, ventana mÃ¡s pequeÃ±a */
  @media (max-width: 768px) {
    #chat-window {
      width: calc(100vw - 24px);
      height: 58vh;
      left: 12px;
    }
  }

  #chat-emoji-picker {
    position: fixed;
    background: white;
    border: 1px solid #f0ebe4;
    border-radius: 16px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    padding: 10px;
    display: none;
    flex-direction: column;
    gap: 6px;
    z-index: 9996;
    width: 272px;
    max-height: 300px;
    overflow-y: auto;
  }
  #chat-emoji-picker.visible { display: flex; }

  #chat-inner {
    width: 100%; height: 100%;
    background: white; border-radius: 20px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05);
    display: flex; flex-direction: column; overflow: hidden;
  }
  @keyframes chatAppear {
    from { transform: scale(0.85) translateY(20px); opacity:0; }
    to   { transform: scale(1) translateY(0); opacity:1; }
  }

  #chat-header {
    background: #1a1714; padding: 13px 15px;
    display: flex; align-items: center; gap: 10px; flex-shrink: 0;
  }
  #chat-header img {
    width: 34px; height: 34px; border-radius: 50%;
    object-fit: cover; border: 2px solid #c48a3a;
  }
  #chat-header-info { flex: 1; }
  #chat-header-name { font-family:'Playfair Display',serif; font-size:14px; color:white; font-weight:500; }
  #chat-header-status { font-size:11px; color:#c48a3a; }
  #chat-close {
    background:none; border:none; color:rgba(255,255,255,0.45);
    font-size:18px; cursor:pointer; transition:color 0.2s; padding:0;
  }
  #chat-close:hover { color:white; }

  #chat-messages {
    flex:1; overflow-y:auto; padding:12px 13px 8px;
    display:flex; flex-direction:column; gap:7px;
    background:#faf7f4;
    scrollbar-width:thin; scrollbar-color:#f0ebe4 transparent;
  }

  .cmsg {
    max-width:82%; padding:9px 13px; border-radius:14px;
    font-size:13px; line-height:1.5;
    font-family:'Inter',sans-serif; word-break:break-word;
  }
  .cmsg.yo   { align-self:flex-end; background:#1a1714; color:white; border-bottom-right-radius:4px; }
  .cmsg.ellos { align-self:flex-start; background:white; color:#1a1714; border:1px solid #f0ebe4; border-bottom-left-radius:4px; box-shadow:0 2px 6px rgba(0,0,0,0.04); }
  .cmsg.bot  { align-self:flex-start; background:#fdf6ec; color:#c48a3a; border:1px solid #f0e0b8; border-bottom-left-radius:4px; font-style:italic; font-size:12px; }
  .cmsg-time { font-size:10px; opacity:0.4; margin-top:3px; display:block; text-align:right; }
  .cmsg.yo .cmsg-time { color:rgba(255,255,255,0.6); }
  .cmsg-img  { max-width:100%; border-radius:10px; cursor:pointer; display:block; margin-bottom:4px; max-height:200px; object-fit:cover; }
  .cmsg audio { width:100%; max-width:220px; margin-bottom:4px; border-radius:8px; }

  #chat-preview {
    padding:8px 12px; background:#f8f5f1; border-top:1px solid #f0ebe4;
    display:none; align-items:center; gap:8px; flex-shrink:0;
  }
  #chat-preview img { width:40px; height:40px; border-radius:8px; object-fit:cover; }
  #chat-preview-name { flex:1; font-size:12px; color:#666; font-family:'Inter',sans-serif; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  #chat-preview-cancel { background:none; border:none; color:#aaa; font-size:16px; cursor:pointer; padding:0; }
  #chat-preview-cancel:hover { color:#e74c3c; }

  #chat-footer {
    padding:9px 11px; border-top:1px solid #f0ebe4;
    display:flex; gap:6px; align-items:flex-end;
    background:white; flex-shrink:0;
  }
  .chat-attach-btn {
    width:36px; height:36px; border-radius:50%;
    background:#f0ebe4; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0; font-size:18px; line-height:36px;
    color:#555; padding:0; -webkit-tap-highlight-color:transparent;
    font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;
  }
  .chat-attach-btn:hover,.chat-attach-btn:active { background:#e3d9cc; }

  #chat-input {
    flex:1; border:1.5px solid #f0ebe4; border-radius:20px;
    padding:8px 13px; font-size:13px;
    font-family:'Inter',sans-serif; resize:none; outline:none;
    max-height:80px; overflow-y:auto;
    transition:border-color 0.2s; line-height:1.4;
  }
  #chat-input:focus { border-color:#c48a3a; }

  #chat-send {
    width:36px; height:36px; border-radius:50%;
    background:#c48a3a; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0; transition:background 0.2s,transform 0.2s;
  }
  #chat-send:hover { background:#a8742f; transform:scale(1.08); }

  #chat-cerrado-msg {
    padding:12px 16px; background:#faf7f4;
    border-top:1px solid #f0ebe4; text-align:center;
    font-size:12px; color:#aaa; font-style:italic; flex-shrink:0;
  }

  #chat-nologin {
    flex:1; display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    padding:24px; text-align:center; gap:10px; background:#faf7f4;
  }
  #chat-nologin p { font-size:13px; color:#888; font-family:'Inter',sans-serif; line-height:1.6; }
  #chat-nologin a { font-size:13px; color:#c48a3a; font-weight:500; font-family:'Inter',sans-serif; text-decoration:none; }
  #chat-file-input { display:none; }

  #chat-lightbox {
    display:none; position:fixed; inset:0;
    background:rgba(0,0,0,0.85); z-index:99999;
    align-items:center; justify-content:center; cursor:pointer;
  }
  #chat-lightbox img { max-width:90vw; max-height:90vh; border-radius:12px; }

  .emoji-picker-title { font-family:'Playfair Display',serif; font-size:11px; color:#c48a3a; letter-spacing:0.06em; text-transform:uppercase; padding:2px 4px 4px; border-bottom:1px solid #f5f0ea; flex-shrink:0; }
  .emoji-grid { display:flex; flex-wrap:wrap; gap:2px; }
  .emoji-btn { width:34px; height:34px; background:none; border:none; border-radius:8px; cursor:pointer; font-size:20px; line-height:1; display:flex; align-items:center; justify-content:center; transition:background 0.15s; -webkit-tap-highlight-color:transparent; }
  .emoji-btn:hover,.emoji-btn:active { background:#f5f0ea; }
  .emoji-section-label { font-size:10px; color:#bbb; font-family:'Inter',sans-serif; width:100%; padding:4px 2px 1px; letter-spacing:0.05em; }
</style>

<input type="file" id="chat-file-input" accept="image/*" style="display:none">

<div id="chat-lightbox" onclick="this.style.display='none'">
  <img id="chat-lightbox-img" src="">
</div>

<button id="chat-fab" title="EscrÃ­benos" onclick="window._toggleChat()">
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
  <span id="chat-badge"></span>
</button>

<div id="chat-window">
  <div id="chat-inner">
    <div id="chat-header">
      <img src="Assets/Img/Avatares/GatoMiel.jpeg" onerror="this.src='Assets/Img/Avatares/GatoMiel.jpeg'">
      <div id="chat-header-info">
        <div id="chat-header-name">Gato Miel Estudio</div>
        <div id="chat-header-status">â En lÃ­nea</div>
      </div>
      <button id="chat-close" onclick="window._toggleChat()">â</button>
    </div>
    <div id="chat-nologin" style="display:none;">
      <span style="font-size:30px;">ð±</span>
      <p>Inicia sesiÃ³n para<br>chatear con nosotras.</p>
      <a href="entrada.html">Iniciar sesiÃ³n â</a>
    </div>
    <div id="chat-messages" style="display:none;"></div>
    <div id="chat-preview">
      <img id="chat-preview-img" src="" style="display:none;">
      <span id="chat-preview-name"></span>
      <button id="chat-preview-cancel" onclick="window._cancelarArchivo()">â</button>
    </div>
    <div id="chat-footer" style="display:none;">
      <button class="chat-attach-btn" title="Emojis" onclick="window._toggleEmojiPicker(event)"><span>ð</span></button>
      <button class="chat-attach-btn" title="Imagen" onclick="document.getElementById('chat-file-input').click()"><span>ð¼ï¸</span></button>
      <textarea id="chat-input" placeholder="Escribe un mensaje..." rows="1"
        onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();window._enviarMensaje()}"
        oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'"
      ></textarea>
      <button id="chat-send" onclick="window._enviarMensaje()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2" fill="white" stroke="none"/>
        </svg>
      </button>
    </div>
    <div id="chat-cerrado-msg" style="display:none;">Este chat fue cerrado Â· EscrÃ­benos de nuevo ð¾</div>
  </div>
</div>

<div id="chat-emoji-picker">
  <div class="emoji-picker-title">ð± Gato Miel</div>
  <div class="emoji-grid">
    <span class="emoji-section-label">Gatitos</span>
    <button class="emoji-btn" onclick="window._insertEmoji('ð±')">ð±</button>
    <button class="emoji-btn" onclick="window._insertEmoji('ð')">ð</button>
    <button class="emoji-btn" onclick="window._insertEmoji('ðââ¬')">ðââ¬</button>
    <button class="emoji-btn" onclick="window._insertEmoji('ðº')">ðº</button>
    <button class="emoji-btn" onclick="window._insertEmoji('ð¸')">ð¸</button>
    <button class="emoji-btn" onclick="window._insertEmoji('ð»')">ð»</button>
    <button class="emoji-btn" onclick="window._insertEmoji('ð½')">ð½</button>
    <button class="emoji-btn" onclick="window._insertEmoji('ð')">ð</button>
    <button class="emoji-btn" onclick="window._insertEmoji('ð¾')">ð¾</button>
    <span class="emoji-section-label">CerÃ¡mica & arte</span>
    <button class="emoji-btn" onclick="window._insertEmoji('ðº')">ðº</button>
    <button class="emoji-btn" onclick="window._insertEmoji('ðª´')">ðª´</button>
    <button class="emoji-btn" onclick="window._insertEmoji('ð¯')">ð¯</button>
    <button class="emoji-btn" onclick="window._insertEmoji('ð¿')">ð¿</button>
    <button class="emoji-btn" onclick="window._insertEmoji('â¨')">â¨</button>
    <button class="emoji-btn" onclick="window._insertEmoji('ð¨')">ð¨</button>
    <span class="emoji-section-label">Caras & corazones</span>
    <button class="emoji-btn" onclick="window._insertEmoji('ð¥°')">ð¥°</button>
    <button class="emoji-btn" onclick="window._insertEmoji('ð')">ð</button>
    <button class="emoji-btn" onclick="window._insertEmoji('ð¥³')">ð¥³</button>
    <button class="emoji-btn" onclick="window._insertEmoji('ð')">ð</button>
    <button class="emoji-btn" onclick="window._insertEmoji('ð§¡')">ð§¡</button>
    <button class="emoji-btn" onclick="window._insertEmoji('ð«¶')">ð«¶</button>
  </div>
</div>
`;

document.body.insertAdjacentHTML("beforeend", chatHTML);

/* ââ Ajustar posiciÃ³n en mÃ³vil ââ */
function _ajustarPosicionChat() {
  var movil = esMovil();
  var fab = document.getElementById("chat-fab");
  var win = document.getElementById("chat-window");
  if (fab) fab.style.bottom = movil ? FAB_BOTTOM_MOVIL : FAB_BOTTOM_PC;
  if (win) win.style.bottom = movil ? WIN_BOTTOM_MOVIL : WIN_BOTTOM_PC;
}
_ajustarPosicionChat();
window.addEventListener("resize", _ajustarPosicionChat);

// ââ Estado âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
let _chatAbierto = false;
let _currentUser = null;
let _roomId      = null;
let _unsubChat   = null;
let _chatCerrado = false;
let _archivoSeleccionado = null;
let _esPrimerMensaje = true;

window._toggleChat = function() {
  _chatAbierto = !_chatAbierto;
  var win = document.getElementById("chat-window");
  win.style.display = _chatAbierto ? "flex" : "none";
  if (_chatAbierto) {
    document.getElementById("chat-badge").style.display = "none";
    if (_currentUser) _marcarLeidos();
    setTimeout(function() { var m = document.getElementById("chat-messages"); if(m) m.scrollTop = m.scrollHeight; }, 80);
  }
};

onAuthStateChanged(auth, async (user) => {
  _currentUser = user;
  if (user && esAdmin(user.email)) {
    document.getElementById("chat-fab").style.display = "none";
    return;
  }
  var nologin    = document.getElementById("chat-nologin");
  var msgs       = document.getElementById("chat-messages");
  var footer     = document.getElementById("chat-footer");
  var cerradoMsg = document.getElementById("chat-cerrado-msg");
  if (!user) {
    nologin.style.display = "flex"; msgs.style.display = "none";
    footer.style.display = "none"; cerradoMsg.style.display = "none";
    return;
  }
  nologin.style.display = "none"; msgs.style.display = "flex";
  _roomId = user.uid;
  var salaSnap = await getDoc(doc(db, "chats", _roomId));
  _esPrimerMensaje = !salaSnap.exists();
  _escucharEstado(); _escucharMensajes(); _escucharNoLeidos();
});

function _escucharEstado() {
  onSnapshot(doc(db, "chats", _roomId), (snap) => {
    if (snap.exists() && snap.data().estado === "cerrado") _esPrimerMensaje = true;
    var footer = document.getElementById("chat-footer");
    var cerradoMsg = document.getElementById("chat-cerrado-msg");
    if (footer) footer.style.display = "flex";
    if (cerradoMsg) cerradoMsg.style.display = "none";
    _chatCerrado = false;
  });
}

function _escucharMensajes() {
  if (_unsubChat) _unsubChat();
  var q = query(collection(db, "chats", _roomId, "mensajes"), orderBy("fecha", "asc"));
  _unsubChat = onSnapshot(q, (snap) => {
    var container = document.getElementById("chat-messages");
    if (!container) return;
    container.innerHTML = "";
    if (snap.empty) {
      container.innerHTML = '<div style="text-align:center;padding:28px 16px;color:#bbb;font-size:13px;line-height:1.7;"><span style="display:block;font-size:28px;margin-bottom:8px;">ð±</span>Â¡Hola! EscrÃ­benos lo que necesitas.</div>';
      return;
    }
    snap.forEach(docSnap => {
      var m = docSnap.data();
      var esAdm = m.rol === "admin";
      var esBot = m.rol === "bot";
      var hora  = m.fecha?.toDate ? m.fecha.toDate().toLocaleTimeString("es-PE", {hour:"2-digit",minute:"2-digit"}) : "";
      var div = document.createElement("div");
      div.className = "cmsg " + (esBot ? "bot" : esAdm ? "ellos" : "yo");
      if (m.tipo === "imagen") {
        div.innerHTML = '<img class="cmsg-img" src="'+m.url+'" onclick="window._verImagen(\''+m.url+'\')"><span class="cmsg-time">'+hora+'</span>';
      } else {
        div.innerHTML = m.texto + '<span class="cmsg-time">'+hora+'</span>';
      }
      container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
    if (_chatAbierto) _marcarLeidos();
  });
}

function _escucharNoLeidos() {
  var q = query(collection(db, "chats", _roomId, "mensajes"), where("rol","==","admin"), where("leido","==",false));
  onSnapshot(q, (snap) => {
    var badge = document.getElementById("chat-badge");
    if (badge) badge.style.display = (!snap.empty && !_chatAbierto) ? "block" : "none";
  });
}

async function _marcarLeidos() {
  if (!_roomId) return;
  var q = query(collection(db, "chats", _roomId, "mensajes"), where("rol","==","admin"), where("leido","==",false));
  var snap = await getDocs(q);
  for (var d of snap.docs) await updateDoc(doc(db, "chats", _roomId, "mensajes", d.id), {leido:true});
}

window._enviarMensaje = async function() {
  if (_chatCerrado) return;
  if (_archivoSeleccionado) { await _subirYEnviarArchivo(); return; }
  var input = document.getElementById("chat-input");
  var texto = input.value.trim();
  if (!texto || !_currentUser) return;
  input.value = ""; input.style.height = "auto";
  var esPrimero = _esPrimerMensaje;
  _esPrimerMensaje = false;
  await addDoc(collection(db, "chats", _roomId, "mensajes"), {
    texto, rol:"usuario", uid:_currentUser.uid,
    nombre:_currentUser.displayName || _currentUser.email.split("@")[0],
    fecha:serverTimestamp(), leido:true, tipo:"texto"
  });
  await setDoc(doc(db, "chats", _roomId), {
    ultimoMensaje:texto, ultimaFecha:serverTimestamp(),
    nombreUsuario:_currentUser.displayName || _currentUser.email.split("@")[0],
    email:_currentUser.email, avatar:_currentUser.photoURL||"",
    noLeidosAdmin:true, uid:_currentUser.uid, estado:"abierto", ultimoMensajeAdmin:null
  }, {merge:true});
  if (window.notif && _currentUser) {
    clearTimeout(window._chatNotifTimer);
    window._chatNotifTimer = setTimeout(() => {
      window.notif.enviarNotif("chat_cliente", {
        nombreCliente: _currentUser.displayName || _currentUser.email,
        preview: texto.substring(0, 60)
      });
    }, 3000);
  }
  if (esPrimero) {
    setTimeout(async () => {
      await addDoc(collection(db, "chats", _roomId, "mensajes"), {
        texto:MSG_SALUDO, rol:"bot", nombre:"Gato Miel Bot",
        fecha:serverTimestamp(), leido:false, tipo:"texto"
      });
    }, 800);
  }
};

async function _subirYEnviarArchivo() {
  if (!_archivoSeleccionado || !_currentUser) return;
  var archivo = _archivoSeleccionado;
  window._cancelarArchivo();
  var base64 = await new Promise((resolve, reject) => {
    var reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(archivo);
  });
  await addDoc(collection(db, "chats", _roomId, "mensajes"), {
    url:base64, rol:"usuario", uid:_currentUser.uid,
    nombre:_currentUser.displayName || _currentUser.email.split("@")[0],
    fecha:serverTimestamp(), leido:true, tipo:"imagen"
  });
  await setDoc(doc(db, "chats", _roomId), {
    ultimoMensaje:"ð¼ Imagen", ultimaFecha:serverTimestamp(),
    noLeidosAdmin:true, estado:"abierto",
    nombreUsuario:_currentUser.displayName || _currentUser.email.split("@")[0],
    email:_currentUser.email, avatar:_currentUser.photoURL||"", uid:_currentUser.uid
  }, {merge:true});
}

document.getElementById("chat-file-input").addEventListener("change", (e) => {
  var file = e.target.files[0]; if (!file) return;
  _archivoSeleccionado = file;
  var preview = document.getElementById("chat-preview");
  var previewImg = document.getElementById("chat-preview-img");
  document.getElementById("chat-preview-name").textContent = file.name;
  previewImg.src = URL.createObjectURL(file);
  previewImg.style.display = "block";
  preview.style.display = "flex";
  e.target.value = "";
});

window._cancelarArchivo = function() {
  _archivoSeleccionado = null;
  document.getElementById("chat-preview").style.display = "none";
  document.getElementById("chat-preview-img").src = "";
  document.getElementById("chat-preview-name").textContent = "";
};

window._toggleEmojiPicker = function(e) {
  e.stopPropagation();
  var picker = document.getElementById("chat-emoji-picker");
  if (picker.classList.contains("visible")) { picker.classList.remove("visible"); return; }
  var btn = e.currentTarget, rect = btn.getBoundingClientRect();
  var pw = 272;
  var left = Math.max(8, Math.min(rect.left, window.innerWidth - pw - 8));
  var bottom = window.innerHeight - rect.top + 6;
  picker.style.left = left + "px"; picker.style.bottom = bottom + "px";
  picker.classList.add("visible");
};

window._insertEmoji = function(emoji) {
  var input = document.getElementById("chat-input"); if (!input) return;
  var start = input.selectionStart, end = input.selectionEnd, val = input.value;
  input.value = val.slice(0,start) + emoji + val.slice(end);
  input.selectionStart = input.selectionEnd = start + emoji.length;
  input.focus(); input.style.height = "auto"; input.style.height = input.scrollHeight + "px";
};

document.addEventListener("click", () => {
  var picker = document.getElementById("chat-emoji-picker");
  if (picker) picker.classList.remove("visible");
});

window._verImagen = function(url) {
  document.getElementById("chat-lightbox-img").src = url;
  document.getElementById("chat-lightbox").style.display = "flex";
};
