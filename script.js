/* ─────────────────────────────────────────
   DADOS E PERSISTÊNCIA
───────────────────────────────────────── */
const CATEGORIAS_PADRAO = {
  biblia:      { nome: 'Bíblia',                 cor: '#7C3AED' },
  cuidados:    { nome: 'Mulher',                 cor: '#EC4899' },
  estudos:     { nome: 'Estudos',                cor: '#F59E0B' },
  trabalho:    { nome: 'Trabalho',               cor: '#22C55E' },
  formacao:    { nome: 'Inteligência Emocional', cor: '#14B8A6' },
  exercicios:  { nome: 'Atividade Física',       cor: '#3B82F6' },
  violino:     { nome: 'Violino',                cor: '#06B6D4' },
  lilye:       { nome: 'Lilye',                  cor: '#F97316' },
  profession:  { nome: 'Profession Teens',       cor: '#0F766E' },
  informatica: { nome: 'Informática',            cor: '#6366F1' },
  pessoal:     { nome: 'Pessoal / Lazer',        cor: '#A855F7' },
  casa:        { nome: 'Casa / Afazeres',        cor: '#E11D48' },
  reunioes:    { nome: 'Reuniões / Eventos',     cor: '#DC2626' },
};

const PALETA   = ['#7C3AED','#EC4899','#F59E0B','#22C55E','#14B8A6','#3B82F6','#06B6D4','#F97316','#0F766E','#6366F1','#A855F7','#E11D48','#DC2626'];
const STORE_KEY = 'minha_rotina_v2';
const CAT_KEY   = 'minha_rotina_cats_v2';

function lerJSON(key, fb){ try{ const r=localStorage.getItem(key); return r ? JSON.parse(r) : fb; }catch(e){ return fb; } }
function salvarTarefas(){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(tarefas)); }catch(e){} }
function salvarCats(){    try{ localStorage.setItem(CAT_KEY,   JSON.stringify(catsCustom)); }catch(e){} }

let tarefas    = lerJSON(STORE_KEY, []);
let catsCustom = lerJSON(CAT_KEY, {});
let categorias = {...CATEGORIAS_PADRAO, ...catsCustom};

