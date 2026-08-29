# 04 · 数据模型文档

> 面向：需要精确还原「网站存什么数据、字段是什么、枚举值有哪些」的人（后端、数据、复刻评估）。

## 1. 数据文件总览

网站改动数据**全部**持久化在两个 JSON 文件里（存于 `data/`）：

| 文件 | 内容 | 读取 | 写入 |
|---|---|---|---|
| `goals.json` | 主数据：目标/KR/任务 + vvm（使命/愿景/价值观/支柱） | `GET /api/goals` | `POST/PUT/DELETE /api/goals`、`PUT /api/vvm` |
| `history.json` | 历史变更记录（差分格式） | `GET /api/history` | 仅后端自动追加 |

---

## 2. `data/goals.json`

### 2.1 顶层结构

```jsonc
{
  "goals": [ /* 目标、KR、任务 三层的扁平数组 */ ],
  "vvm": {
    "mission": "使命·为什么存在（字符串）",
    "vision":  "愿景·那句话（字符串）",
    "values":  [ { "id": "v1", "text": "价值观内容" } ],
    "missions": [ { "id": "m1", "title": "支柱名", "desc": "支柱描述", "icon": "💪" } ]
  }
}
```

> `goals[]` 是**扁平数组**，不是树。层级关系用 `parentId` 串联，前端自行组树。

### 2.2 `goals[]` 记录完整 Schema

| 字段 | 类型 | 必填 | 说明 | 默认值 |
|---|---|---|---|---|
| `id` | string | 是 | 唯一标识，`g_` 前缀 | 生成 (`genId()`) |
| `name` | string | 是 | 名称 | — |
| `level` | string | 是 | 层级 | `任务` |
| `parentId` | string | 是 | 上级 id | `''` |
| `status` | string | 是 | 状态 | `进行中` |
| `progress` | number | 是 | 完成度 0-100 | `0` |
| `priority` | string | 是 | 优先级 | `''` |
| `deadline` | string | 是 | 期限 `yyyy-MM-dd` | `''` |
| `hours` | number | 是 | 本周投入（h，可小数） | `0` |
| `note` | string | 是 | 进度记录 | `''` |
| `obstacle` | string | 是 | 当前障碍 | `''` |
| `next` | string | 是 | 下一步行动 | `''` |
| `missionId` | string | 是 | 挂靠的愿景支柱 id | `''` |
| `createdAt` | number | 是 | 创建时间戳（ms） | `Date.now()` |

### 2.3 枚举值（不可自造，严格照抄）

**`level` 层级**：`目标O` / `关键结果KR` / `任务`
- `目标O` → `parentId = ''`
- `关键结果KR` → `parentId` 指向某条目标O
- `任务` → `parentId` 指向某条 KR

**`status` 状态**：`进行中` / `已完成` / `暂停` / `已放弃`

**`priority` 优先级**：`P0`(最重要) / `P1`(重要) / `P2`(一般) / `''`(无)

**`level` 与归档的关系**：归档定义 = `status ∈ {已完成, 已放弃}`。只有 `level === '目标O'` 的才进「归档区」。

### 2.4 字段白名单（后端 `PUT` 只允许改这些）

```
name, level, parentId, status, progress, priority,
deadline, hours, note, obstacle, next, missionId
```

### 2.5 ID 生成规则（复刻必须一致）

```js
// 目标/KR/任务
function genId() { return 'g_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
// vvm 的 values / missions
function mkId()  { return 'm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
```

当前数据文件里能看到 `demo_o1` / `demo_c1` / `demo_s1` / `m1` / `v1` 等例子，均符合该规则的可读形式（示例数据）。

---

## 3. `data/vvm` 区块细节

```jsonc
"vvm": {
  "mission":   "我存在，是为了帮每一个普通人看清表象、做出清醒而坚定的选择。",
  "vision":    "成为一个能靠真本事安身立命、身体硬朗、留下经得起时间考验的作品的人。",
  "values": [
    { "id": "v1", "text": "用证据说话，不靠想象" },
    { "id": "v2", "text": "长期主义，拒绝捷径" },
    { "id": "v3", "text": "言行一致，说到做到" }
  ],
  "missions": [
    { "id": "m1", "title": "精进能力", "desc": "持续学用输出，把能力练成可复用的方法", "icon": "💪" },
    { "id": "m2", "title": "守住身体", "desc": "规律作息加运动，让精力长期在线", "icon": "🏃" },
    { "id": "m3", "title": "留下作品", "desc": "沉淀经得起时间检验的成果，长期有人用", "icon": "🎨" }
  ]
}
```

