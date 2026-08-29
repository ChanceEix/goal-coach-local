# 08 · 目标拆解页（goals.html）详细设计

> 页面角色：核心管理页。目标 → KR → 任务树 + 可排序速览表 + 归档区 + 搜索/筛选。PAGE_KEY = `goals`。

## 1. 引用

```html
<link rel="stylesheet" href="/app.css">
<script>window.PAGE_KEY = 'goals';</script>
<script src="/common.js"></script>
```

## 2. 页面骨架

```html
<div class="layout">
  <aside class="sidebar" id="sidebar"></aside>
  <main class="content">
    <div class="topbar"> 标题「目标管理」/「目标 → 关键结果 → 任务 · 展开查看拆解」+ 操作(＋新目标, ↻) </div>
    <div class="toolbar"> 搜索框 + tab(全部/进行中/暂停) </div>
    <div class="legend"> P0/P1/P2 图例 + 排序说明 </div>
    <div class="obj-table-wrap"> 目标速览表 </div>
    <div class="cards" id="tree"></div>
    <div class="archive-wrap" id="archiveWrap"> 归档区 </div>
  </main>
</div>
```

## 3. 顶部栏 & 工具条

- 标题「目标管理」，`.sub`「目标 → 关键结果 → 任务 · 展开查看拆解」。
- `.actions`：`＋ 新目标`（`openNew('目标O','')`）+ `↻`（`load()`）。
- `.toolbar`：
  - 搜索框 `.search-box`：`🔍` 图标 + `<input id="searchInput" placeholder="搜索目标…" oninput="setSearch(this.value)">`
  - tab：`全部`(默认 active) / `进行中` / `暂停`，`onclick="setFilter('xx')"`
- `.legend`：`P0 最重要 / P1 重要 / P2 一般`（`.s0/.s1/.s2` 色块）+ `.sort`「排序：优先级 → 期限近的在前」。

## 4. 目标速览表

### 4.1 表头（可点击排序）
```html
<th data-sort="priority" onclick="sortBy('priority')">优先级<span class="dir"></span></th>
<th data-sort="name" onclick="sortBy('name')">目标<span class="dir"></span></th>
<th data-sort="status" onclick="sortBy('status')">状态<span class="dir"></span></th>
<th data-sort="progress" onclick="sortBy('progress')">完成度<span class="dir"></span></th>
<th data-sort="deadline" onclick="sortBy('deadline')">期限<span class="dir"></span></th>
<th data-sort="hours" onclick="sortBy('hours')">本周投入<span class="dir"></span></th>
```

### 4.2 行内容 `renderTable(objs)`
- 排序后映射成 `<tr data-prio="..." data-id="..." onclick="locateGoal('id')">`：
  - 优先级徽章 `.ot-prio`（无则 `None`，显示 `—`）
  - `.ot-name` 目标名
  - 状态 `.pill status`
  - 完成度 `.ot-prog`：`.bar>i`（宽度 `p%`，`p>=100` 绿，否则蓝→青渐变）+ `.pct`
  - 期限 `.ot-dl`（`.late` 红加粗，无设「未设」）
  - 本周投入 `.ot-hours` `${+o.hours||0}h`

### 4.3 排序逻辑 `sortObjs`
- 用的排序键权重：
  - `priority`：`{P0:0,P1:1,P2:2,'无':3}`
  - `status`：`{进行中:0,暂停:1,已完成:2,已放弃:3}`
  - `progress`/`hours`：数值
  - `deadline`：字符串（无期用 `'9999'`）
  - `name`：小写字符串
- `sortDir`：1 升序 / -1 降序；同列再点切换，新列重置为升序。

## 5. 目标卡片树 `#tree`

- 与表格共用同一排序结果。
- `getFilteredObjs()`：目标O 且**非归档**；filter=`进行中`/`暂停` 过滤；`search` 按名称小写包含。
- 空态：`search ? '没有匹配的目标' : '暂无进行中的目标，点右上角「＋新目标」开始 🎯'`。
- 卡片支持展开/收起（`toggleCard(id)` 记 `curOpenId`），卡片带 `id="goal-<id>"`，`.open` 控制。
- 卡片内容（`renderCard/renderKr/renderTask`）与总览页一致，按钮用 `editItem('${o.id}', all)` / `delItem('${o.id}', all)`。目标卡片 `.card-tags` 里的支柱 pill 为 `${m.icon || '🧭'} ${esc(m.title)}`（图标跟随支柱自身 icon，缺省回退 🧭；`m` = `vvm.missions` 中 `id===o.missionId` 的那条）。

## 6. 归档区 `.archive-wrap`

- 默认**收起**；`.archive-toggle`（右侧箭头，点击切换 `.open`）。
- `#archiveCount` 显示归档目标O数量。
- `#archiveBody` 渲染归档目标O（`renderArchived`）：
  - `.archived-card`（`id="arch-<id>"`，`.open` 控制展开）
  - `.arch-head`：`.a-dot`（完成百分比圆）+ `.a-name` + `.a-tags`（状态/期限/KR 数）+ `.a-actions`（✎/🗑，`event.stopPropagation()`）+ `.a-chev`
  - `.arch-body`：各 KR（`renderKr`）
- 空态：`<div class="empty" style="padding:30px 0">暂无归档目标</div>`。
- 点击 `.arch-head` → `toggleArchived(id)`。

## 7. 交互函数（本页特有）

```js
let filter='全部', search='', curOpenId=null, sortKey='priority', sortDir=1;
const ARCHIVED = ['已完成','已放弃'];

function setFilter(f){ filter=f; 更新tab active; render(); }
function setSearch(v){ search=v.trim().toLowerCase(); render(); }
function toggleCard(id){ curOpenId = (curOpenId===id)?null:id; render(); }
function toggleArchived(id){ 切换 .archived-card.open，控制 .arch-body display }
function sortBy(key){ 同列翻转 sortDir，新列 sortDir=1; render(); }
function getFilteredObjs(){ ... }
function locateGoal(id){ curOpenId=id; render(); 滚动+闪烁到 #goal-<id> }
```

## 8. `focus` 参数支持（从总览跳入）

- `load()` 读 `?focus=<id>`：
  - 若目标是归档（已完成/已放弃）→ `#archiveWrap.classList.add('open')` 并 `requestAnimationFrame(()=>toggleArchived(focus))`
  - 否则设 `curOpenId = focus`（跳转即展开）
- 渲染后 `requestAnimationFrame(()=>scrollCenter(focus))`。
- `scrollCenter(id)`：找 `#goal-<id>` 或 `#arch-<id>`，`scrollIntoView({behavior:'smooth', block:'center'})` + `.flash` 闪烁 1400ms。

## 9. 初始化

- `window.__appReload = load;`，底部 `load()`。

## 10. 后端失败兜底

`load()` 失败 → `#tree` 显示 `⚠️ 无法连接后端，请运行 node server.js`。