/* ─────────────────────────────────────────
   UTILIDADES
───────────────────────────────────────── */
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function isoHoje(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function parseLocalDate(iso){
  const [y,m,d] = iso.split('-').map(Number);
  return new Date(y, m-1, d);
}
function dataHora(t){
  const [y,m,d] = t.data.split('-').map(Number);
  const [hh,mm] = t.hora.split(':').map(Number);
  return new Date(y, m-1, d, hh, mm, 0, 0);
}
function ehHoje(t){ return t.data === isoHoje(); }
function capitalizar(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
function escapar(s){ return (s||'').replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
function hexRgba(hex, a){ const h=hex.replace('#',''); return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`; }
function cat(k){ return categorias[k] || { nome:'Geral', cor:'#9AA3B2' }; }
function rotuloData(iso){
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const d    = parseLocalDate(iso);
  const diff = Math.round((d - hoje) / 86400000);
  if(diff===0) return 'Hoje';
  if(diff===1) return 'Amanhã';
  if(diff===-1) return 'Ontem';
  return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}).replace('.','');
}

/* ─────────────────────────────────────────
   RELÓGIO
───────────────────────────────────────── */
function atualizarRelogio(){
  const d = new Date();
  document.getElementById('topDate').textContent  = capitalizar(d.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'}));
  document.getElementById('topClock').textContent = d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  document.getElementById('topYear').textContent  = d.getFullYear();
}
atualizarRelogio();
setInterval(atualizarRelogio, 1000);

/* ─────────────────────────────────────────
   ESTADO DA UI
───────────────────────────────────────── */
let filtroCat    = 'todos';
let escopo       = 'hoje';
let editandoId   = null;
let catSelecionada = null;
let corNovaCat   = PALETA[0];
let metricasPeriodo = 'semana';
let metricsVisible  = false;

/* ─────────────────────────────────────────
   RENDER — CATEGORIAS (sidebar + modal)
───────────────────────────────────────── */
function renderCategorias(){
  const doDia = tarefas.filter(ehHoje);

  let html = `<button class="filter-btn ${filtroCat==='todos'?'active':''}" data-cat="todos">
    <span class="dot" style="background:linear-gradient(135deg,#3B82F6,#8B5CF6)"></span>
    <span class="filter-name">Todas as atividades</span>
    <span class="filter-count">${doDia.length}</span></button>`;

  Object.keys(categorias).forEach(k => {
    const c = categorias[k];
    const ehCustom = !!catsCustom[k];
    html += `<button class="filter-btn ${filtroCat===k?'active':''}" data-cat="${k}">
      <span class="dot" style="background:${c.cor}"></span>
      <span class="filter-name">${escapar(c.nome)}</span>
      <span class="filter-count">${doDia.filter(t=>t.cat===k).length}</span>
      ${ehCustom ? `<span class="filter-rm" data-rmcat="${k}" title="Remover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></span>` : ''}
    </button>`;
  });
  document.getElementById('filters').innerHTML = html;

  // Pills no modal
  let pills = Object.keys(categorias).map(k => {
    const c = categorias[k];
    return `<div class="cat-pill ${catSelecionada===k?'sel':''}" data-pill="${k}" style="--cat:${c.cor};--cat-bg:${hexRgba(c.cor,.12)}">
      <span class="dot" style="background:${c.cor}"></span>${escapar(c.nome)}</div>`;
  }).join('');
  pills += `<div class="cat-pill add" id="pillAdd"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" style="margin-right:4px"><path d="M12 5v14M5 12h14"/></svg>Nova categoria</div>`;
  document.getElementById('catPills').innerHTML = pills;
}

/* ─────────────────────────────────────────
   RENDER — CARDS
───────────────────────────────────────── */
function tarefasVisiveis(){
  return tarefas
    .filter(t => escopo==='hoje' ? ehHoje(t) : true)
    .filter(t => filtroCat==='todos' ? true : t.cat===filtroCat)
    .sort((a,b) => dataHora(a) - dataHora(b));
}

function render(){
  const cont  = document.getElementById('cards');
  const lista = tarefasVisiveis();
  document.getElementById('listTitle').firstChild.textContent = (escopo==='hoje' ? 'Compromissos de hoje ' : 'Todos os compromissos ');
  document.getElementById('listCount').textContent = lista.length ? `· ${lista.length}` : '';

  if(lista.length === 0){
    cont.innerHTML = `<div class="empty"><span class="emoji">🗓️</span><h3>Nada por aqui ainda</h3>
      <p>${filtroCat!=='todos' ? 'Nenhuma tarefa nesta categoria.' : 'Clique em <b>"Novo Compromisso"</b> para adicionar sua primeira atividade.'}</p></div>`;
  } else {
    cont.innerHTML = lista.map(cardHTML).join('');
  }
  renderCategorias();
  atualizarProgresso();
  if(metricsVisible) renderMetrics();
}

function cardHTML(t){
  const c = cat(t.cat);
  const lembreteTxt = t.lembrete > 0
    ? (t.lembrete >= 60 ? (t.lembrete/60)+'h antes' : t.lembrete+' min antes')
    : 'Sem lembrete';
  return `<article class="card ${t.feito?'done':''}" style="--cat:${c.cor}">
    <div class="card-spine"></div>
    <div class="card-time"><span class="hh">${t.hora}</span><span class="when">${rotuloData(t.data)}</span></div>
    <div class="card-body">
      <div class="card-titlerow">
        <span class="card-title">${escapar(t.titulo)}</span>
        <span class="chip" style="background:${hexRgba(c.cor,.12)};color:${c.cor}"><span class="dot" style="background:${c.cor}"></span>${escapar(c.nome)}</span>
      </div>
      ${t.desc ? `<div class="card-desc">${escapar(t.desc)}</div>` : ''}
      <div class="card-meta"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/></svg>${lembreteTxt}</span></div>
    </div>
    <div class="card-actions">
      <div class="mini-actions">
        <button class="icon-btn" data-action="edit" data-id="${t.id}" title="Editar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
        <button class="icon-btn danger" data-action="del" data-id="${t.id}" title="Excluir">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
        </button>
      </div>
      <button class="btn-checkin" data-action="check" data-id="${t.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        <span class="label-do">Check-in</span><span class="label-done">Concluído</span>
      </button>
    </div>
  </article>`;
}

function atualizarProgresso(){
  const doDia = tarefas.filter(ehHoje);
  const feitas = doDia.filter(t=>t.feito).length, total = doDia.length;
  const pct = total ? Math.round(feitas/total*100) : 0;
  document.getElementById('progressFraction').textContent = `${feitas}/${total}`;
  document.getElementById('progressPct').textContent      = `${pct}%`;
  document.getElementById('progressBar').style.width      = pct + '%';
  const hint = document.getElementById('progressHint');
  hint.textContent = total===0 ? 'Nenhuma tarefa para hoje ainda.' :
                     pct===100 ? '🎉 Tudo concluído. Mandou bem!' :
                     `Faltam ${total-feitas} de ${total} tarefas.`;
}

/* ─────────────────────────────────────────
   AÇÕES NOS CARDS
───────────────────────────────────────── */
function alternarCheck(id){
  const t = tarefas.find(x=>x.id===id); if(!t) return;
  t.feito = !t.feito;
  salvarTarefas(); render(); reagendar();
  if(t.feito) toast('check','Tarefa concluída', t.titulo);
}
function excluir(id){
  const t = tarefas.find(x=>x.id===id); if(!t) return;
  if(!confirm(`Excluir "${t.titulo}"?`)) return;
  tarefas = tarefas.filter(x=>x.id!==id);
  salvarTarefas(); render(); reagendar();
}

/* ─────────────────────────────────────────
   MODAL
───────────────────────────────────────── */
const overlay = document.getElementById('overlay');

function proximoHorario(){
  const d = new Date(); d.setMinutes(d.getMinutes()+30); d.setSeconds(0);
  return `${String(d.getHours()).padStart(2,'0')}:${String(Math.floor(d.getMinutes()/5)*5).padStart(2,'0')}`;
}

function abrirNovo(){
  editandoId = null;
  catSelecionada = filtroCat!=='todos' ? filtroCat : null;
  document.getElementById('modalTitle').textContent = 'Novo compromisso';
  document.getElementById('fTitle').value = '';
  document.getElementById('fTitle').classList.remove('err');
  document.getElementById('fDate').value  = isoHoje();
  document.getElementById('fTime').value  = proximoHorario();
  document.getElementById('fReminder').value = '10';
  document.getElementById('fDesc').value  = '';
  fecharNovaCat(); renderCategorias();
  overlay.classList.add('open');
  setTimeout(()=>document.getElementById('fTitle').focus(), 60);
}

function abrirEdicao(id){
  const t = tarefas.find(x=>x.id===id); if(!t) return;
  editandoId = id; catSelecionada = t.cat;
  document.getElementById('modalTitle').textContent = 'Editar compromisso';
  document.getElementById('fTitle').value    = t.titulo;
  document.getElementById('fTitle').classList.remove('err');
  document.getElementById('fDate').value     = t.data;
  document.getElementById('fTime').value     = t.hora;
  document.getElementById('fReminder').value = String(t.lembrete||0);
  document.getElementById('fDesc').value     = t.desc||'';
  fecharNovaCat(); renderCategorias();
  overlay.classList.add('open');
}

function fecharModal(){ overlay.classList.remove('open'); }

function salvarCompromisso(){
  const tituloEl = document.getElementById('fTitle');
  const titulo   = tituloEl.value.trim();
  const data     = document.getElementById('fDate').value;
  const hora     = document.getElementById('fTime').value;
  const lembrete = parseInt(document.getElementById('fReminder').value, 10) || 0;
  const desc     = document.getElementById('fDesc').value.trim();

  if(!titulo){ tituloEl.classList.add('err'); tituloEl.focus(); toast('alert','Falta o título','Dê um nome para a tarefa.'); return; }
  if(!catSelecionada) catSelecionada = 'pessoal';
  if(!data||!hora){ toast('alert','Falta data ou horário','Preencha quando será.'); return; }

  if(editandoId){
    Object.assign(tarefas.find(x=>x.id===editandoId), {titulo,cat:catSelecionada,data,hora,lembrete,desc});
    toast('check','Compromisso atualizado', titulo);
  } else {
    tarefas.push({id:uid(), titulo, cat:catSelecionada, data, hora, lembrete, desc, feito:false});
    toast('check','Compromisso salvo', titulo);
  }
  salvarTarefas(); fecharModal(); render(); reagendar();
}

function abrirNovaCat(){
  const p = document.getElementById('newcatPanel'); p.hidden = false;
  corNovaCat = PALETA[0];
  document.getElementById('swatches').innerHTML = PALETA.map(c =>
    `<span class="swatch ${c===corNovaCat?'sel':''}" data-sw="${c}" style="background:${c}"></span>`).join('');
  document.getElementById('newcatName').value = '';
  setTimeout(()=>document.getElementById('newcatName').focus(), 40);
}
function fecharNovaCat(){ const p=document.getElementById('newcatPanel'); if(p) p.hidden=true; }

function adicionarCategoria(){
  const nome = document.getElementById('newcatName').value.trim();
  if(!nome){ toast('alert','Falta o nome','Dê um nome para a categoria.'); return; }
  const key = 'c_'+uid();
  catsCustom[key] = {nome, cor:corNovaCat};
  categorias = {...CATEGORIAS_PADRAO, ...catsCustom};
  salvarCats(); catSelecionada = key; fecharNovaCat(); renderCategorias();
  toast('check','Categoria criada', nome);
}

function removerCategoria(key){
  const c = categorias[key]; if(!c) return;
  const qtd = tarefas.filter(t=>t.cat===key).length;
  if(!confirm(`Remover a categoria "${c.nome}"?` + (qtd ? `\n${qtd} tarefa(s) passarão para "Pessoal".` : ''))) return;
  tarefas.forEach(t=>{ if(t.cat===key) t.cat='pessoal'; });
  delete catsCustom[key];
  categorias = {...CATEGORIAS_PADRAO, ...catsCustom};
  if(filtroCat===key) filtroCat='todos';
  salvarCats(); salvarTarefas(); render(); reagendar();
}

/* ─────────────────────────────────────────
   LISTENERS — MODAL & CARDS
───────────────────────────────────────── */
document.getElementById('btnNew').addEventListener('click', abrirNovo);
document.getElementById('btnCancel').addEventListener('click', fecharModal);
document.getElementById('modalClose').addEventListener('click', fecharModal);
document.getElementById('btnSave').addEventListener('click', salvarCompromisso);
overlay.addEventListener('click', e=>{ if(e.target===overlay) fecharModal(); });

document.getElementById('cards').addEventListener('click', e=>{
  const b = e.target.closest('[data-action]'); if(!b) return;
  const id = b.dataset.id;
  if(b.dataset.action==='check') alternarCheck(id);
  else if(b.dataset.action==='edit') abrirEdicao(id);
  else if(b.dataset.action==='del') excluir(id);
});

document.getElementById('filters').addEventListener('click', e=>{
  const rm = e.target.closest('[data-rmcat]');
  if(rm){ e.stopPropagation(); removerCategoria(rm.dataset.rmcat); return; }
  const b = e.target.closest('.filter-btn'); if(!b) return;
  filtroCat = b.dataset.cat; render();
});

document.getElementById('catPills').addEventListener('click', e=>{
  if(e.target.closest('#pillAdd')){ abrirNovaCat(); return; }
  const p = e.target.closest('[data-pill]'); if(!p) return;
  catSelecionada = p.dataset.pill; renderCategorias();
});

document.getElementById('newcatAdd').addEventListener('click', adicionarCategoria);
document.getElementById('newcatCancel').addEventListener('click', fecharNovaCat);
document.getElementById('swatches').addEventListener('click', e=>{
  const s = e.target.closest('[data-sw]'); if(!s) return;
  corNovaCat = s.dataset.sw;
  document.querySelectorAll('#swatches .swatch').forEach(x=>x.classList.toggle('sel', x.dataset.sw===corNovaCat));
});
document.getElementById('newcatName').addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); adicionarCategoria(); } });

