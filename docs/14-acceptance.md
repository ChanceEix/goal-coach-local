# 14 · 复刻验收清单（Acceptance）

> 面向：按本文档集从零重建后，逐项核对「是否 1:1 还原」的人。可当作 checklist 逐条打勾。

## 0. 前置

- [ ] `npm install` 成功（express + dotenv）。
- [ ] `node server.js` 用 **Node 22** 启动，端口 3211。
- [ ] `http://localhost:3211` 可访问。

## 1. 数据与 API

- [ ] `GET /api/goals` 返回 `{ goals: [], vvm: {...} }`。
- [ ] `POST /api/goals` 无 name → 400 `{error:'缺少 name'}`；有 name → 返回新记录，含 `id/createdAt`。
- [ ] `PUT /api/goals/:id` 只改白名单字段；不存在的 id → 404。
- [ ] `DELETE /api/goals/:id` 级联删除子孙；返回 `{ok, deleted}`。
- [ ] `GET /api/vvm` 返回 `{ mission, vision, values, missions }`。
- [ ] `PUT /api/vvm` 整体覆盖，自动补 id（values/missions）。
- [ ] `GET /api/history` 返回数组，新记录在前，含 `ts`。
- [ ] 每次业务写入后 history.json 追加一条（create/update/delete/vvm）。
- [ ] 字段白名单与枚举完全一致（level/status/priority）。

## 2. 视觉（核对硬性偏好）

- [ ] 无纯黑/纯白底色。
- [ ] 背景暖米色 `#f0ede6`，卡片 `#fbfaf6`，正文 `#35312b`，强调 `#d97757`。
- [ ] 优先级色：P0 陶土红 `#c4553e` / P1 琥珀 `#b97f2e` / P2 暖灰 `#8f8a7e`。
- [ ] 图标全站 eomj + 彩色圆角衬底，emoj 在 flex 容器 `line-height:1`，不居中问题。
- [ ] 环形进度用 `ring()` 带 size 参数，无 `.replace()` 改尺寸（100% 不断裂）。
- [ ] 卡片左侧优先级竖色带 + 名称旁徽章。
- [ ] `≤900px` 响应式布局正常。

## 3. 侧边栏

- [ ] 6 个导航项、分组正确（定位：坐标；工作台：总览/目标拆解/复盘/数据统计/历史）。
- [ ] 当前页 `active` 高亮。
- [ ] 侧边品牌区 `🧭 个人目标管理 / 目标拆解 · 复盘精进`。

## 4. 各页面功能

### 4.1 总览 index.html（PAGE_KEY=overview）
- [ ] VVM 横幅（有则显示愿景+支柱，无则显示引导）。
- [ ] 4 个 KPI 计算正确（总数/进行中/活动均值/总投入）。
- [ ] 2 张图表（状态环图 + 投入条形图）。
- [ ] 「本周围绕 P0」列表：非归档、objRank 排序、卡片含环/KR/任务。
- [ ] 卡片头部点击跳 `goals.html?focus=<id>`。
- [ ] 任务勾选 `toggleTask` 在 已完成/进行中 + 100/原进度 切换。

### 4.2 目标拆解 goals.html（PAGE_KEY=goals）
- [ ] 搜索框过滤名称。
- [ ] tab：全部/进行中/暂停。
- [ ] 图例 P0/P1/P2 + 排序说明。
- [ ] 目标速览表可点表头排序（优先级/名称/状态/完成度/期限/投入，同列翻转、新列升序）。
- [ ] 行点击定位并滚动居中 + `.flash` 闪烁。
- [ ] 目标卡树：展开/收起、KR/任务、增删改。
- [ ] 归档区默认收起，含完成百分比圆 + KR 数 + ✎/🗑。
- [ ] 支持 `?focus=<id>`（归档自动展开归档区；非归档自动展开卡片并定位）。

### 4.3 坐标 mission.html（PAGE_KEY=mission）
- [ ] 开篇横幅（eyebrow + 大标题 + 引导语 + 4 导航胶囊）。
- [ ] 4 张卡片：使命/愿景/价值观/目标挂靠，各自 `cx-ico` 衬底 + `.cx-en` 英文。
- [ ] 使命内联编辑（✎ → 保存/取消）。
- [ ] 价值观：列表、添加、编辑、删除（含序号圆点）。
- [ ] 愿景一句话 + 愿景支柱（支柱列表、编辑、删除、挂靠目标计数）。**支柱编辑态含图标选择器（`PILLAR_ICONS`，`pickPillarIcon` 选中高亮，`m.icon` 默认 `🧱`）**。
- [ ] 支柱图标跟随展示：总览/目标/复盘/历史/弹窗下拉均显示 `m.icon || '🧱'`。
- [ ] 目标挂靠：每个活动目标一个下拉（不挂靠 + 各支柱），保存 `missionId`。
- [ ] 关系图谱（5 节点 + 2 说明卡）。

### 4.4 复盘 review.html（PAGE_KEY=review）
- [ ] 工具条只有 3 个 tab（全部/有复盘内容/P0 优先），**无搜索框**。
- [ ] GRAI 四步卡片自动算「实际 vs 时间预期」，偏差显示绿/红。
- [ ] 偏好计算：`timeRatio` 以 2026-01-01 为起点。
- [ ] 宏观概览「本次发现问题」（落后 >10%）。
- [ ] 落后定位明细（KR/任务表，默认收起）。
- [ ] 自动结论洞察 `buildInsights`（warn/good/info）。
- [ ] 点击内容可 `quickEdit`（写回 note/obstacle/next）。

### 4.5 数据统计 stats.html（PAGE_KEY=stats）
- [ ] 4 个关键数字（总数/均值/总投入/P0 数）。
- [ ] 4 张图表（完成度、优先级环图、投入、状态环图）。
- [ ] 优先级结构条（P0/P1/P2/无）。

### 4.6 历史 history.html（PAGE_KEY=history）
- [ ] 三个 chip 过滤（全部/坐标/目标）+ 关键词搜索 + 计数 + 导出按钮。
- [ ] 分区1：使命/愿景/价值观（不折叠，带语义图标）。
- [ ] 分区2：愿景支柱 → 支柱下各目标O（可折叠）。
- [ ] 目标类只保留「目标O」自身的变更（status/progress/priority/deadline/hours/missionId），不包含 note/obstacle/next。
- [ ] 导出 CSV（BOM + 当前筛选），字段正确转义。

## 5. 通用

- [ ] 每个页面 `<title>` = `个人目标管理`（无后缀）。
- [ ] 每个页面 `window.PAGE_KEY` 正确。
- [ ] 每个页面定义 `load()` 并赋值 `window.__appReload = load`。
- [ ] 每个页面有后端失败兜底提示。
- [ ] 各页之间 API 路径、字段命名、颜色完全一致。
