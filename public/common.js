/* =====================================================
   个人目标管理 · 共享脚本（common.js）
   侧边栏渲染 / API 助手 / 环形进度 / 弹窗表单 / toast
   ===================================================== */

const API = '/api';

// 当前激活的侧边链接（每个页面用 PAGE_KEY 标记，默认 'overview'）
const pageKey = (window.PAGE_KEY || 'overview');

/* ---------- 数据加载 ---------- */
async function loadGoals() {
  const d = await (await fetch(API + '/goals')).json();
  return d.goals || [];
}
// 愿景 / 价值观 / 使命
async function loadVVM() {
  try {
    const d = await (await fetch(API + '/vvm')).json();
    return {
      mission: d.mission || '',
      vision: d.vision || '',
      values: d.values || [],
      missions: d.missions || []
    };
  } catch (e) { return { mission: '', vision: '', values: [], missions: [] }; }
}

/* ---------- 侧边栏 ---------- */
// 分两组：「定位」是根（愿景/价值观/使命），「工作台」是枝叶（目标/复盘/统计）
const NAV_GROUPS = [
  { label: '定位', items: [ { key: 'mission', href: 'mission.html', ico: '🧭', label: '坐标' } ] },
  { label: '工作台', items: [
      { key: 'overview', href: 'index.html', ico: '🏠', label: '总览' },
      { key: 'goals',    href: 'goals.html', ico: '🎯', label: '目标拆解' },
      { key: 'review',   href: 'review.html', ico: '📝', label: '复盘' },
      { key: 'stats',    href: 'stats.html', ico: '📊', label: '数据统计' },
      { key: 'history',  href: 'history.html', ico: '📜', label: '历史' },
  ]},
];

function renderSidebar() {
  const el = document.getElementById('sidebar');
  if (!el) return;
  const navHtml = NAV_GROUPS.map(g => `
    <div class="sb-group-label">${g.label}</div>
    ${g.items.map(n => `
      <a class="sb-link ${n.key === pageKey ? 'active' : ''}" href="${n.href}">
        <span class="ico">${n.ico}</span><span>${n.label}</span>
      </a>`).join('')}`).join('');
  el.innerHTML = `
    <div class="sb-brand">
      <div class="sb-logo">🧭</div>
      <div><h1>个人目标管理</h1><div class="sub">目标拆解 · 复盘精进</div></div>
    </div>
    <nav class="sb-nav">${navHtml}</nav>`;
}

