const STORAGE_KEY = "gearup_activities_v1";
const STORAGE_OBS = "gearup_observacoes_v1";

const statusLabel = {
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
};

const mockData = [
  {
    id: "1",
    data: "2026-02-10",
    equipe: "THE-EQP001",
    integrantes: "Francisco e Calebe",
    subestacao: "CPM",
    alimentador: "CPM01C2",
    equipamento: "074844-7",
    atividadeProgramada: "FALHA DE COMUNICAÇÃO",
    horarioPrevisto: "10:00 às 12:00",
    observacao: "NDS - 45",
    status: "pendente",
  },
  {
    id: "2",
    data: "2026-02-10",
    equipe: "THE-EQP001",
    integrantes: "Francisco e Calebe",
    subestacao: "JFR",
    alimentador: "JFR01C1",
    equipamento: "145607-5",
    atividadeProgramada: "FALHA DE COMUNICAÇÃO",
    horarioPrevisto: "15:30 às 16:30",
    observacao: "NDS - 44",
    status: "em_andamento",
  },
  {
    id: "3",
    data: "2026-02-10",
    equipe: "THE-EQP002",
    integrantes: "Matheus e Wellington",
    subestacao: "MQP",
    alimentador: "MPQ01N4",
    equipamento: "090341-4",
    atividadeProgramada: "FALHA DE COMUNICAÇÃO",
    horarioPrevisto: "08:00 às 09:30",
    observacao: "NDS - 43",
    status: "concluido",
  },
];

function uid(){
  return String(Date.now()) + "_" + Math.random().toString(16).slice(2);
}

function loadData(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return [...mockData];
    const parsed = JSON.parse(raw);
    if(!Array.isArray(parsed)) return [...mockData];
    return parsed;
  }catch{
    return [...mockData];
  }
}

