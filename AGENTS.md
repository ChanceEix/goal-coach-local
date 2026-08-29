# 目标管理工作台 · 项目说明书

> 给 AI 的项目说明。切到这个工作区后，先读本文件和 data/goals.json 接上上下文；要改功能/视觉前，**先读 docs/ 里对应文档（01→14），改完代码同步改文档**，保持文档与代码一致。

## 这是什么
「人生罗盘」（原「目标罗盘」「目标陪练」）—— 基于 OKR + 使命/愿景/价值观的个人目标管理本地网站。
三层结构：**使命 → 愿景 → 价值观 → 目标O → 关键结果KR → 任务**，可可视化填写进度，AI 每周复盘读同一份数据。

## 架构分层（根 → 枝叶）
- **根**：使命(mission，为什么存在) / 愿景(vision，未来成为什么样/长期支柱) / 价值观(values，怎么做/底线)，存于 `data/goals.json` 的 `vvm` 区块，由 `mission.html` 编辑。**注意：`vvm.mission` 存「使命·为什么存在」、`vvm.vision` 存「愿景·那句话（未来成为什么样）」、`vvm.missions` 为「愿景支柱」（目标挂靠到这里），目标承接愿景而非使命。**
- **枝叶**：目标 O → KR → 任务（goals 数组，parentId 串联），由 `goals.html` 编辑。
- **检视**：复盘页(review.html) 用 **GRAI 结论式**（目标G→结果R→分析A→洞察I），自动对比实际进度与时间预期，发现落后、导出结论。

## 目录结构
```
目标陪练OKR工作台/
├── server.js              # Express 后端：goals CRUD + vvm 读写 + 历史记录 + 静态托管
├── package.json           # 依赖 + start 脚本
├── data/
│   ├── goals.json         # 主数据：{ vvm: {...}, goals: [] }（三方共享）
│   └── history.json       # 变更历史（差分格式，新记录在前，后端自动追加）
├── public/                # 前端静态资源（express.static 托管根）
│   ├── index.html         # 总览（愿景横幅 + KPI + 图表 + P0聚焦卡片）
│   ├── mission.html       # 坐标页（编辑使命/愿景/价值观 + 愿景支柱 + 目标挂靠）
│   ├── goals.html         # 目标管理（O→KR→任务树 + 速览表格 + 归档）
│   ├── review.html        # 复盘（GRAI 结论式）
│   ├── stats.html         # 数据统计
│   ├── history.html       # 历史记录（按对象分层回溯 + CSV 导出）
│   ├── common.js          # 侧边栏/API助手/环形进度/弹窗/toast
│   ├── app.css            # 全局暖米色主题 + 侧边栏 + 组件样式
│   └── vendor/            # 本地 echarts.min.js（离线可用）
├── docs/                  # 完整规范文档集（改代码前先读 01→14）
├── start.bat              # 双击启动（带窗口）
├── .gitignore             # 排除 node_modules / 真实数据 / .workbuddy 等
├── README.md              # 开源说明（功能/技术栈/启动/数据模型/API）
└── LICENSE                # MIT 开源协议
```

## 运行方式
- 端口：**3211**（`http://localhost:3211`）
- 启动：双击 `start.bat`，或 `C:\Users\xieqiang\.workbuddy\binaries\node\versions\22.22.2\node.exe server.js`
- 数据文件：`data/goals.json`（含 `vvm` 区块）

## API（Express）
- `GET /api/goals` 查全部 / `POST /api/goals` 新增
- `PUT /api/goals/:id` 增量更新 / `DELETE /api/goals/:id` 删除（连带子孙）
- `GET /api/vvm` 读使命/愿景/价值观 / `PUT /api/vvm` 整体覆盖写入
- `GET /api/history` 读历史变更记录 / `GET /api/health` 健康检查
- 字段白名单：`name,level,parentId,status,progress,priority,deadline,hours,note,obstacle,next,missionId`

## 历史记录功能（2026-08-25 新增）
- 数据文件：`data/history.json`（数组，新记录在最前，每条带 `ts` 时间戳）。
- 后端：`appendHistory(entry)` 统一追加；`GET /api/history` 读取。
- 记录范围（全量）：坐标（使命/愿景/支柱/价值观）、目标（名称/状态/进度/优先级/期限/时长/复盘 note/obstacle/next/挂靠 missionId）。`type=vvm`/`goal`，`action=update`/`create`/`delete`。
- 记录是「差分」格式（`diffs[]`，含 `field/label/from/to`），可从 2026-08-25 起回溯；此前的修改无法补记。
- 页面：`public/history.html`，PAGE_KEY=`history`，侧边栏「工作台」组新增「📜 历史」。

