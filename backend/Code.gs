/**
 * ORBITAL · Backend del equipo (v2)
 * NASA Space Apps CDMX 2026 · Equipo Tacos de Asada
 *
 * Guarda lo que el equipo escribe en aterrizar.html, empatia.html y riesgo.html
 * en la pestaña "Datos" (almacén crudo) y, a partir de ella, arma pestañas
 * LEGIBLES para leer a simple vista:
 *
 *   0 · LEEME                  cómo está organizada la hoja
 *   1 · Aterrizar              canvas, ¿Cómo podríamos…?, matriz e ideación
 *   2 · Empatía                notas del mapa de empatía por zona y POV
 *   3 · Riesgo · Cédulas       cédulas 1, 2 y 4
 *   4 · Riesgo · Eventos       eventos con GP, GR, matriz y control
 *   5 · Riesgo · Autorreportes cédula 3 con línea base
 *   6 · Insumos requerimientos materia prima para la hoja de requerimientos
 *
 * Las pestañas 0–6 se reconstruyen solas (al escribir, como máximo cada 20 s,
 * al abrir la hoja, desde el menú ORBITAL o desde la página Insights).
 * No las editen a mano: se sobrescriben. Editen desde las páginas.
 *
 * Instalación y actualización: ver backend-setup.md.
 */

var SHEET_NAME = 'Datos';
var HEADERS = ['ts', 'room', 'tool', 'id', 'zone', 'author', 'key', 'value', 'votes'];
var DEFAULT_ROOM = 'tacos-de-asada';
var TAB = {
  leeme: '0 · LEEME', aterrizar: '1 · Aterrizar', empatia: '2 · Empatía',
  cedulas: '3 · Riesgo · Cédulas', eventos: '4 · Riesgo · Eventos',
  autorreportes: '5 · Riesgo · Autorreportes', insumos: '6 · Insumos requerimientos'
};

/* ============================ API WEB ============================ */
function doGet(e)  { return handle_(e); }
function doPost(e) { return handle_(e); }

function handle_(e) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(25000); } catch (err) { return out_({ ok: false, error: 'busy' }); }
  try {
    var sh = sheet_();
    var p = (e && e.parameter) ? e.parameter : {};
    var body = {};
    if (e && e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); } catch (_) {}
    }
    var op   = String(body.op   || p.op   || 'read');
    var room = String(body.room || p.room || 'default');
    var wrote = false, res;

    if (op === 'ping') return out_({ ok: true, pong: true, version: 2 });

    if (op === 'read') {
      var tool = body.tool || p.tool || '';
      return out_({ ok: true, rows: read_(sh, room, tool) });
    }
    if (op === 'views') {
      buildViews_(room);
      return out_({ ok: true, built: true });
    }
    if (op === 'set') {
      upsert_(sh, room, body.tool || 'aterrizar', String(body.key || ''),
              body.value == null ? '' : String(body.value), String(body.author || ''));
      res = { ok: true }; wrote = true;
    } else if (op === 'bulkset') {
      var items = body.items || [];
      for (var i = 0; i < items.length; i++) {
        upsert_(sh, room, body.tool || 'aterrizar', String(items[i].key || ''),
                items[i].value == null ? '' : String(items[i].value), String(body.author || ''));
      }
      res = { ok: true, n: items.length }; wrote = true;
    } else if (op === 'add') {
      var id = body.id || Utilities.getUuid();
      sh.appendRow([new Date(), room, body.tool || 'empatia', id, String(body.zone || ''),
                    String(body.author || ''), '', String(body.value || ''), 0]);
      res = { ok: true, id: id }; wrote = true;
    } else if (op === 'vote') {
      voteDelta_(sh, room, String(body.id || ''), (Number(body.delta) === -1 ? -1 : 1));
      res = { ok: true }; wrote = true;
    } else if (op === 'del') {
      delById_(sh, room, String(body.id || ''));
      res = { ok: true }; wrote = true;
    } else {
      return out_({ ok: false, error: 'op desconocida: ' + op });
    }
    if (wrote) maybeBuildViews_(room);
    return out_(res);
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

