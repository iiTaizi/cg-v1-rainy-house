/**
 * 全局配置与分镜数据 —— 本工程的唯一事实源。
 * 时间码 / t 值 / 机位 / 轨道 与 BEAT_SHEET.md v2.0、SHOT_LIST.md v1.1 保持一致。
 *
 * 坐标系：three.js Y-up 世界坐标，单位米；h = 高度（Y 分量）。
 * 相机机位 = 该拍的「到达构图」，即拍 i 的机位在 t = beat_i.tIn 处成立。
 */

export const DURATION = 90;
export const FPS = 60;

export const CONFIG = {
  duration: DURATION,
  fps: FPS,

  // ① 信标本体：故障余光 → 满功率重启（BEAT_SHEET §1.2）
  beacon: {
    faultMin: 0.12,
    faultMax: 0.35,
    faultFlickerHz: 3.1,
    restartFrom: 0.30,
    restartPeak: 1.6,
    restartPeakAt: 0.18,
    restartTo: 1.0,
    rotationSpeed: 6
  },
  // ② 塔身暖窗（常亮，不属于信标）
  warmWindow: { idle: 0.60, lit: 0.75 },
  // ③ 环境基线（冷蓝，给投影仪暗部层次）
  ambient: { night: 0.35, dawn: 0.55 },

  // 闪白转场（BEAT_SHEET §5）：峰值锚定在 B11/B12 边界（71s），与硬切轨道严格同时
  flash: {
    riseStartT: (71 - 0.4) / DURATION,
    peakT: 71 / DURATION,
    fallEndT: (71 + 0.5) / DURATION,
    exposurePeak: 3.0,
    bloomBoost: 2.5,
    clampMax: 3.0
  },

  // 灯光参数（M1 占位体阶段；M3/M4 按调试面板预设覆盖）
  moon: { intensity: 0.55, color: 0x9fb6d8, position: [-30, 40, 20] },
  hemi: { sky: 0x8fb3d9, ground: 0x05070d },
  beaconLight: { color: 0xf59e0b, gain: 6.0, distance: 60 },
  windowLights: { color: 0xffb347, gain: 2.2, distance: 14, heights: [4.2, 6.4, 8.6] },

  // 天气（M4 之前为占位参数）
  rainCount: 8000,
  rainCountB13: 1800,
  fogDensity: 0.02,

  // 交互
  scrollDamping: 0.12,
  scrollStep: 0.012,
  keySpeed: 0.12,
  autoPlaySpeed: 1 / DURATION,
  slerpReturnTime: 0.8,
  cameraDrift: 0.15,
  focusLeadRatio: 0.4,

  // 后期
  bloomStrength: 0.6,
  bloomThreshold: 0.85,
  maxPixelRatio: 2
};

/** 14 个时间边界（秒）→ 13 拍 */
const SEC = [0, 5, 11, 18, 23, 29, 35, 41, 49, 57, 64, 71, 81, 90];
const ACT_OF = [1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4];
const ACT_NAME = {
  1: '第一幕 逼近与登岛',
  2: '第二幕 攀登与仰望',
  3: '第三幕 入室与重启',
  4: '第四幕 破晓与雨歇'
};
const BEAT_NAME = [
  '远景海面 · 孤灯初现',
  '贴海推进 · 确认是座塔',
  '越过浪头 · 登上礁石',
  '湿滑石阶 · 踏上台阶',
  '螺旋盘旋 · 塔身填满画面',
  '贴地微距 · 积水与溅花',
  '抬头 · 灯室在头顶',
  '穿门 · 进入灯室',
  '菲涅尔透镜 · 它还没醒',
  '转向窗 · 光斑在漂',
  '满功率重启 · 透镜爆亮',
  '云隙破晓 · 光柱同向',
  '雨歇 · 拉远收全貌'
];
/** 35mm 等效焦段 */
const LENS = [35, 35, 28, 24, 24, 35, 24, 24, 18, 35, 18, 35, 35];
/** 机位（到达构图）：three.js Y-up，(x, h, z) */
const POS = [
  [0.0, 1.2, 62.0],
  [0.0, 1.4, 44.0],
  [-8.0, 2.6, 22.0],
  [3.9, 3.0, 0.0],
  [2.8, 4.6, 2.8],
  [0.0, 6.2, 3.9],
  [-2.8, 8.6, 2.8],
  [-3.0, 11.6, 0.2],
  [-1.2, 12.0, 1.0],
  [0.9, 12.1, 1.2],
  [0.5, 12.0, 1.1],
  [-26.0, 16.0, 22.0],
  [-32.0, 20.0, 30.0]
];
/** 注视点：(x, h, z) */
const FOCUS = [
  [0.0, 8.5, 0.0],
  [0.0, 8.5, 0.0],
  [0.0, 6.0, 0.0],
  [0.0, 6.0, 0.0],
  [0.0, 7.5, 0.0],
  [0.0, 5.9, 3.0],
  [0.0, 11.5, 0.0],
  [0.0, 12.3, 0.0],
  [0.0, 12.5, 0.0],
  [2.2, 12.3, 0.6],
  [0.0, 12.6, 0.0],
  [0.0, 8.0, 0.0],
  [0.0, 7.0, 0.0]
];

export function timecode(sec) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** 35mm 等效焦段 → 垂直 FOV（度） */
export function fovFromLens(mm) {
  return (2 * Math.atan(24 / (2 * mm)) * 180) / Math.PI;
}

export const BEATS = SEC.slice(0, -1).map((s, i) => ({
  id: `B${i + 1}`,
  index: i,
  act: ACT_OF[i],
  actName: ACT_NAME[ACT_OF[i]],
  name: BEAT_NAME[i],
  secIn: s,
  secOut: SEC[i + 1],
  dur: SEC[i + 1] - s,
  tIn: s / DURATION,
  tOut: SEC[i + 1] / DURATION,
  tc: `${timecode(s)}–${timecode(SEC[i + 1])}`,
  // 跳转时刻：若该拍起点落在闪白峰值区间，则跳到白场结束、构图可见的那一刻
  jumpT: (s / DURATION >= CONFIG.flash.peakT && s / DURATION < CONFIG.flash.fallEndT)
    ? CONFIG.flash.fallEndT
    : s / DURATION,
  lens: LENS[i],
  fov: fovFromLens(LENS[i]),
  pos: POS[i],
  focus: FOCUS[i]
}));

/** 轨道划分：室内连续段 / B11 静态 / 室外收尾段 */
export const RAILS = {
  interior: { beats: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], points: 11 },
  static: { beat: 10 },
  finale: { beats: [11, 12], points: 3 }
};

/** 返回 t 落在哪一拍 */
export function beatAt(t) {
  for (let i = BEATS.length - 1; i >= 0; i--) {
    if (t >= BEATS[i].tIn) return BEATS[i];
  }
  return BEATS[0];
}
