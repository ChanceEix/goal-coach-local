# 05 · 后端 API 契约文档

> 面向：需要精确还原 `server.js` 全部接口行为的人（后端、前端对接、复刻评估）。

## 0. 概览

| 方法 | 路径 | 作用 | 响应 |
|---|---|---|---|
| GET | `/api/goals` | 读取全部 | `{ goals: [], vvm: {} }` |
| POST | `/api/goals` | 新增一条 | 新记录对象 |
| PUT | `/api/goals/:id` | 增量更新 | 更新后记录对象 |
| DELETE | `/api/goals/:id` | 删除一条及全部下级 | `{ ok, deleted }` |
| GET | `/api/health` | 健康检查 | `{ ok: true }` |
| GET | `/api/vvm` | 读使命/愿景/价值观/支柱 | `{ mission, vision, values, missions }` |
| PUT | `/api/vvm` | 整体覆盖写入 | 新 vvm |
| GET | `/api/history` | 读取历史列表 | 数组 |

## 1. 启动与中间件

```js
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3211;

app.use(express.json({ limit: '10mb' }));                                  // JSON 解析，限 10MB
app.use(express.static(path.join(__dirname, 'public')));                   // 托管前端静态资源

ensureData();      // 启动时确保 data/ + goals.json 存在
ensureHistory();   // 启动时确保 history.json 存在
app.listen(PORT, ...);
```

**环境变量**：`PORT` 可覆盖默认端口（默认 3211）。

## 2. 内部辅助函数

```js
function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ goals: [], vvm: { vision: '', values: [], missions: [] } }, null, 2), 'utf8');
  }
}
function readData() { /* 读 goals.json，返回 { goals: obj.goals||[], vvm: obj.vvm||{...} }，异常兜底空 */ }
function writeData(obj) { fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), 'utf8'); }

function ensureHistory() { if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, '[]', 'utf8'); }
function readHistory() { /* 读 history.json，异常返回 [] */ }
function appendHistory(entry) {
  const list = readHistory();
  entry.ts = Date.now();
  list.unshift(entry);                       // 新记录在最前
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(list, null, 2), 'utf8');
}
function genId() { return 'g_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
```

---

## 3. GET `/api/goals`

**作用**：读取全部数据。
**响应**：
```jsonc
{
  "goals": [ /* 扁平数组，见数据模型 */ ],
  "vvm": { "mission": "", "vision": "", "values": [], "missions": [] }
}
```
> 注意：返回的是**扁平数组**，前端按 `parentId` 自己组树。

---

## 4. POST `/api/goals`

**作用**：新增一条（目标O / KR / 任务任意层级）。
**请求体**（均可选，除 `name` 外）：
```jsonc
{
  "name": "目标名",          // 必填
  "level": "目标O",          // 默认 "任务"
  "parentId": "",            // 默认 ""
  "status": "进行中",         // 默认 "进行中"
  "progress": 0,             // 默认 0
  "priority": "",            // 默认 ""
  "deadline": "",            // 默认 ""
  "hours": 0,                // 默认 0
  "note": "", "obstacle": "", "next": "",
  "missionId": ""
}
```
**逻辑**：
- 若 `!item || !item.name` → 响应 400 `{ error: '缺少 name' }`
- 否则：`id = genId()`，逐字段给默认值，`createdAt = Date.now()`
- `data.goals.push(record)` → `writeData(data)`
- 追加历史 `{ type:'goal', action:'create', target: name, name, id, parentId, isKey: level, missionId, created: { name, level, status, priority } }`
- **响应**：新记录对象（201 语义，实际返回 200 + record）

---

## 5. PUT `/api/goals/:id`

**作用**：按 id 增量更新。
**请求体**：任意白名单字段：
```
name, level, parentId, status, progress, priority, deadline,
hours, note, obstacle, next, missionId
```
**逻辑**：
- `readData()` → `findIndex` 按 id；<0 → 404 `{ error: 'not found' }`
- 遍历白名单：仅当 `patch[k] !== undefined && patch[k] !== data.goals[idx][k]` 时赋值，并 `diffs.push({ field:k, from:before[k], to:patch[k] })`
- `writeData(data)`
- **若 `diffs.length > 0`**，追加历史 `{ type:'goal', action:'update', target:name, name, id, parentId, isKey:level, missionId, diffs }`
- **响应**：更新后的记录对象

