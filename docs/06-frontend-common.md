# 06 · 前端公共层文档（common.js）

> 面向：需要 1:1 还原「全局脚本、侧边栏、公共组件」的人（前端）。
> 每个页面都会引用 `<script src="/common.js"></script>`，所以这一层是最基础、必须最先复刻的。

## 1. 文件角色

`public/common.js` 提供：全局常量、API 助手、侧边栏渲染、环形进度、工具函数、增删改统一弹窗、toast、初始化。页面通过 `window.PAGE_KEY`、`window.__appReload` 与它协作。

## 2. 全局常量

```js
const API = '/api';
const pageKey = (window.PAGE_KEY || 'overview');   // 当前激活的侧边链接
let editId = null, editParent = '', editLevel = '目标O';
const STATUS_OPTS = ['进行中', '已完成', '暂停', '已放弃'];
```

## 3. 数据加载助手

```js
async function loadGoals() {
  const d = await (await fetch(API + '/goals')).json();
  return d.goals || [];
}
async function loadVVM() {
  try {
    const d = await (await fetch(API + '/vvm')).json();
    return { mission: d.mission||'', vision: d.vision||'', values: d.values||[], missions: d.missions||[] };
  } catch (e) { return { mission:'', vision:'', values:[], missions:[] }; }
}
```

## 4. 侧边栏

### 4.1 导航分组 `NAV_GROUPS`

```js
const NAV_GROUPS = [
  { label: '定位', items: [ { key:'mission', href:'mission.html', ico:'🧭', label:'坐标' } ] },
  { label: '工作台', items: [
      { key:'overview', href:'index.html',    ico:'🏠', label:'总览' },
      { key:'goals',    href:'goals.html',    ico:'🎯', label:'目标拆解' },
      { key:'review',   href:'review.html',   ico:'📝', label:'复盘' },
      { key:'stats',    href:'stats.html',    ico:'📊', label:'数据统计' },
      { key:'history',  href:'history.html',  ico:'📜', label:'历史' },
  ]},
];
```

### 4.2 渲染 `renderSidebar()`

- 找 `document.getElementById('sidebar')`；没有则 return。
- 插入 `.sb-brand`（`.sb-logo` 🧭 + `<h1>个人目标管理</h1>` + `.sub`「目标拆解 · 复盘精进」）。
- 插入 `.sb-nav`：每个 group 一个 `.sb-group-label` + 若干 `.sb-link`（`.active` 若 `n.key === pageKey`）。

## 5. 环形进度 `ring(pct,color,label,size)`

```js
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
```

> **硬性坑**：必须保留 `size` 参数；**禁止用 `.replace()` 改尺寸**，否则 100% 会断裂。返回值含 SVG + 内联 `.val` 百分比，外层套 `.ring`（CSS 里 `.ring svg{transform:rotate(-90deg)}`，`.ring .val` 绝对居中）。

## 6. 工具函数

```js
function objRank(o) {
  const w = {P0:0, P1:1, P2:2, '':3}[o.priority] ?? 3;
  const dl = o.deadline ? new Date(o.deadline).getTime() : 9e15;
  return w * 2e13 + dl;
}
function deadlinePill(d) { return d ? d : '未设'; }
function late(d) { if (!d) return false; return (new Date(d + 'T23:59:59')) < new Date(); }
function esc(s) { return (s == null ? '' : String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function toast(m) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t); }
  t.textContent = m; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}
```

## 7. 新增/编辑/删除统一弹窗

### 7.1 入口
- `openNew(level, parentId)`：`editId=null; editParent=parentId; editLevel=level; showModal('新增'+level, '', '进行中', 0, '', '', 0, '', '', '')`
- `editItem(id, goals?)`：若没传 goals，先 `loadGoals()`；找记录，`editId=id; editParent=g.parentId; editLevel=g.level; showModal('编辑'+g.level, g.name, g.status, g.progress, g.priority||'', g.deadline, g.hours, g.note, g.obstacle, g.next)`

### 7.2 `showModal(title, name, status, progress, priority, deadline, hours, note, obstacle, next)`
目标：填 `#modalTitle` + `#modalBody。`期限 hint`：
- `editLevel === '任务'` → `'项截止日'`
- `editlevel === '目标O'` → `'总体期限'`
- 否则 → `'一般不单设'`

表单字段（`#modalBody` 内）：
- 名称 `#f_name`
- 状态下拉 `#f_status`（`STATUS_OPTS`）
- 完成度 `#f_prog`（number 0-100）
- 优先级下拉 `#f_prio`（`''`无 / P0 / P1 / P2）
- 期限 `#f_dl`（type=date）+ 小字 hint
- 本周投入 `#f_hours`（number）
- `<details class="more">` 折叠「复盘记录（进度/障碍/下一步）」三段 textarea：`#f_note` / `#f_obs` / `#f_next`
- `.modal-foot`：`取消`按钮(`closeModal`) + `💾 保存`按钮(`save`)
- 打开后 `#f_status.value = status; #f_prio.value = priority || ''; #mask.classList.add('show'); window.__modalOpen = true`

### 7.3 `closeModal()`：去 `.show`，`window.__modalOpen = false`

### 7.4 `save()`
- `name` 必填，空则 `toast('请填名称')` return
- 收集 payload：`name/status/progress/priority/deadline/hours/note/obstacle/next`
- **目标O 额外支持「挂靠愿景支柱」**：弹窗里仅 `editLevel==='目标O'` 时显示 `#f_mission` 下拉（首项「不挂靠」value `''`，其余各支柱，选中项 = 当前 `missionId`；每条 option 文案为 `${m.icon || '🧱'} ${esc(m.title||'（未命名支柱）')}`）。保存时若存在该下拉则 `payload.missionId = #f_mission.value`。
- `editId` 有 → `PUT /api/goals/:editId`；无 → `POST /api/goals`（带 `level: editLevel, parentId: editParent`）
- 成功：`closeModal(); await refreshAfterSave(); toast('已保存 ✓')`

### 7.5 `delItem(id, goals)`
- `confirm('删除该项及其全部下级？')` → `DELETE /api/goals/:id` → `refreshAfterSave()` → `toast('已删除')`

### 7.6 `refreshAfterSave()`
```js
async function refreshAfterSave() {
  if (window.__appReload) window.__appReload();
  else location.reload();
}
```

## 8. 初始化

```js
function initCommon() { renderSidebar(); }
document.addEventListener('DOMContentLoaded', initCommon);
```

> 每页还会在 `<head>` 里先写 `<script>window.PAGE_KEY='xxx';</script>`，并在页面脚本底部定义 `load()` 后赋值 `window.__appReload = load` 再调用 `load()`。

## 9. 页面与公共层的协作汇总

| 页面 | PAGE_KEY | 是否用弹窗 | window.__appReload |
|---|---|---|---|
| index.html | overview | 是 | = load |
| goals.html | goals | 是 | = load |
| mission.html | mission | 是（复用 mask） | = load |
| review.html | review | 是（quickEdit 复用） | = load |
| stats.html | stats | 否 | = load |
| history.html | history | 否 | = load |
