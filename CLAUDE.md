# CLAUDE.md — 仓库级规范

> 代码施工的唯一红线来源是 [rainy-lighthouse/CLAUDE.md](rainy-lighthouse/CLAUDE.md)。本文件只规定**仓库层面**的结构与流程约定；两者冲突时，以更严格者为准。

## 1. 仓库定位

一个项目的完整开发过程仓库：分镜文档（M0）+ 浏览器实时渲染工程（M1 起）。**不是**纯代码仓库，文档与关键帧是同等重要的一等公民。

## 2. 文档链与改动顺序

| 顺序 | 文件 | 职责 |
|---|---|---|
| 1 | BEAT_SHEET.md | 叙事与时间轴，**唯一坐标系**（时间码） |
| 2 | SHOT_LIST.md | 逐镜机位 / 焦段 / 轨道 / 帧预算 |
| 3 | TECH_SPEC.md | 渲染路线、资产管线、T0/T1/T2 验收分层 |
| 4 | rainy-lighthouse/CLAUDE.md | 代码硬约束（版本、坐标、目录、兼容性） |

- **先改文档，再改代码**。提修改意见必须带时间码，不接受「刚才那里」。
- 改 CONFIG 参数不得改动文档中的时间码；确需改时间轴，先改 BEAT_SHEET。
- 关键帧（`keyframe_act*.jpg`、`keyframes/ref_*.jpeg`）是视觉事实源，不得在没有引用图的情况下臆造视觉设定。

## 3. 目录职责

| 路径 | 职责 | 禁止 |
|---|---|---|
| 根目录 `*.md` | 分镜事实源与仓库规范 | 写入代码实现细节 |
| 根目录 `keyframe_act*.jpg` | 4 幕关键帧（艺术基准） | 压缩 / 替换 | 
| `keyframes/` | 参考图与图像生成请求 | 混入最终资产 |
| `rainy-lighthouse/` | 可运行工程（Vite + three） | 在根目录散落 js/html |
| `rainy-lighthouse/public/models/` | Blender 导出的 .glb（运行时资产） | 手工改 glb 二进制 |
| `rainy-lighthouse/dist/` | 构建产物（已 gitignore） | 手工编辑 |
| `rainy-lighthouse-M1.zip` | M1 交付快照 | 当作源码修改 |

## 4. 版本锁定（不可协商）

three **0.187.0** / vite **8.3.8**，`package.json` 中不带 `^` / `~`；禁止擅自升级 three 或混用 `three` 与 `three/webgpu` 两个入口。

## 5. 提交与仓库纪律

- 一个逻辑改动一次提交；信息用 `type(scope): 摘要`（feat / fix / docs / refactor / chore）。
- **禁止提交**：`node_modules/`、`dist/`、密钥与 Token、单文件 > 50MB 的资产（走 Git LFS 或外部存储）。
- 改代码后必须验证：`npm run build`，并在 `?webgl=1` 下确认 WebGL2 降级不黑屏、控制台无报错。
- `push` / `rebase` / `reset --hard` 等远程与高危操作，先征得人工确认。