function saveData(data){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadObs(){
  return localStorage.getItem(STORAGE_OBS) || "";
}
function saveObs(text){
  localStorage.setItem(STORAGE_OBS, text || "");
}

let data = loadData();

const elToday = document.getElementById("today");
const elStats = document.getElementById("stats");
const elTbody = document.getElementById("tbody");

const elSearch = document.getElementById("search");
const elFilterDate = document.getElementById("filterDate");
const elFilterStatus = document.getElementById("filterStatus");
const elFilterEquipe = document.getElementById("filterEquipe");
const elFilters = document.getElementById("filters");

const elBtnAdd = document.getElementById("btnAdd");
const elBtnExport = document.getElementById("btnExport");
const elBtnToggleFilters = document.getElementById("btnToggleFilters");
const elBtnClearFilters = document.getElementById("btnClearFilters");

const elModal = document.getElementById("modal");
const elForm = document.getElementById("form");
const elModalTitle = document.getElementById("modalTitle");

const elObs = document.getElementById("observacoes");

const f = {
  data: document.getElementById("f_data"),
  equipe: document.getElementById("f_equipe"),
  integrantes: document.getElementById("f_integrantes"),
  subestacao: document.getElementById("f_subestacao"),
  alimentador: document.getElementById("f_alimentador"),
  equipamento: document.getElementById("f_equipamento"),
  atividadeProgramada: document.getElementById("f_atividadeProgramada"),
  horarioPrevisto: document.getElementById("f_horarioPrevisto"),
  observacao: document.getElementById("f_observacao"),
  status: document.getElementById("f_status"),
};

let editingId = null;

function setToday(){
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  elToday.textContent = today;
}

function getEquipes(list){
  const set = new Set(list.map(d => (d.equipe || "").trim()).filter(Boolean));
  return Array.from(set).sort((a,b)=>a.localeCompare(b));
}

function applyFilters(list){
  const q = (elSearch.value || "").trim().toLowerCase();
  const d = elFilterDate.value || "";
  const st = elFilterStatus.value || "todos";
  const eq = elFilterEquipe.value || "todas";

  return list.filter(entry => {
    if(d && entry.data !== d) return false;
    if(st !== "todos" && entry.status !== st) return false;
    if(eq !== "todas" && entry.equipe !== eq) return false;

    if(q){
      const blob = [
        entry.data, entry.equipe, entry.integrantes, entry.subestacao,
        entry.alimentador, entry.equipamento, entry.atividadeProgramada,
        entry.horarioPrevisto, entry.observacao, statusLabel[entry.status] || ""
      ].join(" ").toLowerCase();
      if(!blob.includes(q)) return false;
    }

    return true;
  });
}

function renderEquipeOptions(){
  const equipes = getEquipes(data);
  const current = elFilterEquipe.value || "todas";

  elFilterEquipe.innerHTML = `<option value="todas">Todas</option>` + equipes.map(e =>
    `<option value="${escapeHtml(e)}">${escapeHtml(e)}</option>`
  ).join("");

  if([...elFilterEquipe.options].some(o => o.value === current)){
    elFilterEquipe.value = current;
  }
}

function renderStats(list){
  const total = list.length;
  const pendentes = list.filter(d => d.status === "pendente").length;
  const emAndamento = list.filter(d => d.status === "em_andamento").length;
  const concluidos = list.filter(d => d.status === "concluido").length;

  elStats.innerHTML = `
    <div class="stat">
      <div class="icon">📋</div>
      <div class="meta">
        <div class="value">${total}</div>
        <div class="label">Total</div>
      </div>
    </div>
    <div class="stat">
      <div class="icon">⚠️</div>
      <div class="meta">
        <div class="value">${pendentes}</div>
        <div class="label">Pendentes</div>
      </div>
    </div>
    <div class="stat">
      <div class="icon">⏱️</div>
      <div class="meta">
        <div class="value">${emAndamento}</div>
        <div class="label">Em Andamento</div>
      </div>
    </div>
    <div class="stat">
      <div class="icon">✅</div>
      <div class="meta">
        <div class="value">${concluidos}</div>
        <div class="label">Concluídos</div>
      </div>
    </div>
  `;
}

function badge(status){
  return `<span class="badge ${status}">${statusLabel[status] || status}</span>`;
}

function renderTable(list){
  elTbody.innerHTML = list.map(entry => `
    <tr>
      <td>${escapeHtml(entry.data || "")}</td>
      <td><b>${escapeHtml(entry.equipe || "")}</b></td>
      <td>${escapeHtml(entry.integrantes || "")}</td>
      <td>${escapeHtml(entry.subestacao || "")}</td>
      <td>${escapeHtml(entry.alimentador || "")}</td>
      <td><span style="font-family:var(--mono);font-weight:800">${escapeHtml(entry.equipamento || "")}</span></td>
      <td>${escapeHtml(entry.atividadeProgramada || "")}</td>
      <td>${escapeHtml(entry.horarioPrevisto || "")}</td>
      <td>${escapeHtml(entry.observacao || "")}</td>
      <td>${badge(entry.status)}</td>
      <td>
        <div class="row-actions">
          <button class="small-btn" data-edit="${entry.id}">✏️</button>
          <button class="small-btn" data-del="${entry.id}">🗑️</button>
        </div>
      </td>
    </tr>
  `).join("");

  // actions
  elTbody.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => openEdit(btn.getAttribute("data-edit")));
  });
  elTbody.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => delEntry(btn.getAttribute("data-del")));
  });
}

function render(){
  const filtered = applyFilters(data);
  renderEquipeOptions();
  renderStats(filtered);
  renderTable(filtered);
}