document.getElementById('scope').addEventListener('click', e=>{
  const b = e.target.closest('.seg-btn'); if(!b) return;
  escopo = b.dataset.scope;
  document.querySelectorAll('#scope .seg-btn').forEach(x=>x.classList.toggle('active', x===b));
  render();
});

document.addEventListener('keydown', e=>{
  if(e.key==='Escape' && overlay.classList.contains('open')) fecharModal();
  if(e.key==='Enter'  && overlay.classList.contains('open') && e.target.id==='fTitle') salvarCompromisso();
});

/* ─────────────────────────────────────────
   MÉTRICAS — DADOS
───────────────────────────────────────── */

/** Retorna [isoInicio, isoFim] para o período selecionado */
function periodoRange(periodo){
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const toIso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  if(periodo === 'semana'){
    const ini = new Date(hoje); ini.setDate(hoje.getDate() - 6);
    return [toIso(ini), toIso(hoje)];
  }
  if(periodo === 'mes'){
    const ini = new Date(hoje); ini.setDate(hoje.getDate() - 29);
    return [toIso(ini), toIso(hoje)];
  }
  // ano
  const ini = new Date(hoje); ini.setDate(hoje.getDate() - 364);
  return [toIso(ini), toIso(hoje)];
}

function tarefasNoPeriodo(periodo){
  const [ini, fim] = periodoRange(periodo);
  return tarefas.filter(t => t.data >= ini && t.data <= fim);
}

