# 13 · 运维与部署文档

> 面向：需要启动、运行、排查问题的开发者或用户。本网站是**纯本地**应用，无线上部署。

## 1. 依赖

- Node.js ≥ 18（**强烈推荐 Node 22**，见下方坑）。
- 依赖：`express`、`dotenv`。

```bash
npm install
```

## 2. 启动方式

### 2.1 开发/手动启动
```bash
node server.js
# 或指定端口
PORT=4000 node server.js
```
访问：`http://localhost:3211`

### 2.2 双击启动（Windows）
- `start.bat`：带窗口，`cd /d %~dp0` 后用 Node 22 路径启动。

### 2.3 后台常驻（重要）
若需要在会话里后台运行服务，**必须用后台常驻方式**（如 `run_in_background`），不要用 `&` + 普通 shell（会被连带退出导致端口消失）。

## 3. 端口

- **默认 3211**。
- 由 `process.env.PORT || 3211` 决定。可通过环境变量 `PORT` 覆盖。
- 若 3211 被占用：先停掉占用进程再启动（`netstat -ano | findstr :3211` 查 PID，`taskkill /PID <pid> /F`）。

## 4. 数据文件（重要，勿误删）

| 文件 | 说明 |
|---|---|
| `data/goals.json` | 主数据。**修改需谨慎**，含全部目标与 vvm。 |
| `data/history.json` | 历史记录，后端自动追加，手动改无意义。 |
| `.private-backup/` | 真实数据本地备份（已被 `.gitignore` 排除，勿删、勿上传）。 |

> `data/` 目录**不是临时缓存**，请勿删除。

## 5. 已知坑（经验，务必遵守）

1. **Node 版本必须是 22（managed）**：`C:/Users/xieqiang/.workbuddy/binaries/node/versions/22.22.2/node.exe`。若用系统 Node 或受限环境启动，`fs.writeFileSync` 会 **EPERM**，导致「能读不能写」，前端保存失效（跨页不同步）。
2. **保存/跨页不同步**：优先查后端落盘。服务能读不能写 = `fs.writeFileSync` EPERM。前端 fetch 若无 `2xx` 检查会把 500 当成功。
3. **判断文件锁**：独立 node 进程写同文件成功 = 文件没锁，是服务进程自身受限；重启服务通常可解。
4. **改 server.js 必须重启服务** 才生效；`express.static` 读 `public` 目录无需重启（改 HTML/CSS/JS 即时生效）。
5. **start.bat 不能写中文注释**：Windows cmd 用 GBK 读 UTF-8 会乱码。
6. **常量声明顺序**：`server.js` 里若用 `const HISTORY_FILE` 等，集中放文件顶部或调用前。曾因 `HISTORY_FILE` 定义在 `ensureHistory()` 之后导致 `Cannot access...before initialization`。
7. **后台常驻**：用后台方式启动，避免进程随 shell 退出。

## 6. 部署说明（无云部署需求）

本应用是本地单机工具，官方无线上部署需求。若确需给他人访问，可把 3211 端口映射/反向代理到公网，但这超出本应用的设计初衷，数据存本地 JSON 也不适合多人在线并发编辑。
