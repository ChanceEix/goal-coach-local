# 12 · 历史记录页（history.html）详细设计

> 页面角色：按对象分层回溯所有变更 + 导出 CSV。PAGE_KEY = `history`。本页为**纯展示 + CSV 导出**，有自己的一段内联 `<style>`。无弹窗编辑。

## 1. 引用与内联样式

- `<link rel="stylesheet" href="/app.css">` + `<script>window.PAGE_KEY='history';</script>` + `<script src="/common.js"></script>`。
- `<head>` 内有独立 `<style>`，定义了本页专属类（`.h-toolbar/.h-chip/.h-count/.h-search`、`.sec/.sec-title`、`.fold-*`、`.sig`、`.obj-fold/.pillar-fold`、`.tbl`、`.sub-tag` 等）。

## 2. 页面骨架

```html
<div class="layout">
  <aside class="sidebar" id="sidebar"></aside>
  <main class="content">
    <div class="topbar"> 标题「历史记录」/「每一次修改都留下脚印 · 按对象分层回溯方向与目标的演变」+ ↻ 刷新 </div>
    <div class="h-toolbar">
      <div class="h-filter" id="hFilter"></div>
      <input class="h-search" id="hSearch" placeholder="按关键词搜索…（如：愿景 / 目标名）" oninput="render()">
      <span class="h-count" id="hCount"></span>
      <button class="btn ghost sm" onclick="exportCsv()">⬇ 导出</button>
    </div>
    <div id="tlRoot"></div>
  </main>
</div>
```

## 3. 过滤与搜索

- `FILTERS = [ {k:'all',t:'全部'}, {k:'vvm',t:'坐标'}, {k:'goal',t:'目标'} ]`
- `setFilter(k)`：设 `curFilter` 并重渲染（chip `.on`）。
- 搜索：`kw = #hSearch.value.trim()`；过滤 `e.diffs` 或 `entryText(e)` 小写包含。

## 4. 数据结构解析

- `hist`（来自 `GET /api/history`）、`goals`（来自 `GET /api/goals`）、`missions`（来自 `GET /api/vvm`）。
- `FIELD_LABEL = { name:'名称', level:'层级', status:'状态', progress:'完成度', priority:'优先级', deadline:'期限', hours:'投入时长', note:'进度记录', obstacle:'当前障碍', next:'下一步', missionId:'挂靠支柱', mission:'使命', vision:'愿景', pillar:'愿景支柱', values:'价值观' }`
- `goalById(id)` / `resolveGoal(e)`（先按 id，再按 name）、`pillarName(id)`。

## 5. 表格渲染骨架

- `tblHead()`：`时间 | 操作 | 变更字段 | 最新值`（宽度 130/60/100）。
- `tblBody(rows)`：每行 `.t-time`（`fmtTime(ts)`）、`.t-act.{cls}`（`.up`绿/`.new`蓝/`.del`红）、`.t-k`（字段）、`.t-to`（`escaped(to)`，空显示 `—`）。
- `escaped(v)`：空显示 `<span style="color:#c9c2b4">—</span>`；超 44 字截断加 `…`。

## 6. 语义图标

```js
const ICONS = { mission:'🧭', vision:'🔭', values:'⚖️', pillar:'🧱', goal:'🎯' };
function sigIcon(kind){ return `<span class="sig ${kind}">${ICONS[kind]||''}</span>`; }
```
`.sig` 为 32px 圆角 10 衬底，icon 18px，`line-height:1`（对齐坐标页配色）。
> 支柱（pillar）的默认图标是 `🧱`，但**渲染支柱分组时实际用该支柱自身的 emoji**（`mi.icon || '🧱'`，见分区2），即历史页也跟随坐标页的支柱图标。

## 7. 模型构建 `buildModel(arr)`

把历史记录按对象归组：
- **坐标类**（`type:'vvm'`）：按 `d.field` 归到 `mission` / `vision` / `values` / `pillars[pid]`。
- **目标类**（`type:'goal'`）：**只保留「目标O」自身**的记录（`resolveGoal(e)` 且 `g.level==='目标O'`）。`m.goals[oid].rows`：
  - `create` → `＋ 新增`（`{ts, cls:'new', label:'＋ 新增', fieldLabel:'创建', from:'', to: created.name}`）
  - `delete` → `－ 删除`（`from: e.name, to:''`）
  - `update` → 仅 `GOAL_SELF_FIELDS = ['status','progress','priority','deadline','hours','missionId']`（不含 note/obstacle/next，那是复盘内容）。
  - 每条 `{ts, cls:'up', label:'⟳ 更新', fieldLabel, from, to}`

## 8. 分区渲染 `render()`

### 分区1 · 坐标基础（`.sec`，标题「🧭 坐标基础」，副题「使命 / 愿景 / 价值观」）
- 3 张 `.cardSelf`（使命/愿景/价值观），不折叠：`.obj-head`（sigIcon + name + count）。

### 分区2 · 愿景支柱 · 目标（`.sec`，标题「🎯 愿景支柱 · 目标」）
- 每个支柱一个 `<details class="pillar-fold" open>`：
  - `.summary`：sigIcon(支柱) + `.p-name` + `.fold-meta`（「目标变更 N · 支柱自身 M」+ count + chev）。
  - `.pillar-body`：`block('本支柱变更','', 'pillar', ownRows)` + 各挂靠目标O 的 `block(g.name,'','goal',rows)`。
- 支柱聚合逻辑：`pillarGs = missions.map(...)`，只保留有变更的支柱；`unknownP`（未匹配已知支柱的 pillar 记录）也兜底显示。

### 分区说明
- `block(name, path, kind, rows)`：`<details class="obj-fold"><summary>sigIcon + name + path + count + chev</summary>...表格...</details>`（可折叠）。
- `cardSelf(name,kind,rows)`：不折叠，`.obj-head`。
- 空态：`<div class="empty">还没有历史记录。<br>去「坐标」或「目标拆解」页修改一次，这里就会出现记录。</div>`

## 9. 导出 CSV `exportCsv()`

- 采用 `filtered()` 结果（当前筛选 + 搜索）。
- 表头：`['类型','对象','层级','时间','操作','变更字段','最新值']`。
- 目标类按 action 展开（create/delete/update·diffs），坐标类按每条 diffs 展开。字段含引号/逗号/换行时用双引号包裹转义。
- 生成 `\uFEFF`（BOM）+ CSV 内容，用 `URL.createObjectURL` 触发下载，文件名 `历史记录_<今日>.csv`。
- 无记录 `toast('没有可导出的记录')`；成功后 `toast('已导出 CSV')`。

## 10. 初始化

`window.__appReload = load;`，底部 `load()`。失败兜底：`#tlRoot` 显示 `⚠️ 无法连接后端，请运行 node server.js`。