/** Lista de dias ISO entre ini e fim (inclusive) */
function diasEntre(iniIso, fimIso){
  const dias = [];
  let cur = parseLocalDate(iniIso);
  const end = parseLocalDate(fimIso);
  while(cur <= end){
    const iso = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}-${String(cur.getDate()).padStart(2,'0')}`;
    dias.push(iso);
    cur = new Date(cur); cur.setDate(cur.getDate()+1);
  }
  return dias;
}

/* ─────────────────────────────────────────
   MÉTRICAS — RENDER
───────────────────────────────────────── */
function renderMetrics(){
  const p     = metricasPeriodo;
  const lista = tarefasNoPeriodo(p);
  const [ini, fim] = periodoRange(p);
  const dias  = diasEntre(ini, fim);

  // ── KPIs ──
  const total    = lista.length;
  const feitas   = lista.filter(t=>t.feito).length;
  const taxa     = total ? Math.round(feitas/total*100) : 0;
  const streakN  = calcStreak();

  const kpis = [
    { label:'Total de tarefas', value: total,          sub: `no período`, cls:'' },
    { label:'Concluídas',       value: feitas,         sub: `${taxa}% de conclusão`, cls:'green' },
    { label:'Pendentes',        value: total - feitas, sub: 'ainda em aberto', cls: (total-feitas > 0 ? 'amber':'') },
    { label:'Sequência',        value: `${streakN}d`,  sub: 'dias consecutivos', cls:'accent' },
  ];
  document.getElementById('kpiRow').innerHTML = kpis.map(k=>
    `<div class="kpi-card ${k.cls}">
       <div class="kpi-label">${k.label}</div>
       <div class="kpi-value">${k.value}</div>
       <div class="kpi-sub">${k.sub}</div>
     </div>`).join('');

  // ── Bar chart (tarefas concluídas por dia) ──
  // Para semana: 7 dias. Para mês: agrupa por semana. Para ano: agrupa por mês.
  renderBarChart(lista, dias, p);

  // ── Donut (por categoria) ──
  renderDonut(lista);

  // ── Taxa circular ──
  renderRate(taxa);

  // ── Heat map ──
  renderHeatmap(p);
}

function renderBarChart(lista, dias, periodo){
  let buckets = [];

  if(periodo === 'semana'){
    const semDias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    buckets = dias.map(iso => {
      const d = parseLocalDate(iso);
      return {
        lbl: semDias[d.getDay()],
        total: lista.filter(t=>t.data===iso).length,
        feitas: lista.filter(t=>t.data===iso&&t.feito).length,
      };
    });
  } else if(periodo === 'mes'){
    // agrupar em 5 semanas
    const semanas = Array.from({length:5}, ()=>({lbl:'',total:0,feitas:0,dias:[]}));
    dias.forEach((iso,i)=>{ const si=Math.floor(i/7); if(si<5) semanas[si].dias.push(iso); });
    semanas.forEach((s,i)=>{
      if(s.dias.length === 0){ buckets.push({lbl:'',total:0,feitas:0}); return; }
      const d0 = parseLocalDate(s.dias[0]);
      s.lbl = `S${i+1}`;
      s.total  = lista.filter(t=>s.dias.includes(t.data)).length;
      s.feitas = lista.filter(t=>s.dias.includes(t.data)&&t.feito).length;
      buckets.push({lbl:s.lbl, total:s.total, feitas:s.feitas});
    });
  } else {
    // ano: agrupar por mês
    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const map = {};
    dias.forEach(iso=>{
      const m = iso.slice(0,7);
      if(!map[m]) map[m]={total:0,feitas:0};
      const ts = lista.filter(t=>t.data===iso);
      map[m].total  += ts.length;
      map[m].feitas += ts.filter(t=>t.feito).length;
    });
    buckets = Object.keys(map).sort().map(m=>({
      lbl: meses[parseInt(m.slice(5,7),10)-1],
      total: map[m].total, feitas: map[m].feitas,
    }));
  }

  const maxVal = Math.max(...buckets.map(b=>b.feitas), 1);
  const wrap = document.getElementById('barChart');
  wrap.innerHTML = buckets.map(b=>{
    const h = Math.round((b.feitas / maxVal) * 100);
    return `<div class="bc-col">
      <div class="bc-bar-wrap"><div class="bc-bar ${b.feitas===0?'zero':''}" style="height:${h}%"></div></div>
      <div class="bc-num">${b.feitas}</div>
      <div class="bc-lbl">${b.lbl}</div>
    </div>`;
  }).join('');
}

function renderDonut(lista){
  if(lista.length === 0){
    document.getElementById('donutSvg').innerHTML = `<circle cx="60" cy="60" r="46" fill="none" stroke="#E7EAF0" stroke-width="16"/>`;
    document.getElementById('donutLegend').innerHTML = `<div class="dl-item" style="color:var(--muted-2)">Sem dados</div>`;
    return;
  }

  // contar por categoria (só feitas)
  const feitas = lista.filter(t=>t.feito);
  const counts = {};
  feitas.forEach(t=>{ counts[t.cat] = (counts[t.cat]||0)+1; });
  // se nada feito, conta total
  const source = Object.keys(counts).length ? counts : {};
  if(!Object.keys(source).length){
    lista.forEach(t=>{ counts[t.cat] = (counts[t.cat]||0)+1; });
  }

  const total = Object.values(counts).reduce((a,b)=>a+b,0);
  const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6);

  // SVG donut (r=46, circumference ≈ 289)
  const R = 46, CX = 60, CY = 60, CIRCUM = 2*Math.PI*R;
  let offset = 0;
  const paths = sorted.map(([k,v])=>{
    const c = cat(k);
    const frac = v/total;
    const dash = frac * CIRCUM;
    const p = `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${c.cor}"
      stroke-width="16" stroke-dasharray="${dash} ${CIRCUM}"
      stroke-dashoffset="${-offset}" style="transition:stroke-dasharray .5s"/>`;
    offset += dash;
    return p;
  });

  document.getElementById('donutSvg').innerHTML =
    `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#EDF0F5" stroke-width="16"/>` +
    paths.join('');

  document.getElementById('donutLegend').innerHTML = sorted.map(([k,v])=>{
    const c = cat(k);
    const pct = Math.round(v/total*100);
    return `<div class="dl-item">
      <span class="dl-dot" style="background:${c.cor}"></span>
      <span class="dl-name">${escapar(c.nome)}</span>
      <span class="dl-pct">${pct}%</span>
    </div>`;
  }).join('');
}

