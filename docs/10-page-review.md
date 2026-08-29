# 10 · 复盘页（review.html）详细设计

> 页面角色：GRAI 结论式复盘。自动对比「实际进度 vs 时间预期」，发现问题、导出结论、定位落后环节。PAGE_KEY = `review`。
> **工具条只有「全部 / 有复盘内容 / P0 优先」三个 tab，无搜索框（已删除，勿加回）。**

## 1. 引用

```html
<link rel="stylesheet" href="/app.css">
<script>window.PAGE_KEY = 'review';</script>
<script src="/common.js"></script>
```

## 2. 页面骨架

```html
<div class="layout">
  <aside class="sidebar" id="sidebar"></aside>
  <main class="content">
    <div class="topbar"> 标题「复盘」/「GRAI 结论式复盘 · 不只记录，而是发现问题、给出结论」+ 操作(✍️填写复盘, ↻) </div>
    <div class="review-intro"> GRAI 四步说明 + 提示 </div>
    <div class="toolbar"> tabs: 全部 / 有复盘内容 / P0 优先 </div>
    <div class="review-grid" id="tree"></div>
  </main>
</div>
```

## 3. 顶部栏 & 引导

- 标题「复盘」，`.sub`「GRAI 结论式复盘 · 不只记录，而是发现问题、给出结论」。
- `.actions`：`✍️ 填写复盘`（`quickEditFirst()`）+ `↻`（`load()`）。
- `.review-intro`：
  - `h3`：「📐 复盘，用 GRAI 四步看清问题」
  - `p`：「不是流水账，而是对照「当初目标 vs 实际进度」，自动算出差距、给出结论。每张复盘卡按四步展开：」
  - `.grai-steps`：4 个 `.step`（G 目标/R 结果/A 分析/I 洞察），字母徽章由 CSS 上色。
  - 提示小字：「⚡ 点任意内容可直接修改；系统自动对比「实际进度 vs 时间预期」，帮你发现落后、给出结论。」

## 4. 核心算法（复刻关键）

### 4.1 时间预期进度 `expectProg(o)`
```js
function timeRatio(o){
  if (!o.deadline) return null;
  const start = new Date('2026-01-01');          // 简化：以年初为起点
  const end = new Date(o.deadline + 'T23:59:59');
  const now = new Date();
  if (now >= end) return null;
  return Math.min(Math.max((now - start) / (end - start), 0), 1);
}
function expectProg(o){ const r=timeRatio(o); return r==null?null:Math.round(r*100); }
```

### 4.2 偏差 `deviation(o)`
```js
function deviation(o){ const e=expectProg(o); return e==null?null:((+o.progress||0)-e); }
```
> 偏差 = 实际进度 − 时间预期。负数代表落后。

### 4.3 目标筛选 `render()`
- `objs = 目标O 且非(已完成/已放弃)`，按 `objRank(a)-objRank(b)` 排序。
- `filter === '有内容'` → `filtered.filter(o=>o.note||o.obstacle||o.next)`
- `filter === 'P0'` → `filtered.filter(o=>o.priority==='P0')`
- 空态：`<div class="empty review-empty">暂无复盘目标，切换到「目标管理」新增后回来查看 🌱</div>`

## 5. 宏观结论概览 `renderSummary(alerts)`

- `alerts = filtered.map(o=>({o, dev:deviation(o)})).filter(x=>x.dev!=null && x.dev < -10)`（落后超过 10%）。
- 若有：`review-summary` 卡，标题「🚨 本次发现问题」，`.rs-body` 列出前 6 条 `.rs-item`（`.f-dot warn` `!` + 文本 `目标名 · 进度落后 <b>N%</b>，需重点关注`）。

## 6. GRAI 卡片 `renderGRAI(o)`

每项目标一张 `.review-card.{pr}`（`id="review-<id>"`），左侧色带按优先级：

- `.review-head`：`.num`（进度 `p%`）+ `.r-title`（名称 + `.gr-meta`：状态 pill、优先级徽章、支柱 pill、期限 pill（`late` 红色））。支柱 pill 为 `${m.icon || '🧭'} ${esc(m.title)}`（图标跟随支柱自身 icon，缺省回退 🧭）。
- `.grai-metaline`：`.grai-meta` 一排指标：
  - 预期进度（`expect<=p` 绿否则红）
  - 偏差（`dev>=0` 绿否则红，带 `+` 前缀）
  - `KR 已完成数/KR 总数 完成`
  - `⏱ ${hours}h 投入`
  - 若无期限：`未设期限`