- `mission` / `vision` 是**单个字符串**。
- `values[]` / `missions[]` 是数组，每条都**必须带 id**（便于目标挂靠）。
- `missions[].icon`（可选项，非必须，默认 `🧱`）：该愿景支柱的 emoji 图标，坐标页编辑支柱时可从 `PILLAR_ICONS` 选择，展示处（总览/目标/复盘/历史/弹窗下拉）跟随 `m.icon`。缺省时前端回退 `🧱`。

---

## 4. `data/history.json`

### 4.1 顶层结构

```jsonc
[ /* 数组，新记录在最前（unshift / ts 降序） */ ]
```

每条记录头部统一：`{ ts: <ms时间戳>, type, action, ... }`

### 4.2 目标类记录（`type: 'goal'`）

**`action: 'create'`**（新增目标/KR/任务）
```jsonc
{ "type": "goal", "action": "create", "ts": 1700,
  "target": "目标名", "name": "目标名", "id": "g_...",
  "parentId": "", "isKey": "目标O", "missionId": "m1",
  "created": { "name": "目标名", "level": "目标O", "status": "进行中", "priority": "P0" } }
```

**`action: 'update'`**（更新目标/KR/任务）
```jsonc
{ "type": "goal", "action": "update", "ts": 1700,
  "target": "目标名", "name": "目标名", "id": "g_...",
  "parentId": "", "isKey": "目标O", "missionId": "m1",
  "diffs": [ { "field": "progress", "from": 60, "to": 80 } ] }
```

**`action: 'delete'`**（删除目标，连带子孙）
```jsonc
{ "type": "goal", "action": "delete", "ts": 1700,
  "target": "<被删根id>", "name": "目标名 / KR名", "id": "g_...",
  "isKey": "目标", "deleted": 3 }
```
> `name` = 被删根 + 全部子孙名的 `" / "` 连接串；`deleted` = 被删条数。

**`diffs[].field` 取值**（goal 类）：`name, level, parentId, status, progress, priority, deadline, hours, note, obstacle, next, missionId`（即白名单字段）。

### 4.3 坐标类记录（`type: 'vvm'`, `action: 'update'`）

```jsonc
{ "type": "vvm", "action": "update", "ts": 1700,
  "target": "坐标", "name": "使命/愿景/价值观",
  "diffs": [ { "field": "mission", "label": "使命", "from": "旧", "to": "新" } ] }
```

`diffs[]` 可能含以下四种（`field`/`label`/`from`/`to` 规则）：
- `{ field: 'mission', label: '使命', from, to }` —— 整个使命字符串变化
- `{ field: 'vision',  label: '愿景', from, to }` —— 整个愿景字符串变化
- `{ field: 'pillar',  label: '愿景支柱', pid, from, to }` —— 某条支柱新增/删除/改名/改描述；`from/to` 格式为 `${title}｜${desc||''}`；新增时 `from='（新增）'`，删除时 `to='（已删除）'`
- `{ field: 'values',  label: '价值观', from, to }` —— 价值观全体；`from/to` 为各条 `text` 的 `' / '` 连接串

> 后端 `PUT /api/vvm` 通过对比 `cur`（旧）与 `vvm`（新）来生成这些 diff：使命/愿景字符串不等则记录；支柱逐条查 id 是否存在、内容是否变化；价值观全体前后不等则记录。

### 4.4 `history.json` 只读

历史仅供**浏览与导出**，后端只自动追加（`appendHistory`），不提供增删改历史接口。

---

## 5. 数据一致性规则

- **每次成功写业务数据后**（goals POST/PUT/DELETE、vvm PUT）才追加历史。
- `PUT /api/goals` 仅在**真有字段变化**时追加历史。
- 历史记录 `ts = Date.now()`，用 `unshift` 保证最新在前。
- 初始数据文件（新建时若不存在）：`goals.json = { goals: [], vvm: { vision:'', values:[], missions:[] } }`，`history.json = []`。
