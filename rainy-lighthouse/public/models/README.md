# 模型目录（M2 起使用）

Blender 导出的 .glb 资产放这里。命名约定：

| 文件 | 内容 | 面数上限 |
|---|---|---|
| rock_platform.glb | 礁石平台（半径 9m，顶面 h=2.5） | 3k |
| lighthouse.glb | 八角石塔（含灯室、顶罩） | 4k |
| spiral_stairs.glb | 48 级螺旋石阶 + 栏杆 | 4k |
| fresnel_lens.glb | 12 层菲涅尔透镜 + 齿轮组 | 6k |

导出铁律见 ../CLAUDE.md §3：Blender Z-up 建模 → 保持导出器默认 +Y Up → 应用全部变换（scale=1.0）→ 贴图 ≤2048px → Draco/Meshopt 压缩。