/* ============================ ALMACÉN ============================ */
function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) { sh = ss.insertSheet(SHEET_NAME); sh.appendRow(HEADERS); plainText_(sh); }
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  return sh;
}
/* La columna "value" queda como texto plano para que Sheets no convierta "1/2" en fecha. */
function plainText_(sh) { try { sh.getRange(1, 8, sh.getMaxRows(), 1).setNumberFormat('@'); } catch (_) {} }
function data_(sh) {
  var lr = sh.getLastRow();
  if (lr < 2) return [];
  return sh.getRange(2, 1, lr - 1, HEADERS.length).getValues();
}
function read_(sh, room, tool) {
  var rows = data_(sh), out = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (String(r[1]) !== room) continue;
    if (tool && String(r[2]) !== tool) continue;
    out.push({ ts: r[0], tool: r[2], id: r[3], zone: r[4], author: r[5], key: r[6], value: r[7], votes: r[8] });
  }
  return out;
}
function upsert_(sh, room, tool, key, value, author) {
  if (!key) return;
  var rows = data_(sh);
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (String(r[1]) === room && String(r[2]) === tool && String(r[6]) === key) {
      var ri = i + 2;
      sh.getRange(ri, 1).setValue(new Date());
      sh.getRange(ri, 6).setValue(author);
      sh.getRange(ri, 8).setValue(value);
      return;
    }
  }
  sh.appendRow([new Date(), room, tool, '', '', author, key, value, '']);
}
function voteDelta_(sh, room, id, delta) {
  if (!id) return;
  var rows = data_(sh);
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (String(r[1]) === room && String(r[3]) === id) {
      var ri = i + 2, v = Number(r[8]) || 0;
      sh.getRange(ri, 9).setValue(Math.max(0, v + delta));
      sh.getRange(ri, 1).setValue(new Date());
      return;
    }
  }
}
function delById_(sh, room, id) {
  if (!id) return;
  var rows = data_(sh);
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (String(r[1]) === room && String(r[3]) === id) { sh.deleteRow(i + 2); return; }
  }
}
function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ============================ MENÚ ============================ */
function onOpen() {
  try {
    SpreadsheetApp.getUi().createMenu('ORBITAL')
      .addItem('Actualizar pestañas legibles', 'actualizarVistas')
      .addToUi();
  } catch (_) {}
  try { buildViews_(DEFAULT_ROOM); } catch (_) {}
}
function actualizarVistas() { buildViews_(DEFAULT_ROOM); }

/* ====================== VISTAS LEGIBLES ====================== */
var CANVAS = [
  ['contexto', 'Contexto', '¿Cuándo ocurre el problema?'],
  ['clientes', 'Clientes', '¿Quién lo tiene más seguido?'],
  ['alternativas', 'Alternativas', '¿Qué hacen hoy para resolverlo?'],
  ['desventajas', 'Desventajas de las alternativas', '¿Qué falla en lo que usan hoy?'],
  ['emocional', 'Impacto emocional', '¿Cómo se siente la persona?'],
  ['cuantificable', 'Impacto cuantificable', '¿Qué se puede medir? (con unidades)'],
  ['problema', 'Problema (causa raíz)', '¿Cuál es la causa raíz?']
];
var ZONES = [['dice', 'Dice'], ['piensa', 'Piensa'], ['hace', 'Hace'], ['siente', 'Siente'], ['dolores', 'Dolores'], ['ganancias', 'Ganancias']];
var CONTROLS = ['', 'Eliminar el peligro', 'Sustituirlo', 'Controles de ingeniería', 'Controles administrativos', 'Equipo de protección'];
var PROBS = ['Baja', 'Media', 'Alta'];
var MATRIX = { Grave: ['Medio', 'Alto', 'Alto'], Moderada: ['Bajo', 'Medio', 'Alto'], Leve: ['Bajo', 'Bajo', 'Medio'] };

function maybeBuildViews_(room) {
  try {
    var cache = CacheService.getScriptCache(), k = 'views_' + room;
    if (cache.get(k)) return;
    cache.put(k, '1', 20);
    buildViews_(room);
  } catch (_) {}
}

/* Integrantes del equipo: cada quien tiene su propia columna en las vistas.
   El "slug" debe coincidir con el que generan las páginas (minúsculas, sin acentos ni espacios). */
var PP_SEP = '~~';
var ROSTER = [
  { slug: 'irvin', name: 'Irvin' },
  { slug: 'grace', name: 'Grace' },
  { slug: 'ruben', name: 'Ruben' },
  { slug: 'rodrigo', name: 'Rodrigo' },
  { slug: 'jona', name: 'Jona' }
];
function rosterNames_() { return ROSTER.map(function (p) { return p.name; }); }

/* kv_: mapa clave→valor. Las claves por persona (clave~~slug) se juntan en la clave
   base como texto "Nombre: valor" para que Insumos y vistas de valor único no queden vacíos. */
function kv_(rows, tool) {
  var m = {}, pp = {};
  rows.forEach(function (r) {
    if (String(r[2]) !== tool || !r[6]) return;
    var key = String(r[6]);
    var e = { v: r[7] == null ? '' : String(r[7]), a: String(r[5] || ''), t: r[0] };
    m[key] = e;
    var si = key.indexOf(PP_SEP);
    if (si >= 0 && e.v !== '') {
      var base = key.slice(0, si);
      (pp[base] = pp[base] || []).push({ who: e.a || key.slice(si + PP_SEP.length), v: e.v, t: e.t });
    }
  });
  Object.keys(pp).forEach(function (base) {
    var arr = pp[base].sort(function (a, b) { return (a.t || 0) - (b.t || 0); });
    var joined = arr.map(function (x) { return (x.who || '—') + ': ' + x.v; }).join('\n');
    var last = arr[arr.length - 1];
    m[base] = { v: joined, a: last.who, t: last.t, pp: arr };
  });
  return m;
}
function v_(m, k) { return m[k] ? m[k].v : ''; }