function renderRate(taxa){
  const wrap = document.getElementById('rateDisplay');
  const deg  = taxa * 3.6; // 0–360
  wrap.innerHTML = `
    <div class="rate-circle" style="background:conic-gradient(var(--accent) ${deg}deg,#E7EAF0 ${deg}deg)">
      <div class="rate-inner">
        <span class="rate-num">${taxa}%</span>
      </div>
    </div>
    <div class="rate-caption">tarefas<br>concluídas</div>`;
}

function renderHeatmap(periodo){
  const [ini, fim] = periodoRange(periodo);
  const dias = diasEntre(ini, fim);
  const sub  = document.getElementById('heatmapSub');

  // label do período
  const fmtDate = iso => parseLocalDate(iso).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});
  sub.textContent = `${fmtDate(ini)} — ${fmtDate(fim)}`;

  // contar por dia
  const map = {};
  dias.forEach(iso => {
    const ts = tarefas.filter(t=>t.data===iso);
    map[iso] = { total: ts.length, feitas: ts.filter(t=>t.feito).length };
  });

  const maxFeitas = Math.max(...Object.values(map).map(v=>v.feitas), 1);

  // organizar em colunas de 7 (semanas)
  const semanas = [];
  let col = [];
  dias.forEach((iso,i) => {
    col.push(iso);
    if(col.length === 7 || i === dias.length-1){ semanas.push(col); col=[]; }
  });

  const nomeDia = ['D','S','T','Q','Q','S','S'];
  const hm = document.getElementById('heatmap');

  hm.innerHTML = semanas.map(sem => {
    const cells = sem.map(iso => {
      const v = map[iso]||{total:0,feitas:0};
      const frac = v.feitas / maxFeitas;
      const lvl  = frac === 0 ? '' : frac < 0.33 ? 'l1' : frac < 0.66 ? 'l2' : frac < 0.9 ? 'l3' : 'l4';
      const d    = parseLocalDate(iso);
      const lbl  = d.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'});
      return `<div class="hm-cell ${lvl}" title="${lbl}: ${v.feitas} feita(s) / ${v.total} total"></div>`;
    }).join('');
    return `<div class="hm-col">${cells}</div>`;
  }).join('');
}

