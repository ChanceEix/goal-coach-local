# 02 · 视觉设计规范（Visual Spec）

> 面向：需要 1:1 还原「网站长什么样」的人（前端、UI、复刻评估）。
> ⚠️ 这是**用户最强硬性偏好**，任何改版都必须遵守。**禁止改回纯黑/纯白**。

## 1. 设计语言总纲

- **暖米色系**（Claude 风）：整体温暖、柔和、纸质感，避免生硬的黑白对比。
- **图示化优先**：进度用环形圈 / 进度条 / 胶囊 / 圆点表达，少堆文字。
- **成组、不拉满全宽**：内容收进卡片、封顶，从左到右成组，不横向拉满。
- **信息层级分明**：主标题 > 子项 > 明细，一眼可辨。
- **卡片边界清晰**，目标之间分层明显。

## 2. 色彩系统（CSS `:root` 变量 · 必须照抄）

```css
:root {
  --bg: #f0ede6;          /* 页面背景 · 暖米色 */
  --panel: #fbfaf6;       /* 卡片背景 */
  --panel2: #f0eee7;      /* 次级卡片 / 内嵌块 */
  --line: #e1ded2;        /* 分隔线 / 边框 */
  --text: #35312b;        /* 正文 · 暖深棕 */
  --muted: #6b655a;       /* 次级文字 */
  --muted2: #9b9384;      /* 更弱一级（空态提示） */
  --accent: #d97757;      /* 强调 · 陶土橙 */
  --accent2: #e08f66;
  --blue: #5b7fc4;
  --green: #4f9d5e;
  --red: #cd6b58;
  --orange: #cf9245;
  --teal: #4d9a94;
  --p0: #c4553e;          /* 陶土红 · 最重要 */
  --p1: #b97f2e;          /* 琥珀 · 重要 */
  --p2: #8f8a7e;          /* 暖灰 · 一般 */
  --sidebar: #efece5;
  --sidebar-active: rgba(217,119,87,.13);
  --shadow: 0 2px 5px rgba(80,66,48,.07), 0 10px 30px rgba(80,66,48,.06);
}
```

### 2.1 颜色的语义用途

