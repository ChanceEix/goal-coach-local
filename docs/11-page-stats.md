# 11 · 数据统计页（stats.html）详细设计

> 页面角色：可视化统计。完成度、优先级、投入结构分布。PAGE_KEY = `stats`。本页为**纯展示**，无弹窗编辑。

## 1. 引用

```html
<script src="/vendor/echarts.min.js"></script>
<link rel="stylesheet" href="/app.css">
<script>window.PAGE_KEY = 'stats';</script>
<script src="/common.js"></script>
```

## 2. 页面骨架

```html
<div class="layout">
  <aside class="sidebar" id="sidebar"></aside>
  <main class="content">
    <div class="topbar"> 标题「数据统计」/「完成度 · 优先级 · 投入结构分布」+ ↻ </div>
    <div class="kpi-row"> 4 个 stat-big </div>
    <div class="chart-row"> #chartProgress, #chartPrio </div>
    <div class="chart-row"> #chartHours, #chartStatus </div>
    <div class="section-title"> 📊 优先级结构 </div>
    <div class="prio-stack" id="prioStack"></div>
  </main>
</div>
```

## 3. 关键数字（`.kpi stat-big`）

| 元素 | 计算 |
|---|---|
| `#sTotal` | 目标O 总数 |
| `#sAvg`（`.lead` 陶土橙） | **活动目标**（非 已完成/已放弃）progress 均值，四舍五入 |
| `#sHours` | **全部 goals** 的 hours 之和 |
| `#sP0` | 目标O 中 `priority==='P0'` 的数量 |

## 4. 图表

### 4.1 `#chartProgress` 各目标完成度横向条形图
- `grid:{left:8,right:20,top:20,bottom:8,containLabel:true}`; `tooltip:{trigger:'axis'}`
- xAxis value，`max:100`（axisLabel `#8f8a7e`，splitLine `#e1ded2`）
- yAxis category（目标名，axisLabel `#35312b`）
- `series.bar`：`data: objs.map(o=>+o.progress||0)`，`barWidth:13`，`itemStyle:{borderRadius:[7,7,0,0], color:'#d97757'}`，`label:{show:true,position:'right',color:'#35312b'}`

### 4.2 `#chartPrio` 优先级分布环图
- `prioNames=['P0','P1','P2','无']`，`prioCols={'P0':'#c4553e','P1':'#b97f2e','P2':'#8f8a7e','无':'#cfcabd'}`，只显示 value>0
- `series.pie radius:'68%', center:['50%','46%']`；`legend:{bottom:0,textStyle{color:'#8f8a7e'}}`

### 4.3 `#chartHours` 投入结构横向条形图
- 同进度图，`data: objs.map(o=>+o.hours||0)`，色 `#5b7fc4`。

### 4.4 `#chartStatus` 状态分布环图
- `names=['进行中','已完成','暂停','已放弃']`，`colors={进行中:'#5b7fc4',已完成:'#4f9d5e',暂停:'#cf9245',已放弃:'#cd6b58'}`，只显示 value>0
- `series.pie radius:['46%','70%'], center:['50%','44%']`。

## 5. 优先级结构条 `#prioStack`

- `maxV = Math.max(...prioVals, 1)`
- 每个优先级一行 `.prio-row`（`.tag`(色字) + `.track`(`.i` 宽 `pct%` 背景色) + `.count`「N 个目标」）。`pct = Math.round(v/maxV*100)`。

## 6. 初始化

- `window.__appReload = load;`
- `window.addEventListener('resize', ()=>{ 4 个 chart.resize(); });`
- 底部 `load()`。失败兜底：`alert('无法连接后端，请运行 node server.js')`（本页用 alert，非树空态）。