/** Calcula quantos dias consecutivos até hoje o usuário concluiu ao menos 1 tarefa */
function calcStreak(){
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  let streak = 0;
  for(let i = 0; i < 365; i++){
    const d = new Date(hoje); d.setDate(hoje.getDate()-i);
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const concluiu = tarefas.some(t=>t.data===iso && t.feito);
    if(concluiu) streak++;
    else if(i > 0) break; // permite hoje sem conclusão e continua
  }
  return streak;
}

/* ─────────────────────────────────────────
   LISTENERS — MÉTRICAS
───────────────────────────────────────── */
document.getElementById('btnMetrics').addEventListener('click', ()=>{
  metricsVisible = !metricsVisible;
  const panel   = document.getElementById('metricsPanel');
  const btn     = document.getElementById('btnMetrics');
  panel.hidden  = !metricsVisible;
  btn.classList.toggle('active', metricsVisible);
  if(metricsVisible) renderMetrics();
});

document.getElementById('metricsPeriod').addEventListener('click', e=>{
  const b = e.target.closest('.seg-btn'); if(!b) return;
  metricasPeriodo = b.dataset.period;
  document.querySelectorAll('#metricsPeriod .seg-btn').forEach(x=>x.classList.toggle('active', x===b));
  renderMetrics();
});

