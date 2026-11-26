/* HCD Kit · vote.js — módulo reutilizable de voto ponderado de equipo (3·2·1)
   Mismas reglas que el mapa de empatía:
   - Cada persona reparte 3, 2 y 1 punto a tres candidatos distintos.
   - No puedes votar un candidato propio (que tú propusiste).
   - No puedes dar el mismo puntaje a dos candidatos; para mover un punto, se libera (✕).
   Funciona en local (localStorage) y sincronizado (Sync). Guarda candidatos con
   op:'add' (zone=group) y las boletas con op:'set' key = vb~~<group>~~<slug>.

   Uso:
     VoteWidget({ tool:'aterrizar', group:'hmw', mount:elemento,
                  title:'…', prompt:'…', placeholder:'…',
                  seed:function(){ return 'texto sugerido para prellenar'; } });
*/
(function(){
  function injectCSS(){
    if(document.getElementById('votewidget-css')) return;
    var st=document.createElement('style'); st.id='votewidget-css';
    st.textContent=
      '.vw{--l:var(--line,rgba(156,193,242,.16));--cd:var(--card,rgba(18,38,74,.6));--lime:var(--lime,#d7e64b);--bs:var(--blue-soft,#4e8fe6);--bp:var(--blue-pale,#9cc1f2);--mut:var(--mute,#a9bbd6);--wh:var(--white,#f4f8ff);--wn:var(--warn,#f2c14e)}'+
      '.vw-h{font-family:Archivo,sans-serif;font-weight:900;font-size:1.05rem;color:var(--wh);margin:0 0 4px}'+
      '.vw-p{color:var(--mut);font-size:.9rem;margin:0 0 12px}'+
      '.vw-propose{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}'+
      '.vw-propose textarea{flex:1;min-width:220px;min-height:52px;background:rgba(7,20,40,.55);border:1px solid var(--l);border-radius:10px;color:var(--wh);font-family:Overpass,sans-serif;font-size:.94rem;padding:10px 12px;resize:vertical}'+
      '.vw-propose textarea:focus{outline:none;border-color:var(--lime)}'+
      '.vw-propose button{flex:0 0 auto;align-self:flex-start;padding:11px 16px;border:none;border-radius:10px;background:var(--lime);color:#071428;font-family:Archivo,sans-serif;font-weight:800;font-size:.86rem;cursor:pointer}'+
      '.vw-budget{display:flex;gap:9px;align-items:center;flex-wrap:wrap;background:rgba(10,26,51,.5);border:1px solid var(--l);border-radius:11px;padding:10px 14px;margin-bottom:12px}'+
      '.vw-budget .bl{font-family:Archivo,sans-serif;font-weight:800;font-size:.74rem;color:var(--mut)}'+
      '.vw-pill{font-family:Archivo,sans-serif;font-weight:900;font-size:.8rem;padding:4px 10px;border-radius:999px;border:1px solid var(--l)}'+
      '.vw-pill.p3{color:var(--lime);border-color:rgba(215,230,75,.5)}.vw-pill.p2{color:var(--bs);border-color:rgba(78,143,230,.5)}.vw-pill.p1{color:var(--bp);border-color:rgba(156,193,242,.5)}'+
      '.vw-pill.used{opacity:.45;text-decoration:line-through}'+
      '.vw-opt{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;background:var(--cd);border:1px solid var(--l);border-radius:11px;padding:12px 14px;margin-bottom:8px}'+
      '.vw-opt.mine{opacity:.6;border-style:dashed}.vw-opt.scored{border-color:rgba(215,230,75,.4)}'+
      '.vw-tx{font-size:.94rem;color:var(--wh);line-height:1.4}'+
      '.vw-au{font-size:.7rem;color:var(--bp);font-family:Archivo,sans-serif;font-weight:700;margin-top:4px}'+
      '.vw-mine{font-size:.7rem;color:var(--wn);font-family:Archivo,sans-serif;font-weight:800;margin-top:4px}'+
      '.vw-toks{display:flex;gap:6px}'+
      '.vw-tok{width:38px;height:38px;border-radius:9px;border:1px solid var(--l);background:rgba(7,20,40,.6);color:var(--wh);font-family:Archivo,sans-serif;font-weight:900;font-size:.9rem;cursor:pointer;transition:.15s;display:flex;align-items:center;justify-content:center}'+
      '.vw-tok:hover:not(:disabled){border-color:var(--lime)}.vw-tok:disabled{opacity:.28;cursor:not-allowed}'+
      '.vw-tok.on3{background:var(--lime);color:#071428;border-color:var(--lime)}.vw-tok.on2{background:var(--bs);color:#071428;border-color:var(--bs)}.vw-tok.on1{background:var(--bp);color:#071428;border-color:var(--bp)}'+
      '.vw-tok.clr{color:var(--mut)}'+
      '.vw-del{cursor:pointer;border:none;background:transparent;color:var(--mut);font-size:.85rem;opacity:.6;margin-left:6px}.vw-del:hover{color:#ef6a5a;opacity:1}'+
      '.vw-empty{color:var(--mut);opacity:.65;font-size:.86rem;font-style:italic;padding:6px 2px}'+
      '.vw-need{background:rgba(242,193,78,.1);border:1px solid rgba(242,193,78,.35);border-radius:11px;padding:11px 14px;color:var(--wh);font-size:.88rem;margin-bottom:12px}.vw-need b{color:var(--wn)}'+
      '.vw-res{margin-top:14px;border-top:1px solid var(--l);padding-top:12px}'+
      '.vw-res .rt{font-family:Archivo,sans-serif;font-weight:800;font-size:.74rem;letter-spacing:.06em;text-transform:uppercase;color:var(--lime);margin-bottom:8px}'+
      '.vw-rrow{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:6px 0;border-top:1px solid var(--l)}.vw-rrow:first-of-type{border-top:none}'+
      '.vw-rrow .pos{font-family:Archivo,sans-serif;font-weight:900;color:var(--mut);width:22px;text-align:center}.vw-rrow.win .pos{color:var(--lime)}'+
      '.vw-rrow .rtx{color:var(--bp);font-size:.9rem}.vw-rrow.win .rtx{color:var(--wh)}'+
      '.vw-rrow .rsc{font-family:Archivo,sans-serif;font-weight:900;color:var(--lime);white-space:nowrap}.vw-rrow .rsc small{color:var(--mut);font-weight:700}';
    document.head.appendChild(st);
  }

  function slug(n){ return (String(n||'').toLowerCase().replace(/[^a-z0-9]+/g,'')).slice(0,24)||'anon'; }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function uid(){ return 'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

  window.VoteWidget=function(opts){
    injectCSS();
    var Sync=opts.Sync||window.Sync;
    var tool=opts.tool, group=opts.group, host=opts.mount;
    var VB='vb~~'+group+'~~';
    var LS='vote_'+tool+'_'+group;
    var state={cands:[],kv:{}};
    function connected(){ return Sync && Sync.isConnected && Sync.isConnected(); }
    function me(){ return (Sync&&Sync.getName)?Sync.getName():''; }
    function meSlug(){ return slug(me()); }
    function hasName(){ return !!(me()&&me().trim()); }
    function lload(){ try{ state=JSON.parse(localStorage.getItem(LS)||'{"cands":[],"kv":{}}'); }catch(e){ state={cands:[],kv:{}}; } if(!state.cands)state.cands=[]; if(!state.kv)state.kv={}; }
    function lsave(){ try{ localStorage.setItem(LS,JSON.stringify(state)); }catch(e){} }

    function load(cb){
      if(connected()){
        Sync.read(tool).then(function(j){
          var cands=[],kv={};
          ((j&&j.rows)||[]).forEach(function(r){
            if(r.zone===group && r.id){ cands.push({id:String(r.id),author:String(r.author||''),value:String(r.value||'')}); }
            else if(r.key!=null && String(r.key).indexOf(VB)===0){ kv[String(r.key)]=(r.value==null?'':String(r.value)); }
          });
          state.cands=cands; state.kv=kv; cb&&cb();
        }).catch(function(){ lload(); cb&&cb(); });
      } else { lload(); cb&&cb(); }
    }
    function addCand(text){
      text=(text||'').trim(); if(!text) return;
      if(connected()){ Sync.post({op:'add',tool:tool,zone:group,value:text}).then(refresh).catch(function(){}); }
      else { state.cands.push({id:uid(),author:me()||'yo',value:text}); lsave(); render(); }
    }
    function delCand(id){
      if(connected()){ Sync.post({op:'del',id:id}).then(refresh).catch(function(){}); }
      else { state.cands=state.cands.filter(function(c){return c.id!==id}); lsave(); render(); }
    }
    function myBallot(){ var raw=state.kv[VB+meSlug()]; var b={}; try{b=JSON.parse(raw||'{}');}catch(e){} return {p3:b.p3||'',p2:b.p2||'',p1:b.p1||''}; }
    function saveBallot(b){
      var key=VB+meSlug(), val=JSON.stringify({p3:b.p3||'',p2:b.p2||'',p1:b.p1||''});
      state.kv[key]=val;
      if(connected()){ Sync.post({op:'set',tool:tool,key:key,value:val}).catch(function(){}); } else lsave();
      render();
    }
    function tally(){
      var score={}; state.cands.forEach(function(c){ score[c.id]=0; });
      Object.keys(state.kv).forEach(function(k){
        if(k.indexOf(VB)===0){ var b={}; try{b=JSON.parse(state.kv[k]||'{}');}catch(e){}
          [['p3',3],['p2',2],['p1',1]].forEach(function(p){ var id=b[p[0]]; if(id&&score[id]!==undefined) score[id]+=p[1]; }); }
      });
      return state.cands.map(function(c){ return {c:c,s:score[c.id]||0}; }).sort(function(a,b){ return b.s-a.s || (a.c.id<b.c.id?-1:1); });
    }
    function voters(){ var n=0; Object.keys(state.kv).forEach(function(k){ if(k.indexOf(VB)===0){ var b={};try{b=JSON.parse(state.kv[k]||'{}');}catch(e){} if(b.p3||b.p2||b.p1)n++; } }); return n; }
    function myCand(){ return state.cands.filter(function(c){ return slug(c.author)===meSlug(); })[0]; }

    /* ---- render ---- */
    host.className='vw';
    host.innerHTML='<div class="vw-h">'+esc(opts.title||'Votación')+'</div><div class="vw-p">'+esc(opts.prompt||'')+'</div>'+
      '<div class="vw-propose" data-vwp></div><div data-vwneed></div><div data-vwbudget></div><div data-vwlist></div><div class="vw-res" data-vwres></div>';
    var elProp=host.querySelector('[data-vwp]'), elNeed=host.querySelector('[data-vwneed]'),
        elBudget=host.querySelector('[data-vwbudget]'), elList=host.querySelector('[data-vwlist]'), elRes=host.querySelector('[data-vwres]');

    function renderPropose(){
      var mc=myCand();
      if(mc){
        elProp.innerHTML='<div class="vw-opt" style="grid-template-columns:1fr auto"><div><div class="vw-tx">'+esc(mc.value)+'</div><div class="vw-au">Tu propuesta</div></div><button class="vw-del" data-delmine title="Quitar mi propuesta">✕ quitar</button></div>';
        elProp.querySelector('[data-delmine]').addEventListener('click',function(){ delCand(mc.id); });
      } else {
        var seed=''; try{ seed=opts.seed?(opts.seed()||''):''; }catch(e){}
        elProp.innerHTML='<textarea placeholder="'+esc(opts.placeholder||'Tu propuesta…')+'">'+esc(seed)+'</textarea><button type="button" data-add>Proponer</button>';
        elProp.querySelector('[data-add]').addEventListener('click',function(){ var ta=elProp.querySelector('textarea'); addCand(ta.value); });
      }
    }
    function renderVote(){
      if(!hasName()){ elNeed.innerHTML='<div class="vw-need"><b>Pon tu nombre</b> (⚙️ Conectar, arriba) para proponer y votar: la herramienta necesita saber quién eres para no dejarte votar tu propia propuesta.</div>'; }
      else elNeed.innerHTML='';
      var cands=state.cands;
      var votable=cands.filter(function(c){ return slug(c.author)!==meSlug(); });
      if(!cands.length){ elBudget.innerHTML=''; elList.innerHTML='<div class="vw-empty">Aún no hay propuestas. Cada quien propone la suya arriba.</div>'; return; }
      var b=myBallot();
      elBudget.innerHTML='<div class="vw-budget"><span class="bl">Tus puntos:</span>'+
        '<span class="vw-pill p3'+(b.p3?' used':'')+'">3</span><span class="vw-pill p2'+(b.p2?' used':'')+'">2</span><span class="vw-pill p1'+(b.p1?' used':'')+'">1</span>'+
        '<span class="bl" style="margin-left:auto">'+voters()+' voto(s)</span></div>';
      if(!votable.length){ elList.innerHTML='<div class="vw-empty">Solo está tu propuesta. Cuando tu equipo proponga (conectados), aparecerán aquí para votar.</div>'; return; }
      elList.innerHTML=votable.map(function(c){
        var cur=b.p3===c.id?3:b.p2===c.id?2:b.p1===c.id?1:0;
        function tk(v){ var tok='p'+v, used=b[tok], onHere=used===c.id, en=(!used)||onHere;
          return '<button class="vw-tok'+(onHere?(' on'+v):'')+'" data-v="'+v+'" data-c="'+esc(c.id)+'" '+(en?'':'disabled')+'>'+v+'</button>'; }
        var clr='<button class="vw-tok clr" data-clr="'+esc(c.id)+'" '+(cur?'':'disabled')+' title="Quitar">✕</button>';
        return '<div class="vw-opt'+(cur?' scored':'')+'"><div><div class="vw-tx">'+esc(c.value)+'</div><div class="vw-au">'+esc(c.author)+'</div></div><div class="vw-toks">'+tk(3)+tk(2)+tk(1)+clr+'</div></div>';
      }).join('');
      [].forEach.call(elList.querySelectorAll('[data-v]'),function(btn){
        btn.addEventListener('click',function(){ if(btn.disabled) return;
          var cid=btn.getAttribute('data-c'), v='p'+btn.getAttribute('data-v'); var bb=myBallot();
          ['p3','p2','p1'].forEach(function(f){ if(bb[f]===cid) bb[f]=''; }); bb[v]=cid; saveBallot(bb); });
      });
      [].forEach.call(elList.querySelectorAll('[data-clr]'),function(btn){
        btn.addEventListener('click',function(){ if(btn.disabled) return;
          var cid=btn.getAttribute('data-clr'); var bb=myBallot(); ['p3','p2','p1'].forEach(function(f){ if(bb[f]===cid) bb[f]=''; }); saveBallot(bb); });
      });
    }
    function renderResults(){
      var t=tally();
      if(!t.length || t.every(function(r){return r.s===0;})){ elRes.innerHTML='<div class="rt">Resultado</div><div class="vw-empty">Sin votos todavía.</div>'; return; }
      elRes.innerHTML='<div class="rt">Resultado del equipo</div>'+t.slice(0,6).map(function(r,i){
        return '<div class="vw-rrow'+(i===0&&r.s>0?' win':'')+'"><span class="pos">'+(i+1)+'</span><span class="rtx">'+esc(r.c.value)+'</span><span class="rsc">'+r.s+' <small>pts</small></span></div>';
      }).join('');
    }
    function render(){ renderPropose(); renderVote(); renderResults(); }
    function refresh(){ load(render); }

    if(Sync && Sync.onContext) Sync.onContext(function(){ refresh(); });
    refresh();
    return { refresh:refresh, winner:function(){ var t=tally(); return (t.length&&t[0].s>0)?t[0].c.value:''; } };
  };
})();