- 四步（`graiText`）：
  - **G 目标·当初想达成什么**：`o.note`（空则「（还没写进度记录）」）
  - **R 结果·实际走到哪**：`o.progressText || (p + '%')`
  - **A 分析·为什么出现差距**：`o.obstacle`
  - **I 洞察·下一步怎么改进**：`o.next`
- `detailBlock(o, p)`：落后定位明细。
- `insights`：`buildInsights(...)` 自动结论洞察卡。

### 6.1 `graiText(letter, label, text, id, field)`

- `.grai-step`：`.gs-n ${letter色}`（g橙/r蓝/a橙/i青）+ `.gs-body`（`.gs-title` label + `.gs-text`）。
- 有内容显示 `esc(text)`；空则显示「（点此填写）」并加 `.empty`。点击 `quickEdit(id, field)`。

## 7. 落后定位明细 `detailBlock(o, p)`

- 取目标下 KR（`g.parentId===o.id`）与各 KR 的任务。
- **pendingKr** = KR 中 非`已完成` 且 进度<100；**pendingTasks** = 各 pending Kr 下非完成的任务。
- 若都无 → return ''。
- `.detail-block`（默认 `collapsed` + `id="detail-<id>"`）：
  - `.db-head`（点击 `toggleDetail(this)`）：`.db-sub`「📍 落后在哪个环节」+ `.db-count`「X 个 KR 未完成 · Y 个任务未完成」+ `.db-arrow`。
  - `.db-body`（两个 `.db-group`）：
    - 「🎯 未完成的关键结果」表 `.dg-table`（列：关键结果/进度/状态/截止）
    - 「🧩 未完成的任务」表（列同上，名称前加 `↳`）
- KR 进度徽章：`>=70 ok(绿) / >=30 mid(橙) / else low(红)`；行 `.dg-kr` 带 `.dg-dot`。
- 进度条 `.dg-bar`：`<span style="width:min(max(v,0),100)%">`，行类控制进度条/状态色（low 红 / mid 橙）。
- 超期标记：`⚠️`（`.dg-late-icon`，若 `k.deadline && late(k.deadline)`）。
- 空子表：`<tr class="dg-none"><td colspan="4">✔ 所有 KR 均已达成 / ✔ 暂无未完成任务</td></tr>`。

## 8. 自动结论洞察 `buildInsights(o, p, expect, dev, tooLate)`

按优先级收集 `notes`（`{type, t, b}`）：
- `tooLate`（期限已过且未完成）→ `warn`：“目标「o」已超期，但进度才 p%。需要二选一：要么集中火力赶进度，要么果断调整期限/范围。”
- 否则 `expect!=null && dev < -15` → `warn`：“目前进度 p%，但按时间应该到 expect%。落后了 N%。多是「投入不足」而非「目标太难」——建议下周把投入提上去，或砍掉无关事项。”
- 否则 `expect!=null && dev < -5` → `info`：“进度 p% 略落后预期 expect%（差 N%）。问题不大，但别让它滑下去。”
- `p>=100 && status==='已完成'` → `good`：“已达成 100%。回顾一下：什么做对了？把可复用的方法记下来。”
- 否则 `expect!=null && dev>=0` → `good`：“进度 p% 赶上了/超过了预期（expect%）。保持这个节奏即可。”

输出（若有）：
- 排序 `warn(0)/info(1)/good(2)`，取第一条为 `.insight.{type}` 主卡（`.i-title`：`warn⚠️ 发现问题` / `good✅ 做得好` / `info💡 关注点`，副标「· 结论」；`.i-body` 主文本）。
- 其余为 `.finding-row`（`.f-dot` warn`!`/good`✓`/info`!` + 文本）。

## 9. 内联快速编辑（复用弹窗）

- `FIELD_KEY = { progressText:'note', obstacle:'obstacle', next:'next' }`（`progressText` 实际写回 `note`）。
- `quickEdit(id, key)`：找到记录，`editId/editlevel` 设置，填 `#modalTitle`（中文标签）+ `#modalBody`（一个 textarea `#f_note` + 取消/保存 `saveField(id, realKey)`）。
- `saveField(id, field)`：`PUT /api/goals/:id` body `{ [field]: val }` → 关弹窗 → `load()` → `toast('已保存 ✓')`。
- `quickEditFirst()`：目标O 非归档按 objRank 排序，优先找 `P0 且 !note`，否则 `!note`，否则第一个；找不到 `toast('暂无待复盘的目标')`。

## 10. 初始化

全局：`let all=[]; let vvm={vision:'',values:[],missions:[]}; let filter='全部';`
`window.__appReload = load;`，底部 `load()`。失败兜底：`#tree` 显示 `⚠️ 无法连接后端，请运行 node server.js`。