/* pp_: valores separados por persona → { claveBase: { slug: valor } }, para las vistas por integrante. */
function pp_(rows, tool) {
  var o = {};
  rows.forEach(function (r) {
    if (String(r[2]) !== tool || !r[6]) return;
    var key = String(r[6]), si = key.indexOf(PP_SEP);
    if (si < 0) return;
    var base = key.slice(0, si), sl = key.slice(si + PP_SEP.length);
    (o[base] = o[base] || {})[sl] = (r[7] == null ? '' : String(r[7]));
  });
  return o;
}
/* fila-matriz: etiqueta + una celda por integrante con su respuesta a esa clave base */
function ppRow_(o, label, base, fmt) {
  var row = [label];
  ROSTER.forEach(function (p) {
    var v = (o[base] && o[base][p.slug] != null) ? o[base][p.slug] : '';
    row.push(fmt ? fmt(v) : v);
  });
  return row;
}
function fmtDate_(d) {
  if (!d) return '';
  try { return Utilities.formatDate(new Date(d), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'); } catch (_) { return String(d); }
}
function n2_(x) { return (x == null || x === '' || isNaN(x)) ? '' : Math.round(Number(x) * 100) / 100; }
function gpBand_(gp) { if (gp === '' || gp == null) return ''; return gp > 200 ? 'Corrección inmediata (GP > 200)' : (gp > 85 ? 'Actuación urgente (85 < GP ≤ 200)' : 'Eliminar sin demora (GP ≤ 85)'); }
function grBand_(gr) { if (gr === '' || gr == null) return ''; return gr >= 1 ? 'Excede el límite' : (gr >= 0.5 ? 'Vigilar (≥ 0.5)' : 'Dentro del límite'); }
function sevFromC_(c) { return c >= 15 ? 'Grave' : (c >= 5 ? 'Moderada' : 'Leve'); }
function probFromP_(p) { return p >= 6 ? 2 : (p >= 3 ? 1 : 0); }
function verdict_(m, k) {
  var a1 = v_(m, 'ar1_' + k) === 'true' || v_(m, 'ar1_' + k) === 'TRUE';
  var a2 = v_(m, 'ar2_' + k) === 'true' || v_(m, 'ar2_' + k) === 'TRUE';
  var a3 = v_(m, 'ar3_' + k) === 'true' || v_(m, 'ar3_' + k) === 'TRUE';
  if (a3 && !a1 && !a2) return 'Bien calibrada';
  if (a1 && a2) return 'Ajustar: amplia y estrecha';
  if (a1) return 'Ajustar: muy amplia';
  if (a2) return 'Ajustar: muy estrecha';
  return 'Sin revisar';
}
function json_(s) { try { return JSON.parse(s); } catch (_) { return null; } }

function buildViews_(room) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var name = ss.getName();
  if (/^(Hoja de cálculo sin título|Untitled spreadsheet)/.test(name)) ss.rename('ORBITAL · Datos del equipo');
  var store = sheet_(); plainText_(store);
  var all = data_(store).filter(function (r) { return String(r[1]) === room; });
  var at = kv_(all, 'aterrizar'), ce = kv_(all, 'riesgo_cedulas'), em = kv_(all, 'empatia');
  var atp = pp_(all, 'aterrizar'), cep = pp_(all, 'riesgo_cedulas'), emp = pp_(all, 'empatia');
  var NM = rosterNames_(), headPP = ['Recuadro / campo'].concat(NM);
  var notes = all.filter(function (r) { return String(r[2]) === 'empatia' && r[3] && r[4]; });
  var events = [], reports = [];
  all.forEach(function (r) {
    if (String(r[2]) !== 'riesgo') return;
    var o = json_(r[7]); if (!o) return;
    o._ts = r[0]; o._author = String(r[5] || '');
    if (String(r[4]) === 'evento') events.push(o);
    if (String(r[4]) === 'autorreporte') reports.push(o);
  });
  var updated = 'Actualizado: ' + fmtDate_(new Date()) + ' · equipo: ' + room;

  /* ---------- 1 · Aterrizar ---------- */
  var nD = 0, nS = 0;
  var canvasRows = CANVAS.map(function (c, i) {
    var ds = v_(at, 'ds_' + c[0]); if (ds === 'D') nD++; if (ds === 'S') nS++;
    return [i + 1, c[1], c[2], v_(at, 'c_' + c[0]), ds === 'D' ? 'Dato' : (ds === 'S' ? 'Supuesto' : ''), at['c_' + c[0]] ? at['c_' + c[0]].a : '', at['c_' + c[0]] ? fmtDate_(at['c_' + c[0]].t) : ''];
  });
  var eleg = v_(at, 'elegida');
  var hmwRows = CANVAS.map(function (c) {
    var a = Number(v_(at, 'm1_' + c[0])) || 0, b = Number(v_(at, 'm2_' + c[0])) || 0;
    return [c[1], v_(at, 'hmw_' + c[0]), verdict_(at, c[0]), a || '', b || '', a + b || '', eleg === c[0] ? '★ ELEGIDA' : ''];
  });
  var ideas = []; for (var i = 1; i <= 8; i++) if (v_(at, 'r1_' + i)) ideas.push([i, v_(at, 'r1_' + i)]);
  var combo = []; for (var j = 1; j <= 5; j++) combo.push([j, v_(at, 'co_dato_' + j), v_(at, 'co_canal_' + j), v_(at, 'co_mom_' + j)]);
  var r3 = []; for (var k = 1; k <= 3; k++) if (v_(at, 'r3base_' + k) || v_(at, 'r3add_' + k)) r3.push([k, v_(at, 'r3base_' + k), v_(at, 'r3add_' + k)]);
  var chosenName = ''; CANVAS.forEach(function (c) { if (c[0] === eleg) chosenName = c[1]; });
  var canvasPP = CANVAS.map(function (c) { return ppRow_(atp, c[1], 'c_' + c[0]); });
  var dsPP = CANVAS.map(function (c) { return ppRow_(atp, c[1], 'ds_' + c[0], function (v) { return v === 'D' ? 'Dato' : (v === 'S' ? 'Supuesto' : ''); }); });
  var hmwPP = CANVAS.map(function (c) { return ppRow_(atp, c[1], 'hmw_' + c[0]); });
  var pickName = function (v) { var f = CANVAS.filter(function (x) { return x[0] === v; })[0]; return f ? f[1] : v; };
  var finPP = [ppRow_(atp, 'Idea a prototipar', 'final_idea'), ppRow_(atp, '¿Por qué en 1 día?', 'final_why'), ppRow_(atp, 'Pregunta elegida', 'elegida', pickName)];
  writeTab_(TAB.aterrizar, '#d7e64b', [
    { title: 'Aterrizar el reto · una columna por integrante · ' + updated },
    { title: 'Canvas del problema — lo que escribió cada quien', header: headPP, rows: canvasPP },
    { title: '¿Dato o Supuesto? — según cada integrante', header: headPP, rows: dsPP },
    { title: '¿Cómo podríamos…? — la pregunta de cada integrante', header: headPP, rows: hmwPP },
    { title: 'Idea finalista y pregunta elegida — por integrante', header: headPP, rows: finPP },
    { title: '¿Enviaron sus respuestas? (botón “Enviar mis respuestas”)', header: headPP, rows: [ppRow_(atp, 'Última vez que envió', '_enviado')] }
  ], [210, 160, 160, 160, 160, 160]);

  /* ---------- 2 · Empatía ---------- */
  var zoneName = {}; ZONES.forEach(function (z) { zoneName[z[0]] = z[1]; });
  var order = {}; ZONES.forEach(function (z, i) { order[z[0]] = i; });
  var noteRows = notes.slice().sort(function (a, b) { return (order[a[4]] - order[b[4]]) || ((Number(b[8]) || 0) - (Number(a[8]) || 0)); })
    .map(function (r) { return [zoneName[r[4]] || r[4], String(r[7]), Number(r[8]) || 0, String(r[5] || ''), fmtDate_(r[0])]; });
  writeTab_(TAB.empatia, '#9cc1f2', [
    { title: 'Mapa de empatía · Katya E. · por persona · ' + updated },
    { title: 'Escenario que empatizó cada integrante', header: headPP, rows: [ppRow_(emp, 'Escenario', 'escenario')] },
    { title: 'POV (la necesidad) de cada integrante', header: headPP, rows: [ppRow_(emp, 'POV', 'pov')] },
    { title: '¿Enviaron?', header: headPP, rows: [ppRow_(emp, 'Última vez que envió', '_enviado')] },
    { title: 'Notas por zona — de todo el equipo (las más votadas primero)', header: ['Zona', 'Nota', 'Votos', 'Autor', 'Fecha'], rows: noteRows.length ? noteRows : [['', '(sin notas)', '', '', '']] }
  ], [150, 300, 150, 150, 150, 150]);

  /* ---------- 3 · Riesgo · Cédulas ---------- */
  var c1 = [], placed = [];
  for (var a1 = 1; a1 <= 6; a1++) {
    var pel = v_(ce, 'c1_r' + a1 + '_pel'); if (!pel) continue;
    var pv = v_(ce, 'c2_p_' + a1), sv = v_(ce, 'c2_s_' + a1);
    var lvl = (pv !== '' && sv && MATRIX[sv]) ? MATRIX[sv][Number(pv)] : '';
    c1.push([a1, pel, v_(ce, 'c1_r' + a1 + '_ame'), v_(ce, 'c1_r' + a1 + '_vul'), v_(ce, 'c1_r' + a1 + '_dan'), pv !== '' ? PROBS[Number(pv)] : '', sv, lvl]);
    if (lvl) placed.push({ n: pel, lvl: lvl });
  }
  var prio = [];
  for (var b1 = 1; b1 <= 3; b1++) {
    var pp = v_(ce, 'c2_pr' + b1 + '_pel'); if (!pp) continue;
    var cc = Number(v_(ce, 'c2_pr' + b1 + '_ctrl')) || 0;
    prio.push([b1, pp, cc ? cc + ' · ' + CONTROLS[cc] : '', v_(ce, 'c2_pr' + b1 + '_why')]);
  }
  var tucei = [['T · Tareas', '¿Qué tiene que hacer la persona, física y mentalmente?', v_(ce, 'c4_T')],
               ['U · Usuario', '¿Cómo están su cuerpo y su mente en esa condición?', v_(ce, 'c4_U')],
               ['C · Automatización', '¿Qué hacen el software, el hardware y la interfaz?', v_(ce, 'c4_C')],
               ['E · Entorno', '¿Dónde ocurre: confinado, lejos, con retraso en la comunicación?', v_(ce, 'c4_E')],
               ['I · Interacciones', '¿Cómo se afectan los cuatro anteriores entre sí? ¿Qué pasa si uno falla?', v_(ce, 'c4_I')]];
  var genPP = [ppRow_(cep, 'Equipo', 'equipo'), ppRow_(cep, 'Tarea elegida', 'c1_tarea')];
  var c1PP = [];
  for (var hi = 1; hi <= 6; hi++) {
    c1PP.push(ppRow_(cep, 'P' + hi + ' · Peligro', 'c1_r' + hi + '_pel'));
    c1PP.push(ppRow_(cep, 'P' + hi + ' · Amenaza', 'c1_r' + hi + '_ame'));
    c1PP.push(ppRow_(cep, 'P' + hi + ' · ¿Quién es vulnerable?', 'c1_r' + hi + '_vul'));
    c1PP.push(ppRow_(cep, 'P' + hi + ' · Daño posible', 'c1_r' + hi + '_dan'));
    c1PP.push(ppRow_(cep, 'P' + hi + ' · Probabilidad', 'c2_p_' + hi, function (v) { return (v !== '' && !isNaN(v)) ? PROBS[Number(v)] : ''; }));
    c1PP.push(ppRow_(cep, 'P' + hi + ' · Severidad', 'c2_s_' + hi));
  }
  var prioPP = [];
  for (var pk = 1; pk <= 3; pk++) {
    prioPP.push(ppRow_(cep, 'Prioridad ' + pk + ' · Peligro', 'c2_pr' + pk + '_pel'));
    prioPP.push(ppRow_(cep, 'Prioridad ' + pk + ' · Control', 'c2_pr' + pk + '_ctrl', function (v) { var n = Number(v) || 0; return n ? n + ' · ' + CONTROLS[n] : ''; }));
    prioPP.push(ppRow_(cep, 'Prioridad ' + pk + ' · Por qué', 'c2_pr' + pk + '_why'));
  }
  var tuceiPP = [
    ppRow_(cep, 'T · Tareas', 'c4_T'), ppRow_(cep, 'U · Usuario', 'c4_U'),
    ppRow_(cep, 'C · Automatización', 'c4_C'), ppRow_(cep, 'E · Entorno', 'c4_E'),
    ppRow_(cep, 'I · Interacciones', 'c4_I')
  ];
  writeTab_(TAB.cedulas, '#ef6a5a', [
    { title: 'Evaluación de riesgos · Cédulas · una columna por integrante · ' + updated },
    { title: 'Datos generales', header: headPP, rows: genPP },
    { title: 'Cédula 1 y 2 · Peligros, probabilidad y severidad — por integrante', header: headPP, rows: c1PP },
    { title: 'Cédula 2 · Prioridades y control elegido — por integrante', header: headPP, rows: prioPP },
    { title: 'Cédula 4 · Lienzo del sistema T·U·C·E·I — por integrante', header: headPP, rows: tuceiPP },
    { title: '¿Enviaron su cédula? (botón “Enviar mi cédula”)', header: headPP, rows: [ppRow_(cep, 'Última vez que envió', '_enviado')] }
  ], [210, 170, 170, 170, 170, 170]);

  /* ---------- 4 · Riesgo · Eventos ---------- */
  var evRows = events.slice().sort(function (a, b) { return (Number(b.GP) || 0) - (Number(a.GP) || 0); }).map(function (e) {
    var cell = (e.C != null && e.P != null) ? MATRIX[sevFromC_(e.C)][probFromP_(e.P)] : '';
    var ctrls = (e.ctrl || []).slice().sort().map(function (c) { return c + ' · ' + CONTROLS[c]; }).join(', ');
    return [e.title || '', e.when || '', e.type === 'rezagado' ? 'Rezagado (daño)' : 'Adelantado (aviso)', e.pel || '', e.ame || '', e.vul || '', e.rie || '', e.dan || '',
            n2_(e.C), n2_(e.E), n2_(e.P), n2_(e.GP), gpBand_(e.GP), e.grVar || '', n2_(e.grReal), n2_(e.grLim), e.grUnit || '', n2_(e.GR), grBand_(e.GR), cell, ctrls, e.ctrlDesc || '', e.author || e._author, fmtDate_(e._ts)];
  });
  writeTab_(TAB.eventos, '#ef6a5a', [
    { title: 'Panel de eventos (ordenados por GP: lo urgente primero) · ' + updated },
    { title: 'Eventos', header: ['Título', 'Sol / fecha', 'Tipo de indicador', 'Peligro', 'Amenaza', 'Vulnerabilidad', 'Riesgo', 'Daño', 'C', 'E', 'P', 'GP', 'Banda GP', 'Variable', 'Medido', 'Límite', 'Unidad', 'GR', 'Banda GR', 'Matriz', 'Controles', 'Qué harán y por qué', 'Autor', 'Registrado'], rows: evRows.length ? evRows : [['(sin eventos)']] }
  ], [220, 110, 140, 200, 200, 200, 200, 200, 45, 45, 45, 60, 190, 130, 70, 70, 60, 55, 120, 70, 220, 260, 110, 130]);

  /* ---------- 5 · Riesgo · Autorreportes ---------- */
  var hist = {}, arRows = [];
  reports.slice().sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); }).forEach(function (r) {
    var v = r.v || {}, s = (v.fat || 0) + (v.dol || 0) + (v.ani || 0) + (v.sue || 0);
    var prev = hist[r.code] || [], base = prev.length ? prev.reduce(function (x, y) { return x + y; }, 0) / prev.length : '';
    var high = [v.fat, v.dol, v.ani, v.sue].some(function (x) { return x >= 4; });
    var flag = r.near ? 'Casi-incidente' : (base !== '' && s - base >= 2 ? 'Sobre su línea base' : (high ? 'Escala en 4–5' : 'En su línea base'));
    arRows.push([r.code || '', r.date || '', v.fat || '', v.dol || '', v.ani || '', v.sue || '', s, n2_(base), base === '' ? '' : n2_(s - base), r.near || '', flag, r.author || r._author, fmtDate_(r._ts)]);
    hist[r.code] = prev.concat([s]);
  });
  writeTab_(TAB.autorreportes, '#f2c14e', [
    { title: 'Cédula 3 · Autorreporte diario (5 es lo peor en todas las escalas) · ' + updated },
    { title: 'Autorreportes', header: ['Código', 'Fecha / sol', 'Fatiga', 'Dolor', 'Ánimo', 'Sueño', 'Suma (4–20)', 'Línea base previa', 'Diferencia', '¿Algo estuvo a punto de salir mal?', 'Señal', 'Autor', 'Registrado'], rows: arRows.length ? arRows : [['(sin autorreportes)']] }
  ], [90, 100, 60, 60, 60, 60, 90, 110, 90, 300, 150, 110, 130]);

  /* ---------- 6 · Insumos requerimientos ---------- */
  var sup = []; CANVAS.forEach(function (c) { if (v_(at, 'ds_' + c[0]) === 'S' && v_(at, 'c_' + c[0])) sup.push(c[1]); });
  var topZone = function (z) { return notes.filter(function (r) { return r[4] === z; }).sort(function (a, b) { return (Number(b[8]) || 0) - (Number(a[8]) || 0); }).slice(0, 3).map(function (r) { return String(r[7]); }).join(' · '); };
  var altos = placed.filter(function (x) { return x.lvl === 'Alto'; }).map(function (x) { return x.n; }).join(' · ');
  var leads = events.filter(function (e) { return e.type !== 'rezagado'; }).map(function (e) { return e.title; }).join(' · ');
  var lags = events.filter(function (e) { return e.type === 'rezagado'; }).map(function (e) { return e.title + (e.dan ? ' (' + e.dan + ')' : ''); }).join(' · ');
  var thresholds = {}; events.forEach(function (e) { if (e.grVar && e.grLim) thresholds[e.grVar + ' ≤ ' + e.grLim + ' ' + (e.grUnit || '')] = 1; });
  var nears = reports.filter(function (r) { return r.near; }).map(function (r) { return r.near; }).join(' · ');
  var hmwTxt = eleg ? v_(at, 'hmw_' + eleg) : '';
  var hmwScore = eleg ? ((Number(v_(at, 'm1_' + eleg)) || 0) + (Number(v_(at, 'm2_' + eleg)) || 0)) : '';
  var ins = [
    ['1 · Problema', 'Problema (causa raíz)', v_(at, 'c_problema'), 'Aterrizar · Canvas'],
    ['1 · Problema', 'Contexto: cuándo ocurre', v_(at, 'c_contexto'), 'Aterrizar · Canvas'],
    ['1 · Problema', 'Impacto emocional', v_(at, 'c_emocional'), 'Aterrizar · Canvas'],
    ['1 · Problema', 'Impacto cuantificable', v_(at, 'c_cuantificable'), 'Aterrizar · Canvas'],
    ['1 · Problema', 'Evidencia', nD + ' recuadros con dato y ' + nS + ' supuestos', 'Aterrizar · Dato/Supuesto'],
    ['1 · Problema', 'Supuestos por verificar', sup.join(' · '), 'Aterrizar · Dato/Supuesto'],
    ['2 · Usuario', 'Cliente / usuario', v_(at, 'c_clientes'), 'Aterrizar · Canvas'],
    ['2 · Usuario', 'Escenario empatizado', v_(em, 'escenario'), 'Empatía'],
    ['2 · Usuario', 'POV del mapa de empatía', v_(em, 'pov'), 'Empatía'],
    ['2 · Usuario', 'Dolores más votados', topZone('dolores'), 'Empatía'],
    ['2 · Usuario', 'Ganancias más votadas', topZone('ganancias'), 'Empatía'],
    ['2 · Usuario', 'Cuerpo y mente en la condición (U)', v_(ce, 'c4_U'), 'Cédula 4'],
    ['3 · Alternativas', 'Qué usan hoy', v_(at, 'c_alternativas'), 'Aterrizar · Canvas'],
    ['3 · Alternativas', 'Qué les falla', v_(at, 'c_desventajas'), 'Aterrizar · Canvas'],
    ['4 · Objetivo', 'Pregunta guía elegida', hmwTxt, 'Aterrizar · Matriz (total ' + hmwScore + ' de 6)'],
    ['4 · Objetivo', 'Idea a prototipar', v_(at, 'final_idea'), 'Aterrizar · Elegir'],
    ['4 · Objetivo', 'Alcance de la demo (por qué cabe en un día)', v_(at, 'final_why'), 'Aterrizar · Elegir'],
    ['5 · Funcionales', 'Datos a monitorear (opciones de “Dato”)', [1, 2, 3, 4, 5].map(function (x) { return v_(at, 'co_dato_' + x); }).filter(String).join(' · '), 'Aterrizar · Ronda 2'],
    ['5 · Funcionales', 'Canales de aviso (opciones de “Canal”)', [1, 2, 3, 4, 5].map(function (x) { return v_(at, 'co_canal_' + x); }).filter(String).join(' · '), 'Aterrizar · Ronda 2'],
    ['5 · Funcionales', 'Momentos de uso (opciones de “Momento”)', [1, 2, 3, 4, 5].map(function (x) { return v_(at, 'co_mom_' + x); }).filter(String).join(' · '), 'Aterrizar · Ronda 2'],
    ['5 · Funcionales', 'Tareas que el sistema debe apoyar (T)', v_(ce, 'c4_T'), 'Cédula 4'],
    ['5 · Funcionales', 'Qué hace el software/hardware/interfaz (C)', v_(ce, 'c4_C'), 'Cédula 4'],
    ['6 · Riesgos', 'Peligros en nivel Alto', altos, 'Cédula 2'],
    ['6 · Riesgos', 'Controles elegidos', prio.map(function (x) { return x[1] + ' → ' + x[2]; }).join(' · '), 'Cédula 2 · Prioridades'],
    ['6 · Riesgos', 'Indicadores adelantados (avisos)', leads, 'Eventos'],
    ['6 · Riesgos', 'Indicadores rezagados (daños)', lags, 'Eventos'],
    ['6 · Riesgos', 'Umbrales usados para GR', Object.keys(thresholds).join(' · '), 'Eventos'],
    ['6 · Riesgos', 'Escalas subjetivas a registrar', 'Fatiga, dolor, ánimo y sueño (1–5) + casi-incidente', 'Cédula 3'],
    ['6 · Riesgos', 'Casi-incidentes reportados', nears, 'Cédula 3'],
    ['7 · No funcionales', 'Entorno de operación (E)', v_(ce, 'c4_E'), 'Cédula 4'],
    ['7 · No funcionales', 'Interacciones y fallas en cadena (I)', v_(ce, 'c4_I'), 'Cédula 4'],
    ['7 · No funcionales', 'Principios de interfaz', 'Línea base personal · pocas alarmas bien jerarquizadas · lectura simple · DOL · 10 heurísticas de Nielsen', 'Riesgo · bloque E']
  ];
  writeTab_(TAB.insumos, '#4ccb8f', [
    { title: 'Insumos para la hoja de requerimientos · ' + updated },
    { title: 'Cada fila es materia prima de una sección del documento. La columna “Fuente” justifica de dónde salió la decisión.', header: ['Sección del documento', 'Insumo', 'Valor (lo que escribió el equipo)', 'Fuente'], rows: ins }
  ], [160, 260, 560, 220]);

  /* ---------- 0 · LEEME ---------- */
  writeTab_(TAB.leeme, '#f4f8ff', [
    { title: 'ORBITAL · Cómo leer esta hoja · ' + updated },
    { title: 'Pestañas', header: ['Pestaña', 'Qué contiene', 'Una fila es…'], rows: [
      [TAB.aterrizar, 'Taller “Aterrizar el reto”: canvas, preguntas, autorrevisión, matriz e ideación', 'un recuadro, una pregunta o una idea'],
      [TAB.empatia, 'Mapa de empatía de Katya E. y su POV', 'una nota adhesiva'],
      [TAB.cedulas, 'Evaluación de riesgos: cédulas 1, 2 y 4', 'un peligro, una prioridad o una caja del lienzo'],
      [TAB.eventos, 'Eventos registrados en el panel con GP, GR, matriz y control', 'un evento'],
      [TAB.autorreportes, 'Cédula 3: autorreportes diarios comparados contra la línea base de cada persona', 'un autorreporte'],
      [TAB.insumos, 'Materia prima para la hoja de requerimientos y para justificar decisiones ante mentores', 'un insumo, con su fuente'],
      [SHEET_NAME, 'Almacén crudo que usan las páginas (no se ve bonito a propósito)', 'un campo de un formulario, una nota o un registro']
    ] },
    { title: 'Reglas', rows: [
      ['Las pestañas 0 a 6 se reconstruyen solas cada vez que alguien escribe (como máximo cada 20 s), al abrir la hoja o desde el menú ORBITAL › Actualizar pestañas legibles.'],
      ['No editen las pestañas 0 a 6 a mano: se sobrescriben. Para cambiar algo, háganlo desde las páginas (aterrizar.html, empatia.html, riesgo.html).'],
      ['No borren ni renombren la pestaña “Datos”: es donde viven los datos de verdad.']
    ] },
    { title: 'Diccionario de la pestaña “Datos”', header: ['Columna o clave', 'Significado'], rows: [
      ['ts', 'Fecha y hora de la última escritura'], ['room', 'Equipo (por defecto tacos-de-asada)'], ['tool', 'Herramienta: aterrizar, empatia, riesgo_cedulas o riesgo'],
      ['id · zone · votes', 'Solo para notas de empatía y registros de riesgo (eventos y autorreportes)'], ['author', 'Quién escribió (el nombre de la barra de conexión)'],
      ['key · value', 'Un campo y su valor. Una fila por campo: cada cambio actualiza la misma fila'],
      ['pov · escenario', 'Empatía: la necesidad (POV) y el escenario que se empatizó'],
      ['c_* · ds_*', 'Aterrizar: recuadro del canvas y si es Dato (D) o Supuesto (S)'], ['hmw_* · ar1/2/3_*', 'Aterrizar: pregunta “¿Cómo podríamos…?” y sus 3 casillas de autorrevisión'],
      ['m1_* · m2_* · elegida', 'Aterrizar: matriz de elección (dato NASA, prototipo en 1 día) y la pregunta elegida'],
      ['r1_* · co_* · r3* · final_*', 'Aterrizar: rondas 1, 2 y 3 de ideación y la idea finalista'],
      ['c1_* · c2_* · c4_* · equipo', 'Riesgo: cédula 1 (peligros), cédula 2 (probabilidad, severidad, prioridades) y cédula 4 (lienzo)'],
      ['riesgo / evento · autorreporte', 'Riesgo: un registro completo guardado como JSON en “value”; aquí se despliega en columnas']
    ] }
  ], [240, 560, 320]);
  orderTabs_(ss);
}

