# 09 · 坐标页（mission.html）详细设计

> 页面角色：编辑「使命 / 愿景 / 价值观」+ 愿景支柱 + 目标挂靠 + 关系图谱。这是全站**最复杂**的页面（内联编辑状态机）。PAGE_KEY = `mission`。

## 1. 引用

```html
<link rel="stylesheet" href="/app.css">
<script>window.PAGE_KEY = 'mission';</script>
<script src="/common.js"></script>
```

## 2. 页面骨架

```html
<div class="layout">
  <aside class="sidebar" id="sidebar"></aside>
  <main class="content">
    <div class="topbar"> 标题「使命 · 愿景 · 价值观」+ 副题 + ↻ </div>
    <div class="coord-hero"> 开篇横幅（eyebrow + 大标题 + 引导语 + 4 个导航胶囊） </div>
    <div class="coord-flow" id="vvmGrid">
      <section class="cardx x-vv" id="card-vv"> 使命 </section>
      <section class="cardx x-ms" id="card-ms"> 愿景 </section>
      <section class="cardx x-vl" id="card-vl"> 价值观 </section>
      <section class="cardx x-map" id="card-map"> 目标挂靠 </section>
    </div>
    <div class="rel-section"> 关系图谱 </div>
  </main>
</div>
```

> 徽章图标（emoji + 彩色圆角衬底）已由 CSS `.cx-ico` 给出，头部含 `.cx-en` 英文。markup 直接写死，无需 JS 生成。

## 3. 顶部栏 & 开篇横幅

- 标题「使命 · 愿景 · 价值观」，`.sub`「这是目标的「根」——先想清为什么出发、去向何方，再决定今天做什么」。
- `.actions`：仅 `↻`（`load()`）。
- `.coord-hero`：
  - `.ch-eyebrow`：`🧭 坐标 · 先找到自己的位置`
  - `h2`：`先定坐标，<em>再谈目标</em>`
  - `p`：`使命是根、愿景是远方、价值观是路上的规矩、目标是沿途的里程碑——四层坐标撑起你做的每一件事。`
  - `.ch-nav`：4 个胶囊，锚点 `#card-vv`(🧭使命) / `#card-ms`(🔭愿景) / `#card-vl`(⚖️价值观) / `#card-map`(🎯目标)，各带序号 `<b>01</b>` 等。

## 4. 四张卡片（`.cardx`）静态结构

```html
<section class="cardx x-vv" id="card-vv">
  <header class="cx-head">
    <span class="cx-ico">🧭</span>
    <div class="cx-t"><h3>使命 · <em class="cx-en">Mission</em></h3><span class="cx-sub">我为什么而存在</span></div>
    <div class="cx-hint">回答「为什么出发」：一句长期不变的话，写清你存在的根本理由。</div>
  </header>
  <div class="cx-body" id="body-vv"></div>
</section>
```
（其余三张结构同，仅 id / 类 / emoji / 英文 / 副题 / 提示语不同：愿景 `x-ms 🔭 Vision`、价值观 `x-vl ⚖️ Values`、目标挂靠 `x-map 🎯 Goals`。）

## 5. 编辑状态机

`let editing = {}` 记录当前处于编辑态的对象。可能键：
- `editing.vision`（bool）—— 使命正文编辑态
- `editing.visionText`（bool）—— 愿景一句话编辑态
- `editing.value`（value id）—— 某条价值观编辑态
- `editing.mission`（pillar id）—— 某条愿景支柱编辑态

> 注意 mission.html 内 `editing.vision` 用于「使命」的编辑，`editing.visionText` 用于「愿景一句话」的编辑，别混淆。

## 6. 使命卡 `body-vv`（`renderMissionBody()`）

- **编辑态**（`editing.vision`）：`inline-edit`，textarea `#iv_mission`（预填 `vvm.mission`）+ `.iv-foot`（取消 `cancelVision` / 保存 `saveVision`）。
- **默认态**：`.iv-head`（`.iv-title`「我的使命 · 为什么存在」+ `✎` 按钮 `startVisionEdit`）+ `.inline-view`（`.empty` 若空，空文案「（空）点「✎」写下你的使命」）。

函数：`startVisionEdit()` 设 `editing.vision=true` 重渲染；`cancelVision()` 清掉；`saveVision()` 存 `vvm.mission` → `saveVVM()` → 清编辑态 → 渲染 → `toast('使命已保存 ✓')`。

## 7. 价值观卡 `body-vl`（`renderValuesBody()`）

- 无值：`.inline-view.empty`「还没有价值观，点下方「＋ 添加」开始」+ `.add-mini-row`「＋ 添加价值观」。
- 有值：`.val-list`，每条 `.val-item`（`.val-top`：序号圆 `.v-dot` + `.v-text` + `.val-actions` `✎`/`🗑`）。
- **编辑态**（`editing.value===id`）：`.v-dot` + 内联编辑 `<input id="iv_value_<id>">` + `.iv-foot`（取消/保存）。
- 操作：
  - `addValue()`：`vvm.values = vvm.values.concat([{id:'v_'+Date.now().toString(36), text:''}])` → `saveVVM().then(()=>{ editing.value=newId; render(); })`
  - `startValueEdit(id)` / `cancelValue(id)`（置 `editing.value=null`）
  - `saveValue(id)`：填 `vvm.values` 对应 `text` → `saveVVM()` → 清编辑 → 渲染 → `toast('价值观已保存 ✓')`
  - `delValue(id)`：`confirm('删除这条价值观？')` → `vvm.values = filter(!== id)` → `saveVVM()` → 渲染