/* ─────────────────────────────────────────
   NOTIFICAÇÕES & SOM
───────────────────────────────────────── */
let timers = [], audioCtx = null;

function bip(){
  try{
    audioCtx = audioCtx || new(window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended') audioCtx.resume();
    [880,1175].forEach((f,i)=>{
      const o=audioCtx.createOscillator(), g=audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.type='sine'; o.frequency.value=f;
      const t0=audioCtx.currentTime+i*0.28;
      g.gain.setValueAtTime(0.0001,t0);
      g.gain.exponentialRampToValueAtTime(0.35,t0+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001,t0+0.26);
      o.start(t0); o.stop(t0+0.27);
    });
  }catch(e){}
}

function pedirPermissao(){
  if(!('Notification' in window)){ toast('alert','Sem suporte','Este navegador não tem API de notificações.'); return; }
  try{ audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)(); audioCtx.resume(); }catch(e){}
  Notification.requestPermission().then(p=>{
    atualizarBotaoNotif();
    if(p==='granted'){ toast('check','Lembretes ativados','Você será avisado antes de cada compromisso.'); reagendar(); }
    else if(p==='denied'){ toast('alert','Lembretes bloqueados','Libere as notificações nas configurações do navegador.'); }
  });
}

function atualizarBotaoNotif(){
  const btn=document.getElementById('notifBtn'), lbl=document.getElementById('notifLabel');
  const perm=('Notification' in window)?Notification.permission:'denied';
  btn.classList.remove('on','off');
  if(perm==='granted'){ btn.classList.add('on'); lbl.textContent='Lembretes ativos'; }
  else if(perm==='denied'){ btn.classList.add('off'); lbl.textContent='Lembretes bloqueados'; }
  else { btn.classList.add('off'); lbl.textContent='Ativar lembretes'; }
}

