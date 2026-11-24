# 《雨夜灯塔：失落的信标》— 开发流程实验

浏览器内实时渲染的 90 秒 3D 交互短片：WebGPU + three.js + TSL，**可倒带、可接管视角、可现场切换渲染模式**。本仓库包含 M0 分镜规格、M1 最小闭环工程与全部关键帧参考。

## 文档（唯一事实源）

| 文件 | 回答的问题 |
|---|---|
| [BEAT_SHEET.md](BEAT_SHEET.md) | **什么时候发生了什么变化** — 4 幕 13 拍、时间码、信标状态机、验收 A1–A13 |
| [SHOT_LIST.md](SHOT_LIST.md) | **每个镜头怎么拍** — 镜号 / 焦段 / 机位 / 运动 / 帧预算 |
| [TECH_SPEC.md](TECH_SPEC.md) | **怎么建、怎么跑、怎么验收** — 渲染路线、资产管线、T0/T1/T2 分层 |
| [rainy-lighthouse/CLAUDE.md](rainy-lighthouse/CLAUDE.md) | **代码施工硬约束** — 版本锁定、坐标铁律、目录分工、兼容性红线 |
| [CLAUDE.md](CLAUDE.md) | 仓库级规范 — 目录职责、文档链顺序、提交纪律 |

> 三条铁律：时间码是唯一坐标系；先改文档再改代码；一拍一验收。

## 目录

```text
开发流程实验/
├── BEAT_SHEET.md / SHOT_LIST.md / TECH_SPEC.md   # 分镜事实源
├── CLAUDE.md                                     # 仓库级规范
├── keyframe_act1~4.jpg                           # 4 张关键帧（2000×1123）
├── keyframes/                                    # 参考图 + image-request.json
├── rainy-lighthouse/                             # M1 工程（Vite + three.js）
│   └── src/{scene,camera,shaders,ui}/...
└── rainy-lighthouse-M1.zip                       # M1 交付快照
```

## 快速开始

```bash
cd rainy-lighthouse
npm install
npm run dev                        # http://localhost:5173
npm run build && npm run preview   # http://localhost:4173
```

锁定版本：three **0.187.0**、vite **8.3.8**（精确版本，无浮动范围）。

**验证 WebGL2 降级**：打开 `http://localhost:4173/?webgl=1`，左下角后端标识应显示 **WebGL2** 且正常出画。

## 当前进度

| 里程碑 | 状态 |
|---|---|
| M0 分镜规格 | ✅ BEAT_SHEET v2.0 / SHOT_LIST v1.1 / TECH_SPEC v1.1 |
| M1 最小闭环 | ✅ 占位体 + 双轨运镜 + 交互 + 调试面板 + WebGL2 降级 |
| M2 Blender 建模 → glb | ⬜ 待做 |
| M3 运镜精修 + 调试面板完整版 | ⬜ 待做 |
| M4 着色器 + 闪白转场 + 性能收口 | ⬜ 待做 |
| M5 答辩录屏兜底 | ⬜ 待做 |
