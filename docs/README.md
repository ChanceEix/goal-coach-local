# 「人生罗盘」个人目标管理网站 · 文档集导航

> 本目录是一套**面向网站设计开发**的完整规范文档。它不是单一 SPEC，而是按职责拆分的多份文档。
> **任何 AI 工具（或开发者）只需按此文档集顺序阅读，即可 1:1 复刻出功能、视觉、行为完全一致的网站。**
> 今后所有改动：**先改对应文档，再改代码**，保持文档与代码同步。

## 阅读顺序（推荐）

按「了解 → 规划 → 设计 → 开发 → 维护」的流程顺序读：

| 顺序 | 文档 | 角色 | 内容 |
|:--:|---|---|---|
| 1 | [`01-prd.md`](./01-prd.md) | 产品 | 为什么做、给谁用、页面结构、功能清单、核心概念模型 |
| 2 | [`03-architecture.md`](./03-architecture.md) | 架构 | 技术栈、目录、分层、请求流、数据流 |
| 3 | [`05-api.md`](./05-api.md) | 后端 | 全部 REST 接口契约 |
| 4 | [`04-data-model.md`](./04-data-model.md) | 数据 | `goals.json` / `history.json` 完整 schema 与枚举 |
| 5 | [`02-visual-spec.md`](./02-visual-spec.md) | 设计 | 配色、字体、组件 class、图标规范、响应式 |
| 6 | [`06-frontend-common.md`](./06-frontend-common.md) | 前端 | common.js / app.css / 侧边栏 / 公共函数 |
| 7 | `07 ～ 12` 逐页文档 | 前端 | 六个页面逐一设计 |
| 8 | [`13-ops.md`](./13-ops.md) | 运维 | 启动、部署、端口、坑 |
| 9 | [`14-acceptance.md`](./14-acceptance.md) | 验收 | 复刻验证清单 |

## 页面文档（07～12）

| 文档 | 对应文件 | 页面 |
|---|---|---|
| [`07-page-overview.md`](./07-page-overview.md) | `public/index.html` | 总览 |
| [`08-page-goals.md`](./08-page-goals.md) | `public/goals.html` | 目标拆解 |
| [`09-page-mission.md`](./09-page-mission.md) | `public/mission.html` | 坐标（使命/愿景/价值观 + 目标挂靠） |
| [`10-page-review.md`](./10-page-review.md) | `public/review.html` | 复盘（GRAI 结论式） |
| [`11-page-stats.md`](./11-page-stats.md) | `public/stats.html` | 数据统计 |
| [`12-page-history.md`](./12-page-history.md) | `public/history.html` | 历史记录 |

## 快速起跑

```bash
# 1. 安装依赖
npm install          # express + dotenv

# 2. 启动（必须用 Node 22 managed 版本）
"C:/Users/xieqiang/.workbuddy/binaries/node/versions/22.22.2/node.exe" server.js

# 3. 打开
http://localhost:3211
```

## 版本记录

| 版本 | 日期 | 说明 |
|---|---|---|
| v1.0 | 2026-08-25 | 依据当前代码快照，建立整套文档集 |
| v1.1 | 2026-08-27 | 全站排查后同步：补齐 愿景支柱 `icon` 字段（数据模型/API/坐标页/视觉规范/各页面/验收）+ `PILLAR_ICONS` 图标选择器 + 历史记录功能落进 AGENTS.md + 修正 stats 图表清单 |
| v1.2 | 2026-08-29 | 开源筹备后同步：删除 `startup.bat`/`startup.vbs`（启动改为仅 `start.bat`）、移除 AGENTS.md 中已不存在的孤立 PNG 记录、补 `.gitignore`/`.private-backup/` 与匿名示例数据说明 |
