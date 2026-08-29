// 个人目标管理 · 本地网站后端
// 提供 goals 的完整 CRUD API + 使命/愿景/价值观（vvm）读写，持久化到 data/goals.json
// 你填页面 = 写这个文件；我复盘 = 读这个文件；三方对同一份数据
require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3211;

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'goals.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const EXAMPLE_FILE = path.join(DATA_DIR, 'goals.example.json');

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 确保数据目录存在，且初始文件为合法 JSON
function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    // 首次运行：仓库自带示例数据时直接沿用，避免新用户打开是一片空白
    if (fs.existsSync(EXAMPLE_FILE)) {
      try {
        const sample = JSON.parse(fs.readFileSync(EXAMPLE_FILE, 'utf8'));
        fs.writeFileSync(DATA_FILE, JSON.stringify(sample, null, 2), 'utf8');
        console.log('   首次运行：已载入示例数据（可在界面里删掉，从零开始）');
        return;
      } catch (e) {
        console.warn('   示例数据读取失败，改为创建空数据：' + e.message);
      }
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify({ goals: [], vvm: { vision: '', values: [], missions: [] } }, null, 2), 'utf8');
  }
}
ensureData();
ensureHistory();

// 读取数据（每次从磁盘读，保证我看到的是你刚填的最新值）
function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const obj = JSON.parse(raw);
    return {
      goals: obj.goals || [],
      vvm: obj.vvm || { vision: '', values: [], missions: [] }
    };
  } catch (e) {
    return { goals: [], vvm: { vision: '', values: [], missions: [] } };
  }
}
function writeData(obj) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

/* ---------- 历史记录（history.json） ---------- */
function ensureHistory() {
  if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, '[]', 'utf8');
}
function readHistory() {
  try { return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); }
  catch (e) { return []; }
}
// 追加一条历史记录（新记录在最前）
function appendHistory(entry) {
  try {
    const list = readHistory();
    entry.ts = Date.now();
    list.unshift(entry);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) { console.error('记录历史失败: ' + e.message); }
}

// 生成简单 id
function genId() {
  return 'g_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ---------- API ---------- */

// 获取全部（树结构：目标O -> KR -> 任务，通过 parentId 串联）
app.get('/api/goals', (req, res) => {
  res.json(readData());
});

// 新增一条（目标O / KR / 任务任一）
app.post('/api/goals', (req, res) => {
  const item = req.body;
  if (!item || !item.name) {
    return res.status(400).json({ error: '缺少 name' });
  }
  const data = readData();
  const record = {
    id: genId(),
    name: item.name,
    level: item.level || '任务',       // 目标O / 关键结果KR / 任务
    parentId: item.parentId || '',     // 指向上级 id；目标O 为 ''
    status: item.status || '进行中',   // 进行中 / 已完成 / 暂停 / 已放弃
    progress: item.progress != null ? item.progress : 0,   // 0-100
    priority: item.priority || '',     // P0/P1/P2/''(无) —— 用于多目标调度
    deadline: item.deadline || '',     // 目标总期限 / 任务截止日 yyyy-MM-dd
    hours: item.hours || 0,            // 本周投入时长
    note: item.note || '',             // 进度记录
    obstacle: item.obstacle || '',     // 当前障碍
    next: item.next || '',             // 下一步行动
    missionId: item.missionId || '',   // 挂靠的愿景支柱 id（目标O 可归属某条愿景支柱）
    createdAt: Date.now()
  };
  data.goals.push(record);
  writeData(data);
  appendHistory({
    type: 'goal',
    action: 'create',
    target: record.name,
    name: record.name,
    id: record.id,
    parentId: record.parentId,
    isKey: record.level,
    missionId: record.missionId,
    created: { name: record.name, level: record.level, status: record.status, priority: record.priority }
  });
  res.json(record);
});

// 更新一条（增量更新：只改传进来的字段）
app.put('/api/goals/:id', (req, res) => {
  const data = readData();
  const idx = data.goals.findIndex(g => g.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'not found' });
  const patch = req.body || {};
  const allowed = ['name','level','parentId','status','progress','priority','deadline','hours','note','obstacle','next','missionId'];
  const before = { ...data.goals[idx] };
  const diffs = [];
  allowed.forEach(k => {
    if (patch[k] !== undefined && patch[k] !== data.goals[idx][k]) {
      diffs.push({ field: k, from: before[k], to: patch[k] });
      data.goals[idx][k] = patch[k];
    }
  });
  writeData(data);
  // 记录变更历史（仅当真有字段变化）
  if (diffs.length) {
    const g = data.goals[idx];
    appendHistory({
      type: 'goal',
      action: 'update',
      target: g.name,
      name: g.name,
      id: g.id,
      parentId: g.parentId,
      isKey: g.level,          // 目标O / 关键结果KR / 任务
      missionId: g.missionId,
      diffs
    });
  }
  res.json(data.goals[idx]);
});

