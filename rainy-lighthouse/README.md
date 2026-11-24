# 雨夜灯塔：失落的信标

浏览器内实时渲染的 90 秒 3D 交互短片。WebGPU + Three.js + TSL，**可倒带、可接管视角、可现场切换渲染模式**。

> 施工规范见 [CLAUDE.md](./CLAUDE.md)（硬红线、坐标铁律、兼容性红线）。
> 分镜事实源见上级目录的 BEAT_SHEET.md / SHOT_LIST.md / TECH_SPEC.md。

## 快速开始

```bash
npm install
npm run dev              # http://localhost:5173
npm run build && npm run preview   # http://localhost:4173
```

锁定版本：three **0.187.0**、vite **8.3.8**（均为精确版本，无浮动范围）。

## 强制 WebGL2 后端（验证降级不黑屏）

| 方式       | 操作                                                       | 预期                                                      |
| ---------- | ---------------------------------------------------------- | --------------------------------------------------------- |
| URL 参数   | 打开 §http://localhost:4173/?webgl=1§                    | 左下与面板均显示 **WebGL2**，正常出画，控制台无报错 |
| 浏览器开关 | Chrome §chrome://flags/#enable-unsafe-webgpu§ 关闭后刷新 | 同上                                                      |
| 代码       | §new THREE.WebGPURenderer({ forceWebGL: true })§         | 强制走 WebGL2 backend                                     |

WebGPU 不可用时会**自动**回退 WebGL2，不需要手动干预；§?webgl=1§ 只是为了在支持 WebGPU 的机器上也能主动验证降级路径。

## 交互

| 输入         | 行为                                                                       |
| ------------ | -------------------------------------------------------------------------- |
| 滚轮 / W·S  | 带阻尼推进或倒带时间轴（t ∈ [0,1]，对应 0–90 秒 / 13 拍）                |
| 按住拖拽     | 偏移观察角度（偏航 / 俯仰）                                                |
| 松手         | 四元数 slerp 在 0.8 秒内平滑回正                                           |
| 空格         | 播放 / 暂停自动推进                                                        |
| 右上调试面板 | 展开后可一键跳转到 13 拍中任意一拍（立即到位）、切换线框视图、查看当前后端 |

浏览器控制台可直接核对：§__LH__.t§ / §__LH__.beat§ / §__LH__.backend§。

## 目录

```text
rainy-lighthouse/
├── CLAUDE.md              # 施工规范（唯一红线来源）
├── index.html
├── package.json
├── vite.config.js
├── public/models/         # Blender 导出的 .glb（M2 起）
└── src/
    ├── main.js            # 渲染器初始化、主循环、resize、dispose
    ├── config.js          # CONFIG + 13 拍分镜数据 + 轨道划分
    ├── scene/placeholders.js  # 礁石/灯塔/螺旋石阶/海面/菲涅尔透镜 占位体
    ├── scene/beacon.js    # 信标三通道状态机 + 闪白转场
    ├── camera/rail.js     # 双轨样条 + 交互
    └── ui/                # hud.js（左下读数）、panel.js（右上调试面板）
```

## 当前进度

| 里程碑                                                        | 状态                                                 |
| ------------------------------------------------------------- | ---------------------------------------------------- |
| M0 分镜规格                                                   | ✅ BEAT_SHEET v2.0 / SHOT_LIST v1.1 / TECH_SPEC v1.1 |
| **M1 最小闭环**                                         | ✅ 占位体 + 双轨运镜 + 交互 + 调试面板 + WebGL2 降级 |
| M2 Blender 建模 → glb                                        | ⬜ 待做（Blender MCP 已连通，5.3.0）                 |
| M3 运镜精修 + 调试面板完整版                                  | ⬜ 待做                                              |
| M4 着色器（体积光锥 / 湿石 / 雨 / 海浪）+ 闪白转场 + 性能收口 | ⬜ 待做                                              |
| M5 答辩录屏兜底                                               | ⬜ 待做                                              |