| 变量 | 语义用途 |
|---|---|
| `--accent` (#d97757) | 主题强调色：主按钮、当前侧边项、循环进度高亮、PR 徽章、图标衬底 |
| `--blue` (#5b7fc4) | 进行中状态、进度条渐变起点、价值观衬底、GRAI 的 R |
| `--green` (#4f9d5e) | 已完成状态、任务完成对勾、进度良好、GRAI 的 I |
| `--red` (#cd6b58) | 已放弃、超期、进度落后警示、GRAI 的 warn |
| `--orange` (#cf9245) | 暂停、P1、期限、GRAI 的 A |
| `--teal` (#4d9a94) | 支柱衬底、进度条渐变终点、GRAI 的 I |
| `--p0/p1/p2` | 优先级竖色带 + 徽章 |

## 3. 优先级配色规则（全局统一，务必一致）

| 优先级 | 颜色变量 | 十六进制 | 视觉呈现 |
|---|---|---|---|
| P0 最重要 | `--p0` | `#c4553e` | 卡片左侧 6px 竖向色带 + 名称旁大徽章 |
| P1 重要 | `--p1` | `#b97f2e` | 同上 |
| P2 一般 | `--p2` | `#8f8a7e` | 同上 |
| 无 | — | — | 无竖色带（`card.无::before` 透明）、无徽章 |

> 竖向色带通过 `.card::before`（绝对定位，宽 6px）实现；其余基于 border-color 区分。
> 目标速览表里用 `tr[data-prio]` + `box-shadow: inset 3px 0 0 <色>` 表现左侧色条。

## 4. 字体与排版

- 字体栈：`-apple-system, "Segoe UI", "Microsoft YaHei", sans-serif`
- 页面背景：`var(--bg)` + 两处柔和径向渐变点缀：
  ```
  radial-gradient(900px 520px at 88% -12%, rgba(217,119,87,.07), transparent),
  radial-gradient(760px 420px at -6% 8%, rgba(217,154,78,.06), transparent)
  ```
- `* { box-sizing: border-box; margin:0; padding:0 }` ，`html { scroll-behavior: smooth }`
- 标题用加粗（`.card-name` 17px/700、`.page-title h2` 23px/800、`.coord-hero h2` 30px/900 等）
- 突出关键数字（KPI 的 `.v` 32px/800、统计 `.n` 46px/800）

## 5. 图标规范（**硬性，禁止单独自绘 SVG 图标**）

全站图标统一走 **「emoji + 彩色圆角衬底」** 这套（与坐标页一致）：

| 概念 | emoji | 衬底色 |
|---|---|---|
| 使命 | 🧭 | `rgba(217,119,87,.16)`（陶土橙） |
| 愿景 | 🔭 | `rgba(79,157,94,.16)`（绿） |
| 价值观 | ⚖️ | `rgba(91,127,196,.16)`（蓝） |
| 支柱 | 🧱 | `rgba(77,154,148,.16)`（青） |
| 目标 | 🎯 | `rgba(216,141,60,.18)`（琥珀） |

> **关键坑**：凡在 flex 容器里放 emoji 图标，**必须加 `line-height:1`**，否则基线偏移导致不居中（历史踩坑：曾致使命指南针偏下）。衬底为 `.sig`（历史页）/ `.cx-ico`（坐标页）等圆角 div。

## 6. 关键组件样式（实现时须 1:1 还原）

### 6.1 布局

| 组件 | 类 | 要点 |
|---|---|---|
| 整体 | `.layout` | `display:flex; min-height:100vh` |
| 侧边栏 | `.sidebar` | 宽 232px；`background:var(--sidebar)`；`border-right:1px solid var(--line)`；`position:sticky; top:0; height:100vh`；`padding:24px 16px 20px`；纵向 `gap:22px` |
| 品牌 | `.sb-brand` | flex，gap 12px；`.sb-logo` 40px 圆角 13 渐变陶土橙；`h1` 16.5px/800；`.sub` 10.5px muted |
| 导航 | `.sb-nav` | 纵向 `gap:4px; flex:1`；`.sb-group-label` 10.5px/700 muted letter-spacing 1px |
| 链接 | `.sb-link` | flex `gap:11px`；`padding:10px 12px`；`border-radius:12px`；`font-size:13.5px/600`；`hover` 淡橙底；`.active` 陶土橙背景+文字；`.ico` 16px 宽 20px |
| 内容 | `.content` | `flex:1; min-width:0; padding:30px 38px 80px; max-width:1240px` |

### 6.2 顶部栏 / 按钮 / KPI / 图表

| 组件 | 类 | 要点 |
|---|---|---|
| 顶栏 | `.topbar` | flex space-between，`margin-bottom:24px` |
| 按钮 | `.btn` | `border-radius:11px; padding:11px 18px; font-size:14px/700; color:#fff`；`.primary` 渐变陶土橙 `linear-gradient(135deg,var(--accent),var(--accent2))`；`.ghost` 白底边框；`.sm` 更小；hover 上浮 2px |
| KPI 行 | `.kpi-row` | `grid-template-columns:repeat(4,1fr); gap:16px` |
| KPI 卡 | `.kpi` | `panel` 底、`border-radius:16px`、`box-shadow`；`.kpi-icon` 44px 圆角 13 彩色衬底；`.v` 32px/800；`.l` muted 12.5px |
| 图表 | `.chart-row` | `grid-template-columns:1fr 1fr`；`.chart-box` panel 底圆角 16；图高：`#chartStatus/#chartHours/#chartProgress/#chartPrio` 210px |

### 6.3 工具条 / 图例 / 速览表

| 组件 | 类 | 要点 |
|---|---|---|
| 工具条 | `.toolbar` | flex `gap:14px; margin-bottom:14px; flex-wrap:wrap` |
| 搜索 | `.search-box` | 相对定位；input 面板底圆角 12，focus 陶土橙描边；`.s-ico` 绝对定位左侧 |
| 标签页 | `.tabs/.tab` | `.tab` 圆角 16 面板底；`.active` 陶土橙白字 |
| 图例 | `.legend` | `.sw` 12px 圆角 3；`.s0/.s1/.s2` 对应 p0/p1/p2；`.sort` 靠右 |
| 速览表 | `.obj-table-wrap` | panel 底圆角 16；`table.obj-table` `min-width:620px`；thead th muted 11.5px/700 cursor 可点；tbody 行 hover 淡橙；`tr[data-prio]` 左色条 |
| 名称/徽章 | `.ot-name` 700；`.ot-prio` 白字小徽章（P0/P1/P2/.None）；`.ot-prog` 进度条+%；`.ot-dl.late` 红色加粗 |

### 6.4 目标卡片 / KR / 任务

| 组件 | 类 | 要点 |
|---|---|---|
| 卡片容器 | `.cards` | 纵向 `gap:18px` |
| 卡片 | `.card` | panel 底圆角 18，`position:relative`，`overflow:hidden`，`scroll-margin-top:84px`；`::before` 左上宽 6px 竖色带；`.P0` 边框+阴影加重 |
| 卡片头 | `.card-head` | flex `gap:20px; padding:20px 24px 20px 28px; cursor:pointer`；hover 淡橙渐变 |
| 环图 | `.ring` | 66px；`svg { transform:rotate(-90deg) }`；`.val` 绝对居中 15px/800 |
| 名称/徽章 | `.card-name` 17px/700；`.pr-badge` 白字圆角 20 大徽章 |
| 标签 | `.card-tags` | `.pill` 圆角 30 小胶囊；状态色（进行中蓝/完成绿/暂停橙/放弃红）；`.pill.deadline.late` 红；`.pill.mission` 青 |
| chevron | `.chev` | 34px 圆按钮，`.card.open` 旋转 180 变橙 |
| 卡片体 | `.card-body` | 默认 `display:none`，`.open` 显示；内 `.kr-actions` |
| KR | `.krs/.kr` | `.kr` panel2 底圆角 14 `padding:16px 20px`；`.kr-head` name+pill+按钮；`.kr-prog` 进度条+%；KR 单列堆叠 |
| 任务 | `.tasks/.task` | `.task` panel 底圆角 10 紧凑行；`.dot` 19px 圆，完成变绿背景；`.task.done` 半透明+删除线；`.t-progress` 60px 小进度条；`.t-deadline.late` 红；`.icon-btn` 无边框 |

### 6.5 归档区

- `.archive-wrap`（`.open` 展开）；`.archive-toggle` 面板底圆角 16 整行可点；`.a-arrow` 旋转 180。
- `.archived-card` panel 底圆角 14 `opacity:.94`；`.arch-head` 显示 `a-dot` 百分比圆、`a-name`、`a-tags`、`a-actions`、`a-chev`。
- `.arch-body` 默认收起，`.archived-card.open` 显示。

### 6.6 复盘组件

- `.review-intro` 渐变横幅，`grai-steps .step i` 四色字母徽章（G 橙/蓝/橙/青）。
- `.review-card` panel 底 `border-left-width:5px`，按优先级左侧色。
- `.review-head .num` 44px 圆角 12 高亮进度数字。
- `.review-summary` 红色调渐变卡，`.rs-item` 红描边，`.f-dot.warn` 红。
- `.grai-step`：横向 `grid-template-columns:34px 1fr`；`.gs-n` 34px 字母徽章（g 橙/r 蓝/a 橙/i 青）；`.gs-body` panel2 圆角 12。
- `.insight`（`.warn` 红 / `.good` 绿 / `.info` 蓝）结论洞察卡。
- `.detail-block`（`.collapsed` 收起）落后定位表，`.dg-dot.low/mid/ok` 红/橙/绿，`.dg-table` 四列（名称/进度/状态/截止）。
- **复盘页工具条：只有「全部 / 有复盘内容 / P0 优先」三个 tab，无搜索框（已删除，勿加回）。**

### 6.7 统计组件

- `.stat-big`（`.lead` 陶土橙）：居中大数字 `.n` 46px/800 + `.t` muted。
- `.prio-stack/.prio-row`：`.tag` 52px 标签、`.track` 22px 圆角条、`.count` 右侧统计。

### 6.8 弹窗

- `.modal-mask`（`.show`）fixed inset 0，暗色遮罩 `rgba(70,60,40,.42)` + `backdrop-filter:blur(4px)`。
- `.modal` panel 底圆角 20，宽 520px（`max-width:92vw`），`max-height:88vh; overflow-y:auto`。
- `.field label` 12px muted；输入框 `background:var(--bg)` 圆角 10，focus 陶土橙描边。
- `.row` 两列 flex。
- `details.more` 折叠复盘三段；`summary` 陶土橙 `::before` "▸" 旋转。
- `.modal-foot` 右对齐按钮。

### 6.9 toast / flash

- `.toast` fixed bottom 居中，绿底白字圆角 30，`.show` 淡入，1.8s 消失。
- `.flash` 动画 `@keyframes flash`：关键帧阴影闪现陶土橙高亮，用于滚动定位后的闪烁提醒。

### 6.10 坐标页专属

- `.coord-hero` 渐变开篇横幅（大标题+引导语+导航胶囊 `.ch-nav`，`::after` 大号🧭水印）。
- `.coord-flow` 纵向卡片流；`.cardx`（`.x-vv` 橙 / `.x-vl` 蓝 / `.x-ms` 绿 / `.x-map` 青）`border-left-width:6px` 圆角 22。
- `.cx-head`（`.cx-ico` 52px 圆角 15 彩色衬底 emoji + `.cx-t`(`.cx-en` 英文大写) + `.cx-hint` 说明）。
- `.cx-body`：`.inline-view`（panel2 内联展示，`.empty` 斜体占位）、`.iv-head/.iv-title`、`.inline-edit` 输入区、`.iv-foot` 按钮行。
- `.vm-btn`（`.edit` 描边 / `.edit.icon` 34px / `.save` 渐变色 / `.cancel` / `.sm` / `.add` 虚线蓝）。
- 价值观：`.val-list/.val-item/.val-top/.v-dot/.v-text(.empty)/.val-actions/.add-mini-row`。
- 愿景：`.vision-view/.pillars-wrap/.pillars-title`，支柱 `.mission-list/.mission-item/.m-top/.m-ico/.m-body/.m-title/.m-desc/.m-actions/.m-count`。**`.m-ico` 承载该支柱的 emoji 图标（`m.icon || '🧱'`，彩色衬底），不是挂靠数量**；编辑态内含 `.picon` 图标选择器（`PILLAR_ICONS`，选中项 `.on` 高亮）。
- 目标挂靠：`.mapping/.map-row/.map-name/.map-prio(.P0/.P1/.P2)/.map-select`。
- 关系图谱：`.rel-section/.rel-head/.rel-eyebrow`，`.rel-flow/.rel-node(.n1..n5)/.rn-num/.rn-ico/.rn-lab/.rn-desc`，`.rel-arrow`，`.rel-note/.rn-card`。

### 6.11 总览愿景横幅

- `.vvm-banner` 渐变卡，`.v-row`（`.v-ico` 🧭 + `.v-tag` 陶土橙小标签 + `.v-text` 15.5px/700 + `.v-sub`）。
- `.m-row/.m-chip`：支柱胶囊（`i` 8px 圆点陶土橙）。

## 7. 响应式断点（`@media (max-width:900px)`）

- `.layout` 纵向；`.sidebar` 宽 100%、高 auto、`position:static`、横向 flex、`overflow-x:auto`、`gap:10px`；`.sb-group-label{display:none}`；`.sb-link` 白底 nowrap。
- `.content` padding `22px 20px 60px`。
- `.kpi-row` 改 2 列；`.chart-row`、`.review-grid` 单列。
- 坐标页：`.coord-hero{padding:26px 24px 24px}`、`.cardx` 收紧；`.mission-item .m-top` 允许换行。
- 历史页内联样式在 `≤900px` 隐藏 `.h-count`。

## 8. 图标 emoji 映射（历史页）

历史页 `.sig` 衬底 32px 圆角 10，icon 18px，`line-height:1`：
```
mission 🧭 / vision 🔭 / values ⚖️ / pillar 🧱 / goal 🎯
```