---

## 6. DELETE `/api/goals/:id`

**作用**：删除一条及**所有下级**（级联）。
**逻辑**：
- `idToDelete = req.params.id`
- 收集节点 + 全部子孙：`toDelete = new Set([idToDelete])`，`collect(pid)` 递归找 `parentId === pid` 的项加入并继续
- `delNames` = 被删项 name 列表；`data.goals = data.goals.filter(g => !toDelete.has(g.id))`
- `writeData(data)`
- 追加历史 `{ type:'goal', action:'delete', target:idToDelete, name: delNames.join(' / '), isKey:'目标', deleted: delNames.length }`
- **响应**：`{ ok: true, deleted: <删除条数> }`

---

## 7. GET `/api/health`

**响应**：`{ ok: true }`

---

## 8. GET `/api/vvm`

**作用**：读取使命/愿景/价值观/支柱。
**响应**：
```jsonc
{
  "mission": "", "vision": "",
  "values": [ { "id": "v1", "text": "..." } ],
  "missions": [ { "id": "m1", "title": "..", "desc": "..", "icon": "💪" } ]
}
```
> 若 `data.vvm` 为空，兜底返回 `{ mission:'', vision:'', values:[], missions:[] }`。

---

## 9. PUT `/api/vvm`

**作用**：**整体覆盖**写入使命/愿景/价值观/支柱（不是增量）。
**请求体**：
```jsonc
{
  "mission": "使命字符串",
  "vision": "愿景字符串",
  "values": [ { "id":"v1","text":".." } ],
  "missions": [ { "id":"m1","title":"..","desc":"..","icon":"💪" } ]
}
```
**逻辑**：
- `cur = data.vvm || {...}`
- `mkId()`：`'m_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6)`
- 构造新的 `vvm`：
  - `mission`：`typeof patch.mission==='string' ? patch.mission : (cur.mission||'')`
  - `vision`：`typeof patch.vision==='string' ? patch.vision : cur.vision`
  - `values`：`Array.isArray(patch.values) ? patch.values.map(v=>({id: v.id||mkId(), text: v.text||''})) : (cur.values||[])`
  - `missions`：`Array.isArray(patch.missions) ? patch.missions.map(m=>({id: m.id||mkId(), title: m.title||'', desc: m.desc||'', icon: m.icon||''})) : (cur.missions||[])`
- `data.vvm = vvm` → `writeData(data)`
- 计算坐标 diffs（见数据模型 4.3 节）：使命/愿景/支柱/价值观的差异
- 若确有 diff → 追加历史 `{ type:'vvm', action:'update', target:'坐标', name:'使命/愿景/价值观', diffs }`
- **响应**：新 vvm

**diffs 计算细节**：
```js
// 支柱：from/to 用 `${title}｜${desc||''}`
// 旧有但新的没有 → to='（已删除）'
// 新的有但旧没有 → from='（新增）'
// 内容变化 → 记前后值
// 价值观：old.join('/'), new.join('/') 不等则记
```

---

## 10. GET `/api/history`

**响应**：`history.json` 数组（最新在前，含 `ts` 时间戳）。

---

## 11. 错误约定汇总

| 场景 | 状态码 | 响应体 |
|---|---|---|
| POST 缺 name | 400 | `{ error: '缺少 name' }` |
| PUT 找不到 id | 404 | `{ error: 'not found' }` |
| 正常 | 200 | 对应数据 |

## 12. 静态资源路由

- `/` → `public/index.html`
- `/goals.html` → 目标拆解
- `/mission.html` → 坐标
- `/review.html` → 复盘
- `/stats.html` → 数据统计
- `/history.html` → 历史
- `/app.css` / `/common.js` / `/vendor/echarts.min.js` → 静态文件
