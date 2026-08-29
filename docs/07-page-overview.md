# 07 · 总览页（index.html）详细设计

> 页面角色：首页。看「愿景方向 + 关键指标 + 聚焦最重要的事」。PAGE_KEY = `overview`。

## 1. 引用

```html
<script src="/vendor/echarts.min.js"></script>
<link rel="stylesheet" href="/app.css">
<script>window.PAGE_KEY = 'overview';</script>
<script src="/common.js"></script>
```

## 2. 页面骨架

```html
<div class="layout">
  <aside class="sidebar" id="sidebar"></aside>
  <main class="content">
    <div class="topbar"> 标题「总览」/ 副题「先看清方向，再聚焦今天」+ 操作(＋新目标, ↻) </div>
    <div class="vvm-banner" id="vvmBanner"></div>
    <div class="kpi-row"> 4 个 KPI </div>
    <div class="chart-row"> #chartStatus, #chartHours </div>
    <div class="section-title"> 🎯 本周围绕 P0 聚焦 </div>
    <div class="cards" id="tree"></div>
  </main>
</div>
<div class="modal-mask" id="mask">...弹窗...</div>
```

## 3. 顶部栏

- 标题 h2「总览」，`.sub`「先看清方向，再聚焦今天」。
- `.actions`：`＋ 新目标`（`onclick="openNew('目标O','')"`）+ `↻`（`onclick="load()"`）。

## 4. VVM 横幅 `#vvmBanner`（`renderVVM()`）

- 若 `!(vvm.vision || vvm.mission || (vvm.missions||[]).length)`：
  ```html
  <div class="v-row"><span class="v-ico">🧭</span>
    <div><div class="v-tag">还没设定方向</div>
    <div class="v-sub"><a href="mission.html" ...>点这里</a> 写下你的使命、愿景与价值观，让目标有根。</div></div></div>
  ```
- 否则：`v-tag`「愿景 · 未来成为什么样」 + `v-text` 愿景文本（空则「（还没写愿景）」）+ `m-row` 各支柱 `.m-chip`（`<i></i>` 圆点 + `${m.icon || '🧱'} ${esc(m.title)}`，图标跟随支柱自身 icon）。

## 5. KPI 行（4 项）

| 元素 | 计算 | 显示 |
|---|---|---|
| `#kpiObj`（🎯） | 目标O 总数 | `total` |
| `#kpiDoing`（🚀） | 目标O 中 `进行中` 数量 | `doing` |
| `#kpiAvg`（📈） | **活动目标**（非 已完成/已放弃）的 progress 均值，四舍五入 | `avg%` |
| `#kpiHours`（⏳） | **全部 goals** 的 hours 之和 | `hrs` h |

> 图标衬底：`.kpi-icon c1..c4`（蓝/绿/橙/橙）。

## 6. 图表

### 6.1 `#chartStatus` 状态分布环图
- `names=['进行中','已完成','暂停','已放弃']`，`colors = {进行中:'#5b7fc4', 已完成:'#4f9d5e', 暂停:'#cf9245', 已放弃:'#cd6b58'}`
- 只显示 value>0 的类型。
- ECharts：`tooltip:{trigger:'item'}`; `legend:{bottom:0,textStyle{color:'#8f8a7e'}}`; `series.pie radius:['46%','70%'], center:['50%','44%']`; `label:{color:'#35312b',fontSize:12}`; `labelLine:{lineStyle:{color:'#a09a8c'}}`。

### 6.2 `#chartHours` 本周投入横向条形图
- `grid:{left:8,right:26,top:24,bottom:8,containLabel:true}`; `tooltip:{trigger:'axis'}`
- xAxis value（axisLabel `#8f8a7e`，splitLine `#e1ded2`）；yAxis category（目标名，axisLabel `#35312b`）
- `series.bar`：data 各目标 hours `+o.hours||0`，`barWidth:13`，`itemStyle:{color:'#d97757',borderRadius:[7,7,0,0]}`，`label:{show:true,position:'right',color:'#35312b'}`

## 7. 聚焦列表 `#tree`

- 取目标O，**主列表 = 非归档（进行中+暂停）**，按 `objRank(a)-objRank(b)` 升序。
- 空态：`<div class="empty">暂无进行中的目标，点右上角「＋新目标」开始 🎯</div>`。
- 否则：`mainObjs.map(o => renderCard(o, all.filter(g=>g.parentId===o.id))).join('')`

### 7.1 卡片 `renderCard(o, krs)`
- `p = +o.progress||0`，`pr = o.priority||'无'`
- 环色：`pr==='P0'&&p<100 ? 'var(--p0)' : pr==='P1'&&p<100 ? 'var(--p1)' : pr==='P2'&&p<100 ? 'var(--p2)' : 'var(--blue)'`；`p>=100` 用 `'var(--green)'`
- 结构：
  ```
  .card.{pr}
    .card-head (onclick="locate('<id>')")
      .ring → ring(p, 色, p+'%')
      .card-mid → .card-name (名称 + 优先级徽章) + .card-tags(状态/期限/小时/支柱 pill)
      .chev ▾
    .card-body
      .kr-actions → ＋关键结果 + ✎编辑目标
      .krs → 各 KR（或空态「还没有关键结果，点「＋ 关键结果」拆解 🎯」）
  ```
- 支柱 pill：找 `vvm.missions` 中 `id === o.missionId`，`${m.icon || '🧭'} ${esc(m.title)}`（图标跟随支柱自身 icon，缺省回退 🧭）。无则不显示。状态 pill 用 `esc(o.status)`；期限 deadline `late(o.deadline)?'late':''` 前缀 `🗓 `；小时 `⏱ ${+o.hours||0}h`。

### 7.2 KR `renderKr(kr, idx)`
- `tasks = all.filter(g=>g.parentId===kr.id)`
- `.kr`：`.kr-head`（`.kr-name` 名称+状态 pill；`.kr-btns` `＋`/`✎`/`🗑`）+ `.kr-prog`（进度条+`${p}%`）+ `.tasks`（各任务，空则「暂无任务」）。

### 7.3 任务 `renderTask(t)`
- `done = t.status==='已完成'`；`p = +t.progress||0`
- `.task{done}`：`.dot`（完成显示✓，onclick `toggleTask(id)`）+ `.task-name` + `.t-progress`（`.f` 宽度 `p%`）+ `.t-deadline`（`late` 红色，无显示 `—`）+ `.t-actions`（`✎`/`🗑`）。

## 8. 交互函数

```js
async function toggleTask(id) {
  const g = all.find(x => x.id === id); if (!g) return;
  const done = g.status !== '已完成';
  await fetch(API + '/goals/' + id, { method:'PUT', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ status: done?'已完成':'进行中', progress: done?100:(g.progress||0) }) });
  load();
}
function locate(id) { location.href = 'goals.html?focus=' + id; }
```

## 9. 初始化与事件

- 全局：`let all=[]; let vvm={vision:'',values:[],missions:[]}; let statusChart,hoursChart;`
- `load()`：`[all, vvm] = await Promise.all([loadGoals(), loadVVM()]); render();`，失败则树空态提示「⚠️ 无法连接后端，请运行 node server.js」。
- `render()`：`renderVVM()` + KPI + 主卡片 + `renderCharts(objs)`。
- `window.__appReload = load;`
- `window.addEventListener('resize', ()=>{ statusChart&&statusChart.resize(); hoursChart&&hoursChart.resize(); });`
- 底部 `load()`。
