# 03 · 系统架构文档

> 面向：需要理解「网站如何组织、如何运转」的人（架构、后端、前端开发、复刻评估）。

## 1. 架构概览

这是一个**前后端同源码、同进程、本地部署**的单体 Web 应用。

```
┌───────────────────────────────────────────────┐
│                   浏览器 (前端)                  │
│  index.html │ goals.html │ mission.html          │
│  review.html│ stats.html │ history.html          │
│  common.js  +  app.css  +  echarts.min.js        │
└───────────────┬───────────────────────────────┘
                │  fetch /api/*  (HTTP)
┌───────────────▼───────────────────────────────┐
│              server.js  (Node + Express)         │
│  express.static(public)   &   REST API           │
└───────────────┬───────────────────────────────┘
                │  读写
┌───────────────▼───────────────────────────────┐
│              data/  (本地 JSON 文件)             │
│   goals.json   (主数据)                          │
│   history.json (变更历史)                        │
└───────────────────────────────────────────────┘
```

- **前端**是原生 HTML/CSS/JS（无框架），图表用本地 ECharts。
- **后端**是 Express，同时承担「静态资源托管」和「REST API」两职。
- **数据**是纯 JSON 文件，每次读写都从磁盘读最新值（保证跨页/跨终端一致）。

## 2. 技术栈

| 层 | 技术 |
|---|---|
| 后端 | Node.js + Express `^4.19.2` |
| 配置 | `dotenv` `^16.4.5` |
| 前端 | 原生 HTML + CSS + JavaScript（无框架） |
| 图表 | ECharts（本地 `public/vendor/echarts.min.js`，离线） |
| 数据 | 本地 JSON 文件 |
| 端口 | 3211（`process.env.PORT || 3211`） |

## 3. 目录职责

```
目标陪练OKR工作台/
├── server.js              # Express 后端：goals CRUD + vvm 读写 + 历史记录 + 静态托管
├── package.json           # 依赖 + start 脚本
├── data/
│   ├── goals.json         # 主数据 { vvm:{...}, goals:[...] }
│   └── history.json       # 变更历史（新记录在前）
├── public/                # 前端静态资源（express.static 托管根）
│   ├── *.html             # 六个页面
│   ├── common.js          # 全局共享脚本
│   ├── app.css            # 全局主题样式
│   └── vendor/echarts.min.js
├── start.bat              # 双击启动（带窗口）
├── .gitignore             # 排除 node_modules / 真实数据 / .workbuddy
└── docs/                  # 本文档集
```

## 4. 分层设计

### 4.1 后端分层
- **数据访问层**：`readData()` / `writeData()` / `readHistory()` / `appendHistory()` / `ensureData()` / `ensureHistory()`。统一封装 JSON 文件读写。
- **业务层**：各路由 handler，处理 CRUD、字段白名单、级联删除、历史 diff 计算。
- **路由层**：`/api/goals`、`/api/vvm`、`/api/history`、`/api/health`。

### 4.2 前端分层
- **公共层（common.js）**：侧边栏渲染、API 助手（`loadGoals/loadVVM`）、环形进度 `ring`、工具函数、增删改弹窗、toast。
- **页面层**：每页一个 HTML，内联 `<script>` 实现页面逻辑，通过 `window.__appReload` 提供给公共弹窗保存后刷新。
- **样式层**：`app.css` 全局主题 + 各页在 `<head>` 引用。历史页另有一段内联 `<style>`。

### 4.3 公共层与页面层的契约
- 每页用 `window.PAGE_KEY = 'xxx'` 标记当前侧边激活项。
- 每页定义 `load()`，并赋值 `window.__appReload = load`，供 `save()/delItem()` 保存后调用刷新。
- 公共层 `editItem/main.goals` 等弹窗可交互，保存走统一 `save()`。

## 5. 请求/数据流

### 5.1 读数据（页面渲染）
```
页面 load() → loadGoals() + loadVVM()（Promise.all）
          → fetch GET /api/goals, GET /api/vvm
          → server readData() 读磁盘 → 返回 { goals, vvm }
          → 页面按 parentId 组树 → 渲染
```

### 5.2 新增目标
```
openNew(level,parentId) → showModal(...) → save()
  → fetch POST /api/goals
  → server: 校验 name → 生成 id → push → writeData
  → server: appendHistory(goal/create)
  → 前端 closeModal + refreshAfterSave + toast
```

### 5.3 编辑目标
```
editItem(id, goals) → showModal(回填) → save()
  → fetch PUT /api/goals/:id
  → server: findIndex → 遍历白名单字段，有变化才写 → writeData
  → server: 若确有 diff → appendHistory(goal/update)
```

### 5.4 删除目标（级联）
```
delItem(id) → confirm → fetch DELETE /api/goals/:id
  → server: 收集该 id + 所有子孙（按 parentId 递归）→ 过滤 → writeData
  → server: appendHistory(goal/delete, name=子孙名.join(' / '))
```

### 5.5 坐标整体保存
```
saveVVM() → fetch PUT /api/vvm （body=完整 vvm 对象）
  → server: 给 values/missions 每条补 id → 整体覆盖 → writeData
  → server: 计算 mission/vision/pillar/values 的 diff → appendHistory(vvm/update)
```

## 6. 关键设计决策

1. **单一数据源**：前后端 + 复盘 + AI 都读 `data/goals.json`。
2. **扁平存储、前端组树**：`goals[]` 是扁平数组，靠 `parentId` 串联，前端各自组树。
3. **增量更新 + 字段白名单**：后端 `PUT` 只改白名单字段，天然支持「只改某几个字段」。
4. **级联删除**：删除目标自动连带删除其下 KR/任务。
5. **历史差分记录**：只记录有变化的字段（`diffs: [{field, from, to}]`），供历史页回溯。
6. **可复刻优先于工程化**：无构建步骤、无前端框架、无数据库，纯文件即所得。

## 7. 启动与依赖

```bash
npm install
node server.js        # 端口 3211
```

- `express.static` 指向 `public`，改 HTML/CSS/JS 无需重启。
- 改 `server.js`（新增/改路由）**必须重启**才生效。