## 8. 愿景卡 `body-ms`（`renderVisionBody()`）

分上下两段：

### 8.1 上半：愿景一句话
- 编辑态（`editing.visionText`）：`inline-edit`，`textarea #iv_vision` + 取消/保存。
- 默认态：`.iv-head`（「愿景 · 未来成为什么样」+ `✎` 按钮）+ `.inline-view`（`.empty` 若空）。空文案「（空）点「✎」写下你的愿景」。
- `startVisionTextEdit()` / `cancelVisionText()` / `saveVisionText()`（存 `vvm.vision`，toast「愿景已保存 ✓」）。

### 8.2 下半：愿景支柱（`.pillars-wrap`，标题「🎯 愿景支柱 · 目标挂靠到这些方向」）
- 无支柱：`.inline-view.empty`「还没有愿景支柱，点下方「＋ 添加」开始」+ `.add-mini-row`「＋ 添加愿景支柱」。
- 有支柱：`.mission-list`，每条 `.mission-item`（`.m-top`：`.m-ico` `icon` + `.m-body`（`.m-title` + `.m-desc`）+ `.m-actions`（`count 个目标挂靠于此` + `✎`/`🗑`））。
- 支柱卡 `.m-ico` 显示该支柱的 emoji 图标（`m.icon || '🧱'`，用 `.m-ico` 彩色衬底承载）。
- **编辑态**（`editing.mission===id`）：`.m-ico icon` + 内联编辑（`#iv_mtitle_<id>` input + `#iv_mdesc_<id>` textarea + **图标选择器** + 取消/保存）。
- **图标选择器**：`PILLAR_ICONS` 常量（`['🧱','💪','🏃','🎨','📚','🌱','🏆','💡','🧠','🚀','🛠','⚡','🧭','📈','🎯']`），编辑态里遍历渲染为 `<button class="picon ${i===icon?'on':''}" data-ic="${i}" onclick="pickPillarIcon('${m.id}','${i}',this)">${i}</button>`，选中项加 `.on` 高亮。监听函数 `pickPillarIcon(id, icon, btn)`：把图标暂存到 `vvm.missions` 对应条的 `icon`、并切换 `.on` 高亮（**不立即保存**，随 `saveMission` 一起落盘）。
- 操作：
  - `count` 计算、`addMission()`（`vvm.missions = concat([{id:'m_'+Date.now().toString(36), title:'', desc:'', icon:'🧱'}])` → saveVVM → `editing.mission=newId` 渲染）
  - `startMissionEdit(id)` / `cancelMission(id)` / `saveMission(id)`（存 title/desc，toast「愿景支柱已保存 ✓」）
  - `delMission(id)`：`confirm('删除这条愿景支柱？其下目标将变为「不挂靠」。')` → 过滤 → saveVVM → 渲染

## 9. 目标挂靠卡 `body-map`（`renderMapping()`）

- 取**活动目标**（目标O 且 非 已完成/已放弃）。
- 无目标：`<div class="empty" style="padding:30px 0">还没有进行中的目标 🎯</div>`
- 无支柱：`<div class="empty" style="padding:30px 0">还没有愿景支柱，先在上方创建愿景支柱，再给目标挂靠</div>`
- 否则：`.map-row`（`.map-name` 目标名 + `.map-prio priority` + `.map-select` 下拉）。下拉第一项 `不挂靠`(value `''`)，其余各支柱（选中当前 missionId）。
- `mapMission(goalId, missionId)`：`PUT /api/goals/:goalId` body `{ missionId }` → `toast('已更新挂靠 ✓')` → `load()`。

## 10. 关系图谱（`.rel-section`，静态写死）

- `.rel-head`：`.rel-eyebrow`「🧭 THE BIG PICTURE · 一张图看懂」+ `h3`「从使命到目标，是一条从虚到实的链」+ `p` 说明。
- `.rel-map`：
  - `.rel-flow`：5 个 `.rel-node .n1..n5`（使命→愿景→价值观→目标O→KR·任务），中间 `.rel-arrow` `→`。每个节点含 `.rn-num`、`.rn-ico`（🧭🔭⚖️🎯🧩）、`.rn-lab`、`.rn-desc`。
  - `.rel-note`：2 张 `.rn-card`（🔄 它们如何协作 / ⚖️ 方向冲突时的抉择顺序）。

## 11. 数据加载与保存

```js
let all = [];
let vvm = { mission:'', vision:'', values:[], missions:[] };
async function load(){ [all,vvm]=await Promise.all([loadGoals(),loadVVM()]); editing={}; render(); }
async function saveVVM(){ await fetch(API+'/vvm',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(vvm)}); }
```

## 12. 初始化

`window.__appReload = load;`，底部 `load()`。失败兜底：`#vvmGrid` 显示 `⚠️ 无法连接后端，请运行 node server.js`。