/* Escribe una pestaña legible por bloques (título, encabezado, filas). */
function writeTab_(name, color, blocks, widths) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clear();
  try { sh.setTabColor(color); } catch (_) {}
  var maxCols = 1;
  blocks.forEach(function (b) { if (b.header) maxCols = Math.max(maxCols, b.header.length); (b.rows || []).forEach(function (r) { maxCols = Math.max(maxCols, r.length); }); });
  var row = 1;
  blocks.forEach(function (b, bi) {
    var t = sh.getRange(row, 1, 1, 1);
    t.setValue(b.title);
    t.setFontWeight('bold').setFontSize(bi === 0 ? 14 : 11).setFontColor(bi === 0 ? '#071428' : '#1e52c8');
    row++;
    if (b.header) {
      var h = sh.getRange(row, 1, 1, b.header.length);
      h.setValues([b.header]);
      h.setFontWeight('bold').setBackground('#0d2244').setFontColor('#f4f8ff').setWrap(true).setVerticalAlignment('middle');
      row++;
    }
    var rows = (b.rows || []).map(function (r) { var c = r.slice(); while (c.length < (b.header ? b.header.length : 1)) c.push(''); return c; });
    if (rows.length) {
      var w = rows[0].length;
      rows = rows.map(function (r) { return r.slice(0, w); });
      var d = sh.getRange(row, 1, rows.length, w);
      d.setValues(rows);
      d.setWrap(true).setVerticalAlignment('top');
      if (rows.length > 1) {
        for (var i = 0; i < rows.length; i += 2) sh.getRange(row + i, 1, 1, w).setBackground('#f3f6fb');
      }
      row += rows.length;
    }
    row++;
  });
  (widths || []).forEach(function (wd, i) { try { sh.setColumnWidth(i + 1, wd); } catch (_) {} });
  try { sh.setFrozenRows(1); } catch (_) {}
}

function orderTabs_(ss) {
  var names = [TAB.leeme, TAB.aterrizar, TAB.empatia, TAB.cedulas, TAB.eventos, TAB.autorreportes, TAB.insumos, SHEET_NAME];
  names.forEach(function (n, i) {
    var s = ss.getSheetByName(n);
    if (s) { try { ss.setActiveSheet(s); ss.moveActiveSheet(i + 1); } catch (_) {} }
  });
  var first = ss.getSheetByName(TAB.leeme); if (first) try { ss.setActiveSheet(first); } catch (_) {}
}