/* ---------- 环形进度 ---------- */
// 必须保留 size 参数，禁止用 .replace() 改尺寸（会致 100% 断裂）
function ring(pct, color, label, size) {
  size = size || 66;
  const sw = size >= 60 ? 6 : 5;
  const r = size / 2 - sw / 2 - 1;
  const c = 2 * Math.PI * r;
  const off = c * (1 - (Math.min(Math.max(pct, 0), 100) / 100));
  const cx = size / 2;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cx}" r="${r}" stroke="rgba(83,70,52,.15)" stroke-width="${sw}" fill="none"/>
    <circle cx="${cx}" cy="${cx}" r="${r}" stroke="${color}" stroke-width="${sw}" fill="none"
      stroke-dasharray="${c}" stroke-dashoffset="${off}" stroke-linecap="round"/>
  </svg><div class="val">${label}</div>`;
}

/* ---------- 工具函数 ---------- */
function objRank(o) {
  const w = {P0:0, P1:1, P2:2, '':3}[o.priority] ?? 3;
  const dl = o.deadline ? new Date(o.deadline).getTime() : 9e15;
  return w * 2e13 + dl;
}
function deadlinePill(d) { return d ? d : '未设'; }
function late(d) { if (!d) return false; return (new Date(d + 'T23:59:59')) < new Date(); }
function esc(s) { return (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function toast(m) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast'; t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = m;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}

/* ---------- 新增/编辑通用弹窗（goalManage.js 复用） ---------- */
let editId = null, editParent = '', editLevel = '目标O';
const STATUS_OPTS = ['进行中', '已完成', '暂停', '已放弃'];

// 拉取挂靠支柱候选（目标O层级才用到）；失败返回空数组
async function loadPillars() {
  try { const v = await loadVVM(); return v.missions || []; } catch (e) { return []; }
}
async function openNew(level, parentId) {
  editId = null; editParent = parentId; editLevel = level;
  const missions = editLevel === '目标O' ? await loadPillars() : [];
  showModal('新增' + level, '', '进行中', 0, '', '', 0, '', '', '', '', missions);
}
async function editItem(id, goals) {
  if (!goals || !goals.length) {
    try { goals = await loadGoals(); } catch (e) { return; }
  }
  const g = goals.find(x => x.id === id);
  if (!g) return;
  editId = id; editParent = g.parentId; editLevel = g.level;
  const missions = editLevel === '目标O' ? await loadPillars() : [];
  showModal('编辑' + g.level, g.name, g.status, g.progress, g.priority || '', g.deadline, g.hours, g.note, g.obstacle, g.next, g.missionId || '', missions);
}
function showModal(title, name, status, progress, priority, deadline, hours, note, obstacle, next, missionId, missions) {
  const hint = editLevel === '任务' ? '项截止日' : (editLevel === '目标O' ? '总体期限' : '一般不单设');
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = `
    <div class="field"><label>名称</label><input id="f_name" value="${esc(name)}" placeholder="名称"></div>
    <div class="row">
      <div class="field"><label>状态</label><select id="f_status">${STATUS_OPTS.map(s => `<option>${s}</option>`).join('')}</select></div>
      <div class="field"><label>完成度 %</label><input id="f_prog" type="number" min="0" max="100" value="${progress}"></div>
    </div>
    <div class="row">
      <div class="field"><label>优先级</label><select id="f_prio"><option value="">无</option><option value="P0">P0 最重要</option><option value="P1">P1 重要</option><option value="P2">P2 一般</option></select></div>
      <div class="field"><label>期限</label><input id="f_dl" type="date" value="${esc(deadline)}"><small>${hint}</small></div>
    </div>
    <div class="row">
      <div class="field"><label>本周投入(h)</label><input id="f_hours" type="number" min="0" value="${hours}"></div>
    </div>
    ${editLevel === '目标O' ? `<div class="row">
      <div class="field"><label>挂靠愿景支柱</label>
        <select id="f_mission">
          <option value="">不挂靠</option>
          ${(missions || []).map(m => `<option value="${m.id}" ${String(m.id) === String(missionId || '') ? 'selected' : ''}>${m.icon || '🧱'} ${esc(m.title || '（未命名支柱）')}</option>`).join('')}
        </select>
        <small>把这份努力接入你的坐标（愿景 → 支柱）</small>
      </div>
    </div>` : ''}
    <details class="more"><summary>复盘记录（进度 / 障碍 / 下一步）</summary>
      <div class="inner">
        <div class="field"><label>进度记录</label><textarea id="f_note">${esc(note)}</textarea></div>
        <div class="field"><label>当前障碍</label><textarea id="f_obs">${esc(obstacle)}</textarea></div>
        <div class="field"><label>下一步行动</label><textarea id="f_next">${esc(next)}</textarea></div>
      </div>
    </details>
    <div class="modal-foot"><button class="btn ghost" onclick="closeModal()">取消</button><button class="btn primary" onclick="save()">💾 保存</button></div>`;
  document.getElementById('f_status').value = status;
  document.getElementById('f_prio').value = priority || '';
  document.getElementById('mask').classList.add('show');
  window.__modalOpen = true;
}
function closeModal() {
  document.getElementById('mask').classList.remove('show');
  window.__modalOpen = false;
}
async function save() {
  const name = document.getElementById('f_name').value.trim();
  if (!name) { toast('请填名称'); return; }
  const payload = {
    name,
    status: document.getElementById('f_status').value,
    progress: parseInt(document.getElementById('f_prog').value, 10) || 0,
    priority: document.getElementById('f_prio').value,
    deadline: document.getElementById('f_dl').value,
    hours: parseFloat(document.getElementById('f_hours').value) || 0,
    note: document.getElementById('f_note').value,
    obstacle: document.getElementById('f_obs').value,
    next: document.getElementById('f_next').value
  };
  // 目标O 支持挂靠愿景支柱
  if (editLevel === '目标O' && document.getElementById('f_mission')) {
    payload.missionId = document.getElementById('f_mission').value;
  }
  try {
    if (editId) await fetch(API + '/goals/' + editId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    else await fetch(API + '/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, level: editLevel, parentId: editParent }) });
    closeModal();
    await refreshAfterSave();
    toast('已保存 ✓');
  } catch (e) { alert('保存失败：' + e); }
}
async function delItem(id, goals) {
  if (!confirm('删除该项及其全部下级？')) return;
  await fetch(API + '/goals/' + id, { method: 'DELETE' });
  await refreshAfterSave();
  toast('已删除');
}
// 保存/删除后让各页面自定义刷新（页面覆盖此函数）
async function refreshAfterSave() {
  if (window.__appReload) window.__appReload();
  else location.reload();
}

/* ---------- 初始化 ---------- */
function initCommon() {
  renderSidebar();
}
document.addEventListener('DOMContentLoaded', initCommon);
