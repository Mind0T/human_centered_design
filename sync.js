/* HCD Kit · sync.js — conexión compartida con el backend de Google (Apps Script)
   Lo usan aterrizar.html, empatia.html y riesgo.html. Si no hay endpoint
   configurado, las páginas siguen funcionando en local (localStorage). */
(function () {
  // ─────────────────────────────────────────────────────────────────────────
  // CONFIGURA TU PROYECTO AQUÍ (una sola vez, al clonar este machote):
  //
  // 1) Crea tu propio Google Sheet + Apps Script siguiendo backend/backend-setup.md
  //    y pega abajo la URL de la app web que termina en /exec. Así TODO tu equipo
  //    queda conectado sin pegar nada a mano. Si lo dejas vacío (""), cada persona
  //    puede pegar su URL en el botón ⚙️ Conectar, o la página trabaja en local.
  //
  // 2) Cambia DEFAULT_ROOM por el nombre de tu equipo/proyecto. Esto separa los
  //    datos de un proyecto de los de otro aunque usaran el mismo Sheet.
  //
  // ⚠️ El machote nace VIRGEN a propósito: no reutilices el endpoint de otro
  //    proyecto o escribirás sobre sus datos.
  // ─────────────────────────────────────────────────────────────────────────
  // Conectado al Sheet de práctica de Irvin (nov 2026). Al CLONAR este machote
  // para un proyecto nuevo, reemplaza esta URL por la /exec de TU propio Sheet
  // (ver backend/CONECTAR.md) para no escribir sobre estos datos.
  var HARDCODED_ENDPOINT = "https://script.google.com/macros/s/AKfycby8Gjvrp9YpPks7uPIK5MwGfysJyO2xUt1kI9HN-HnZXLLsLsHWThBqBIyrVlasLwkezA/exec";
  var DEFAULT_ROOM = "proyecto-demo";     // ← nombre de tu equipo/proyecto

  var LS = { ep: 'hcd_endpoint', name: 'hcd_name', room: 'hcd_room' };
  function g(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
  function s(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var statusCbs = [], ctxCbs = [];
  var lastState = 'local';

  var Sync = {
    DEFAULT_ROOM: DEFAULT_ROOM,
    getEndpoint: function () { return (HARDCODED_ENDPOINT || g(LS.ep, '') || '').trim(); },
    setEndpoint: function (u) { s(LS.ep, (u || '').trim()); },
    isHardcoded: function () { return !!HARDCODED_ENDPOINT; },
    getName: function () { return g(LS.name, ''); },
    setName: function (n) { s(LS.name, (n || '').trim()); },
    getRoom: function () { return (g(LS.room, DEFAULT_ROOM) || DEFAULT_ROOM).trim(); },
    setRoom: function (r) { s(LS.room, (r || '').trim() || DEFAULT_ROOM); },
    isConnected: function () { return !!this.getEndpoint(); },
    state: function () { return lastState; },
    onStatus: function (cb) { statusCbs.push(cb); cb(lastState); },
    onContext: function (cb) { ctxCbs.push(cb); },
    _emitCtx: function () { ctxCbs.forEach(function (c) { try { c(); } catch (e) {} }); },
    _setState: function (st) { lastState = st; statusCbs.forEach(function (c) { try { c(st); } catch (e) {} }); },

    post: function (payload) {
      var ep = this.getEndpoint();
      if (!ep) return Promise.reject(new Error('sin-endpoint'));
      payload = payload || {};
      payload.room = this.getRoom();
      payload.author = this.getName() || 'anónimo';
      var self = this;
      return fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json(); })
        .then(function (j) { self._setState('connected'); return j; })
        .catch(function (e) { self._setState('error'); throw e; });
    },

    read: function (tool) {
      var ep = this.getEndpoint();
      if (!ep) return Promise.reject(new Error('sin-endpoint'));
      var u = ep + (ep.indexOf('?') < 0 ? '?' : '&') + 'op=read&room=' +
        encodeURIComponent(this.getRoom()) + (tool ? '&tool=' + encodeURIComponent(tool) : '');
      var self = this;
      return fetch(u, { method: 'GET' }).then(function (r) { return r.json(); })
        .then(function (j) { self._setState('connected'); return j; })
        .catch(function (e) { self._setState('error'); throw e; });
    },

    ping: function () { return this.post({ op: 'ping' }); },

    /* ---- barra de conexión ---- */
    mountBar: function (host) {
      injectStyles();
      var bar = document.createElement('div');
      bar.className = 'syncbar';
      bar.innerHTML =
        '<span class="sdot"></span><span class="sstate">Local</span>' +
        '<input class="sname" placeholder="Tu nombre" maxlength="24">' +
        '<span class="ssep">·</span>' +
        '<span class="sroomwrap">equipo <input class="sroom" maxlength="32"></span>' +
        '<span class="sflex"></span>' +
        '<button class="sgear" type="button">⚙️ Conectar</button>' +
        '<div class="spanel">' +
          '<div class="sptitle">Conexión en vivo con Google Sheets</div>' +
          '<p class="sphelp">Pega la URL de la app web (termina en <b>/exec</b>). Pasos: <a href="backend/backend-setup.md" target="_blank" rel="noopener">backend-setup.md</a>.</p>' +
          '<input class="sep" placeholder="https://script.google.com/.../exec">' +
          '<div class="spbtns"><button class="stest" type="button">Probar y guardar</button><span class="spmsg"></span></div>' +
          '<p class="sphelp" style="margin-top:8px">Si queda vacío, la página trabaja solo en este dispositivo (se guarda local).</p>' +
        '</div>';
      host.appendChild(bar);

      var q = function (c) { return bar.querySelector(c); };
      var nameI = q('.sname'), roomI = q('.sroom'), epI = q('.sep'),
          gear = q('.sgear'), panel = q('.spanel'), test = q('.stest'),
          msg = q('.spmsg'), dot = q('.sdot'), stateT = q('.sstate');

      nameI.value = Sync.getName();
      roomI.value = Sync.getRoom();
      epI.value = Sync.isHardcoded() ? '(fijado por el equipo)' : g(LS.ep, '');
      if (Sync.isHardcoded()) { epI.disabled = true; }

      nameI.addEventListener('input', function () { Sync.setName(nameI.value); Sync._emitCtx(); refresh(); });
      roomI.addEventListener('change', function () { Sync.setRoom(roomI.value); roomI.value = Sync.getRoom(); Sync._emitCtx(); });
      gear.addEventListener('click', function () { panel.classList.toggle('open'); });
      test.addEventListener('click', function () {
        if (!Sync.isHardcoded()) Sync.setEndpoint(epI.value);
        msg.textContent = 'Probando…'; msg.className = 'spmsg';
        if (!Sync.getEndpoint()) { msg.textContent = 'Pega una URL /exec'; msg.className = 'spmsg err'; return; }
        Sync.ping().then(function (j) {
          if (j && j.ok) { msg.textContent = 'Conectado ✓'; msg.className = 'spmsg ok'; Sync._emitCtx(); setTimeout(function(){panel.classList.remove('open')}, 900); }
          else { msg.textContent = 'Respuesta inesperada'; msg.className = 'spmsg err'; }
          refresh();
        }).catch(function () { msg.textContent = 'No se pudo conectar'; msg.className = 'spmsg err'; refresh(); });
      });

      function refresh() {
        var st = lastState, name = Sync.getName();
        if (!Sync.isConnected()) { dot.className = 'sdot'; stateT.textContent = 'Local'; }
        else if (st === 'connected') { dot.className = 'sdot ok'; stateT.textContent = name ? 'Conectado' : 'Conectado (pon tu nombre)'; }
        else if (st === 'error') { dot.className = 'sdot err'; stateT.textContent = 'Sin conexión'; }
        else { dot.className = 'sdot wait'; stateT.textContent = Sync.isConnected() ? 'Conectando…' : 'Local'; }
        gear.textContent = Sync.isConnected() ? '⚙️' : '⚙️ Conectar';
      }
      Sync.onStatus(function () { refresh(); });
      refresh();

      // Autoconecta si ya hay endpoint (fijado o guardado)
      if (Sync.isConnected()) { Sync.ping().then(function(){ Sync._emitCtx(); }).catch(function(){}); }
      return bar;
    }
  };

  function injectStyles() {
    if (document.getElementById('syncbar-css')) return;
    var st = document.createElement('style');
    st.id = 'syncbar-css';
    st.textContent =
      '.syncbar{display:flex;align-items:center;gap:9px;flex-wrap:wrap;position:relative;' +
        'background:rgba(10,26,51,.6);border:1px solid var(--line,rgba(156,193,242,.16));border-radius:12px;padding:9px 13px;font-size:.82rem;color:var(--mute,#a9bbd6)}' +
      '.syncbar .sdot{width:9px;height:9px;border-radius:50%;background:#7f8ca3;flex:0 0 auto}' +
      '.syncbar .sdot.ok{background:#4ccb8f;box-shadow:0 0 8px rgba(76,203,143,.6)}' +
      '.syncbar .sdot.err{background:#ef6a5a}.syncbar .sdot.wait{background:#f2c14e}' +
      '.syncbar .sstate{font-family:Archivo,sans-serif;font-weight:800;font-size:.72rem;letter-spacing:.03em;color:var(--white,#f4f8ff)}' +
      '.syncbar input{background:rgba(7,20,40,.55);border:1px solid var(--line,rgba(156,193,242,.16));border-radius:8px;color:var(--white,#f4f8ff);font-family:Overpass,sans-serif;font-size:.84rem;padding:6px 10px}' +
      '.syncbar .sname{width:130px}.syncbar .sroom{width:120px}' +
      '.syncbar input:focus{outline:none;border-color:var(--lime,#d7e64b)}' +
      '.syncbar .ssep{opacity:.5}.syncbar .sroomwrap{display:inline-flex;align-items:center;gap:6px}' +
      '.syncbar .sflex{flex:1}' +
      '.syncbar .sgear{cursor:pointer;font-family:Archivo,sans-serif;font-weight:800;font-size:.76rem;border:1px solid var(--line,rgba(156,193,242,.16));background:rgba(7,20,40,.5);color:var(--white,#f4f8ff);border-radius:9px;padding:7px 12px;transition:.15s}' +
      '.syncbar .sgear:hover{border-color:var(--lime,#d7e64b);color:var(--lime,#d7e64b)}' +
      '.syncbar .spanel{display:none;position:absolute;top:calc(100% + 8px);right:0;left:0;z-index:50;' +
        'background:#0a1a33;border:1px solid var(--line,rgba(156,193,242,.16));border-radius:12px;padding:16px 18px;box-shadow:0 18px 50px rgba(0,0,0,.5)}' +
      '.syncbar .spanel.open{display:block}' +
      '.syncbar .sptitle{font-family:Archivo,sans-serif;font-weight:800;color:var(--white,#f4f8ff);font-size:.95rem;margin-bottom:6px}' +
      '.syncbar .sphelp{font-size:.8rem;color:var(--mute,#a9bbd6);margin-bottom:9px}.syncbar .sphelp a{color:var(--blue-soft,#4e8fe6)}' +
      '.syncbar .sep{width:100%;margin-bottom:10px}' +
      '.syncbar .spbtns{display:flex;align-items:center;gap:12px}' +
      '.syncbar .stest{cursor:pointer;font-family:Archivo,sans-serif;font-weight:800;font-size:.8rem;background:var(--lime,#d7e64b);color:#071428;border:none;border-radius:9px;padding:9px 16px}' +
      '.syncbar .spmsg{font-size:.8rem;font-weight:700}.syncbar .spmsg.ok{color:#4ccb8f}.syncbar .spmsg.err{color:#ef6a5a}';
    document.head.appendChild(st);
  }

  window.Sync = Sync;
})();
