/**
 * 信标三通道状态机（BEAT_SHEET §1.2）
 * ① beaconIntensity  故障余光 → 满功率重启
 * ② warmWindow       塔身暖窗常亮
 * ③ ambientBaseline  冷蓝环境基线
 */
import { CONFIG, BEATS } from '../config.js';

const B11 = BEATS[10];

function hashNoise(x) {
  const s = Math.sin(x * 127.1) * 43758.5453;
  return s - Math.floor(s);
}
function smoothNoise(x) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hashNoise(i) * (1 - u) + hashNoise(i + 1) * u;
}

export class BeaconController {
  constructor(lights) {
    this.lensLight = lights.lensLight;
    this.windowLights = lights.windowLights;
    this.hemi = lights.hemi;
    this.state = { beacon: 0, warmWindow: 0, ambient: 0 };
  }

  sample(t, time) {
    const C = CONFIG.beacon;
    let beacon;

    if (t < B11.tIn) {
      const n = smoothNoise(time * C.faultFlickerHz) * 0.6 + smoothNoise(time * C.faultFlickerHz * 2.7) * 0.4;
      beacon = C.faultMin + (C.faultMax - C.faultMin) * n;
    } else if (t <= B11.tOut) {
      const f = (t - B11.tIn) / (B11.dur / CONFIG.duration);
      const p = C.restartPeakAt;
      const from = C.restartFrom, peak = C.restartPeak, to = C.restartTo;
      if (f < p) {
        const k = f / p;
        beacon = from + (peak - from) * (k * k * (3 - 2 * k));
      } else {
        const k = (f - p) / (1 - p);
        beacon = peak + (to - peak) * (k * k * (3 - 2 * k));
      }
    } else {
      beacon = C.restartTo;
    }

    const lit = t >= B11.tIn;
    this.state.beacon = beacon;
    this.state.warmWindow = lit ? CONFIG.warmWindow.lit : CONFIG.warmWindow.idle;
    this.state.ambient = lit ? CONFIG.ambient.dawn : CONFIG.ambient.night;
    return this.state;
  }

  apply(t, time) {
    const s = this.sample(t, time);
    if (this.lensLight) this.lensLight.intensity = s.beacon * CONFIG.beaconLight.gain;
    if (this.windowLights) {
      for (const l of this.windowLights) l.intensity = s.warmWindow * CONFIG.windowLights.gain;
    }
    if (this.hemi) this.hemi.intensity = s.ambient;
    return s;
  }
}

/** 闪白转场因子：0 = 无，1 = 全白；与后端无关，纯数值 */
export function flashFactor(t) {
  const F = CONFIG.flash;
  if (t <= F.riseStartT || t >= F.fallEndT) return 0;
  if (t <= F.peakT) {
    const k = (t - F.riseStartT) / (F.peakT - F.riseStartT);
    return k * k * (3 - 2 * k);
  }
  const k = (F.fallEndT - t) / (F.fallEndT - F.peakT);
  return k * k * (3 - 2 * k);
}

/** 曝光 ramp（WebGL2 降级路径需 clamp） */
export function exposureAt(t) {
  const F = CONFIG.flash;
  let e = 1.0;
  if (t > F.riseStartT && t <= F.peakT) {
    const k = (t - F.riseStartT) / (F.peakT - F.riseStartT);
    e = 1 + (F.exposurePeak - 1) * (k * k * (3 - 2 * k));
  } else if (t > F.peakT && t < F.fallEndT) {
    const k = (F.fallEndT - t) / (F.fallEndT - F.peakT);
    e = 1 + (F.exposurePeak - 1) * (k * k * (3 - 2 * k));
  }
  return Math.min(e, F.clampMax);
}