function dispararAlerta(t){
  const c = cat(t.cat);
  bip();
  if(('Notification' in window) && Notification.permission==='granted'){
    const n = new Notification('⏰ '+t.titulo, {
      body: `${c.nome} • às ${t.hora}`+(t.desc?`\n${t.desc}`:''),
      tag: t.id, requireInteraction: true,
    });
    n.onclick = ()=>{ window.focus(); n.close(); };
  }
  toast('alert','⏰ Lembrete: '+t.titulo, `${c.nome} • às ${t.hora}`);
}

function reagendar(){
  timers.forEach(clearTimeout); timers=[];
  const agora = Date.now();
  tarefas.forEach(t=>{
    if(t.feito || !t.lembrete) return;
    const alvo  = dataHora(t).getTime() - t.lembrete*60000;
    const delay = alvo - agora;
    if(delay > 0 && delay < 2147483647) timers.push(setTimeout(()=>dispararAlerta(t), delay));
  });
}

document.getElementById('notifBtn').addEventListener('click', pedirPermissao);

/* ─────────────────────────────────────────
   TOASTS
───────────────────────────────────────── */
function toast(tipo, titulo, sub){
  const wrap = document.getElementById('toasts');
  const el   = document.createElement('div');
  el.className = 'toast' + (tipo==='alert'?' alert':'');
  const icon = tipo==='alert'
    ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>'
    : '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  el.innerHTML = `<div class="t-ic">${icon}</div><div><b>${escapar(titulo)}</b>${sub?`<small>${escapar(sub)}</small>`:''}</div>`;
  wrap.appendChild(el);
  setTimeout(()=>{
    el.style.transition='opacity .3s,transform .3s';
    el.style.opacity='0'; el.style.transform='translateX(20px)';
    setTimeout(()=>el.remove(), 300);
  }, tipo==='alert' ? 7000 : 3200);
}

/* ─────────────────────────────────────────
   INICIALIZAÇÃO
───────────────────────────────────────── */
atualizarBotaoNotif();
render();
reagendar();