// 删除一条（连带删掉其所有下级）
app.delete('/api/goals/:id', (req, res) => {
  const data = readData();
  const idToDelete = req.params.id;
  // 收集该节点及所有子孙 id
  const toDelete = new Set();
  const collect = (pid) => {
    data.goals.forEach(g => { if (g.parentId === pid) { toDelete.add(g.id); collect(g.id); } });
  };
  toDelete.add(idToDelete);
  collect(idToDelete);
  const delNames = data.goals.filter(g => toDelete.has(g.id)).map(g => g.name);
  data.goals = data.goals.filter(g => !toDelete.has(g.id));
  writeData(data);
  appendHistory({ type: 'goal', action: 'delete', target: idToDelete, name: delNames.join(' / ') || idToDelete, isKey: '目标', deleted: delNames.length });
  res.json({ ok: true, deleted: toDelete.size });
});

// 健康检查
app.get('/api/health', (req, res) => res.json({ ok: true }));

/* ---------- 使命 / 愿景 / 价值观（vvm） ---------- */

// 历史记录
app.get('/api/history', (req, res) => {
  const list = readHistory();
  res.json(list);
});

// 读取
app.get('/api/vvm', (req, res) => {
  const data = readData();
  res.json(data.vvm || { mission: '', vision: '', values: [], missions: [] });
});

// 写入（整体覆盖：使命、愿景、价值观列表）
app.put('/api/vvm', (req, res) => {
  const data = readData();
  const patch = req.body || {};
  const cur = data.vvm || { vision: '', values: [], missions: [] };
  // 每个条目给一个稳定 id，便于目标挂靠
  const mkId = () => 'm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const vvm = {
    mission: typeof patch.mission === 'string' ? patch.mission : (cur.mission || ''),
    vision: typeof patch.vision === 'string' ? patch.vision : cur.vision,
    values: Array.isArray(patch.values) ? patch.values.map(v => ({ id: v.id || mkId(), text: v.text || '' })) : (cur.values || []),
    missions: Array.isArray(patch.missions) ? patch.missions.map(m => ({ id: m.id || mkId(), title: m.title || '', desc: m.desc || '', icon: m.icon || '' })) : (cur.missions || [])
  };
  data.vvm = vvm;
  writeData(data);
  // 记录坐标变更：使命 / 愿景 / 支柱 / 价值观 的差异
  const diffs = [];
  if (String(cur.mission || '') !== String(vvm.mission || '')) {
    diffs.push({ field: 'mission', label: '使命', from: cur.mission || '', to: vvm.mission || '' });
  }
  if (String(cur.vision || '') !== String(vvm.vision || '')) {
    diffs.push({ field: 'vision', label: '愿景', from: cur.vision || '', to: vvm.vision || '' });
  }
  // 支柱：新增/删除/标题或描述变化
  const curM = cur.missions || [], newM = vvm.missions || [];
  const mTitleFrom = (id) => { const m = curM.find(x => x.id === id); return m ? `${m.title}｜${m.desc || ''}` : ''; };
  const mTitleTo = (id) => { const m = newM.find(x => x.id === id); return m ? `${m.title}｜${m.desc || ''}` : ''; };
  curM.forEach(m => {
    const t = newM.find(x => x.id === m.id);
    if (!t) diffs.push({ field: 'pillar', label: '愿景支柱', pid: m.id, from: `${m.title}｜${m.desc || ''}`, to: '（已删除）' });
    else if (mTitleFrom(m.id) !== mTitleTo(m.id)) diffs.push({ field: 'pillar', label: '愿景支柱', pid: m.id, from: mTitleFrom(m.id), to: mTitleTo(m.id) });
  });
  newM.forEach(m => { if (!curM.find(x => x.id === m.id)) diffs.push({ field: 'pillar', label: '愿景支柱', pid: m.id, from: '（新增）', to: `${m.title}｜${m.desc || ''}` }); });
  // 价值观
  const vFrom = (cur.values || []).map(v => v.text).filter(Boolean).join(' / ');
  const vTo = (vvm.values || []).map(v => v.text).filter(Boolean).join(' / ');
  if (vFrom !== vTo) diffs.push({ field: 'values', label: '价值观', from: vFrom, to: vTo });
  if (diffs.length) {
    appendHistory({ type: 'vvm', action: 'update', target: '坐标', name: '使命/愿景/价值观', diffs });
  }
  res.json(vvm);
});

app.listen(PORT, () => {
  console.log('✅ 个人目标管理本地服务已启动: http://localhost:' + PORT);
  console.log('   数据文件: ' + DATA_FILE);
});