## 数据模型
- **层级** `level`：`目标O` / `关键结果KR` / `任务`
- **上级串联** `parentId`：目标O 为 `""`；KR 指目标O；任务 指 KR
- **状态** `status`：`进行中` / `已完成` / `暂停` / `已放弃`
- **优先级** `priority`：`P0`最重要 / `P1`重要 / `P2`一般 / `""`无
- **完成度** `progress`：0-100
- **期限** `deadline`：目标总期限 / 任务截止日
- **本周投入** `hours`：手动估算
- **挂靠愿景支柱** `missionId`：目标O 归属到某条愿景支柱（vvm.missions[].id）
- **愿景支柱图标** `vvm.missions[].icon`：每条支柱可选配 emoji 图标（默认 `🧱`），坐标页编辑支柱时可从 `PILLAR_ICONS` 选择，全站展示处（总览/目标/复盘/历史/弹窗下拉）跟随 `m.icon`。图标统一走「emoji + 彩色圆角衬底」，**不要单独自绘 SVG**。
- **复盘字段**：`note`/`obstacle`/`next`（进度记录/当前障碍/下一步行动）

## 视觉规范（用户硬偏好，勿改回）
- **Claude 暖米色系**：背景 `#f0ede6`、卡片 `#fbfaf6`、正文暖深棕 `#35312b`、强调陶土橙 `#d97757`、暖灰分隔线 `#e1ded2`。不用纯黑/纯白。
- **优先级色带**：P0 陶土红 `#c4553e` / P1 琥珀 `#b97f2e` / P2 灰 `#8f8a7e`；卡片左侧竖色带 + 名称旁大徽章。
- **排序规则**：`P0 → P1 → P2 → 无`，同优先级内到期近的靠前。
- **归档区**：`已完成/已放弃` 收进底部「🗂 已归档」，默认收起；主列表只留"进行中+暂停"。
- **布局**：页面 max-width；KR 单列堆叠；编辑弹窗复盘字段默认折叠。
- **侧边栏分组**：`定位`（坐标）/ `工作台`（总览/目标管理/复盘/数据统计/历史）。
- **坐标页结构**：顶部 `.coord-hero` 开篇横幅（标题+引导语+导航胶囊）+ 下方 `.coord-flow` 四张纵向卡片（使命/愿景/价值观/目标挂靠），每张卡片 `.cx-head`（图标+标题+提示语）+ `.cx-body`（内联编辑）+ 底部 `.rel-section` 关系图谱。≤900px 回退适配。
- **复盘页工具条**：只有「全部 / 有复盘内容 / P0 优先」三个筛选标签，**无搜索框**（已删除，勿加回）。

## 前端关键函数
- `ring(pct,color,label,size)`：SVG 环形进度。**必须用 size 参数**，禁止 `.replace()` 改尺寸（会致 100% 断裂）。
- 任务打勾 `toggleTask`：已完成/进行中 + 完成度 0/100。
- 导航跳转 `locate`/`scrollCenter`：滚动居中 + 高亮闪烁，支持 `?focus=<id>` 参数。
- 复盘 GRAI：`expectProg()` 算时间预期进度，`deviation()` 算偏差，`buildInsights()` 自动生成结论洞察。

## 相关专家团（goal-coach）
- 位置：`C:\Users\xieqiang\.workbuddy\plugins\marketplaces\my-experts\plugins\goal-coach`
- 技能：`skills/goal-coach/SKILL.md`（已含「多目标动态调度」章节）
- 多目标调度：优先级按紧迫度+重要性；每周只主攻 1 个 P0；重大调度先问用户拍板。
- 复盘：每周日上午全量复盘（所有目标一起），可结合 GRAI 结论式。

## 坑与注意
- **必须以 Node 22（managed 版本）启动**：`C:/Users/xieqiang/.workbuddy/binaries/node/versions/22.22.2/node.exe server.js`。若用系统 Node 或受限环境启动，`fs.writeFileSync` 会 **EPERM**，导致「能读不能写」、前端保存失效（跨页不同步）。
- **保存失效/跨页不同步**：优先查后端落盘。服务能读不能写 = `fs.writeFileSync` EPERM。前端 fetch 未捕获非 2xx，会把 500 当成功。
- **判断文件锁**：独立 node 进程写同文件成功 = 文件没锁，是服务进程自身受限；重启服务通常可解。
- **服务常驻**：必须用后台常驻方式启动（`run_in_background`），`&` + 普通 shell 会被连带退出导致端口消失。
- 端口 **3211** 冲突时，先停掉占用进程再启动（`netstat -ano | findstr :3211` → `taskkill /PID <pid> /F`）。
- 改 server.js（新增/改路由）后**必须重启服务**才生效；`express.static` 读 public 目录无需重启（改 HTML/CSS/JS 即时生效）。
- `start.bat` 不能写中文注释（Windows cmd 用 GBK 读 UTF-8 会乱码）。
- **常量声明顺序**：server.js 里若用 `const HISTORY_FILE` 等，集中放文件顶部或调用前。曾因 `HISTORY_FILE` 定义在 `ensureHistory()` 调用之后导致 `Cannot access...before initialization`。
- **真实数据备份**：真实个人数据存于 `.private-backup/`（goals.real.json / history.real.json，已被 .gitignore 排除，不会上传）；`data/goals.json` 当前为**匿名示例**，如需恢复真实数据，从 `.private-backup/` 复制回 `data/goals.json` 即可。