function openModal(){
  elModal.classList.remove("hidden");
}
function closeModal(){
  elModal.classList.add("hidden");
  editingId = null;
  elForm.reset();
  f.data.value = new Date().toISOString().slice(0,10);
  f.status.value = "pendente";
}
function openNew(){
  editingId = null;
  elModalTitle.textContent = "Nova Atividade";
  elForm.reset();
  f.data.value = new Date().toISOString().slice(0,10);
  f.status.value = "pendente";
  openModal();
}
function openEdit(id){
  const entry = data.find(d => d.id === id);
  if(!entry) return;
  editingId = id;
  elModalTitle.textContent = "Editar Atividade";

  f.data.value = entry.data || "";
  f.equipe.value = entry.equipe || "";
  f.integrantes.value = entry.integrantes || "";
  f.subestacao.value = entry.subestacao || "";
  f.alimentador.value = entry.alimentador || "";
  f.equipamento.value = entry.equipamento || "";
  f.atividadeProgramada.value = entry.atividadeProgramada || "";
  f.horarioPrevisto.value = entry.horarioPrevisto || "";
  f.observacao.value = entry.observacao || "";
  f.status.value = entry.status || "pendente";

  openModal();
}

function delEntry(id){
  const entry = data.find(d => d.id === id);
  if(!entry) return;
  const ok = confirm(`Deseja excluir a atividade da equipe "${entry.equipe}"?`);
  if(!ok) return;
  data = data.filter(d => d.id !== id);
  saveData(data);
  render();
}

function onSubmit(e){
  e.preventDefault();

  const payload = {
    id: editingId || uid(),
    data: f.data.value || "",
    equipe: (f.equipe.value || "").trim(),
    integrantes: (f.integrantes.value || "").trim(),
    subestacao: (f.subestacao.value || "").trim(),
    alimentador: (f.alimentador.value || "").trim(),
    equipamento: (f.equipamento.value || "").trim(),
    atividadeProgramada: (f.atividadeProgramada.value || "").trim(),
    horarioPrevisto: (f.horarioPrevisto.value || "").trim(),
    observacao: (f.observacao.value || "").trim(),
    status: f.status.value || "pendente",
  };

  if(!payload.equipe){
    alert("Informe a equipe.");
    return;
  }

  if(editingId){
    data = data.map(d => d.id === editingId ? payload : d);
  }else{
    data = [payload, ...data];
  }

  saveData(data);
  closeModal();
  render();
}

function exportExcel(){
  // CSV simples (abre no Excel)
  const rows = [
    ["Data","Equipe","Integrantes","Subestação","Alimentador","Equipamento","Atividade Programada","Horário Previsto","Observação","Status"],
    ...applyFilters(data).map(d => [
      d.data, d.equipe, d.integrantes, d.subestacao, d.alimentador, d.equipamento,
      d.atividadeProgramada, d.horarioPrevisto, d.observacao, statusLabel[d.status] || d.status
    ])
  ];

  const csv = rows.map(r => r.map(v => {
    const s = String(v ?? "");
    if(s.includes('"') || s.includes(",") || s.includes("\n")){
      return `"${s.replaceAll('"','""')}"`;
    }
    return s;
  }).join(",")).join("\n");

  const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "gestao_equipamentos.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* events */
elBtnAdd.addEventListener("click", openNew);
elBtnExport.addEventListener("click", exportExcel);

elBtnToggleFilters.addEventListener("click", () => {
  elFilters.classList.toggle("hidden");
});

elBtnClearFilters.addEventListener("click", () => {
  elSearch.value = "";
  elFilterDate.value = "";
  elFilterStatus.value = "todos";
  elFilterEquipe.value = "todas";
  render();
});

[elSearch, elFilterDate, elFilterStatus, elFilterEquipe].forEach(el => {
  el.addEventListener("input", render);
  el.addEventListener("change", render);
});

elForm.addEventListener("submit", onSubmit);

elModal.addEventListener("click", (e) => {
  const t = e.target;
  if(t && t.getAttribute && t.getAttribute("data-close")){
    closeModal();
  }
});

document.addEventListener("keydown", (e) => {
  if(e.key === "Escape" && !elModal.classList.contains("hidden")){
    closeModal();
  }
});

elObs.value = loadObs();
elObs.addEventListener("input", () => saveObs(elObs.value));

setToday();
render();