/**
 * 双轨相机：railInterior（B1–B10 连续推进）/ railStatic（B11 固定机位）/ railFinale（B12–B13 室外）。
 * 交互：滚轮与 W/S 阻尼推进、按住拖拽偏移视角、松手后四元数 slerp 回正。
 */
import * as THREE from 'three/webgpu';
import { CONFIG, BEATS, RAILS } from '../config.js';

const IDENTITY = new THREE.Quaternion();
const smooth = (k) => k * k * (3 - 2 * k);
const clamp01 = (v) => Math.max(0, Math.min(1, v));

export class RailRig {
  constructor(camera, dom) {
    this.camera = camera;
    this.dom = dom;

    this.target = 0;
    this.current = 0;
    this.autoPlay = true;
    this.keys = new Set();

    this.pos = new THREE.Vector3();
    this.focus = new THREE.Vector3();
    this.baseQuat = new THREE.Quaternion();
    this.qOffset = new THREE.Quaternion();
    this.returnFrom = new THREE.Quaternion();
    this.returning = false;
    this.returnElapsed = 0;
    this.dragging = false;
    this.yaw = 0;
    this.pitch = 0;

    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._up = new THREE.Vector3(0, 1, 0);

    // 室内轨：B1..B11 共 11 点（B11 仅作 B10 的到达目标，不驱动相机）
    const interiorIdx = RAILS.interior.beats.concat([RAILS.static.beat]);
    this.railInterior = new THREE.CatmullRomCurve3(
      interiorIdx.map(i => new THREE.Vector3(...BEATS[i].pos)), false, 'catmullrom', 0.5
    );
    this.focusInterior = new THREE.CatmullRomCurve3(
      interiorIdx.map(i => new THREE.Vector3(...BEATS[i].focus)), false, 'catmullrom', 0.5
    );
    // 室外轨：B12、B13 + 虚拟终点
    this.railFinale = new THREE.CatmullRomCurve3(
      [...RAILS.finale.beats.map(i => new THREE.Vector3(...BEATS[i].pos)), new THREE.Vector3(-38, 24, 38)],
      false, 'catmullrom', 0.5
    );
    this.focusFinale = new THREE.CatmullRomCurve3(
      [...RAILS.finale.beats.map(i => new THREE.Vector3(...BEATS[i].focus)), new THREE.Vector3(0, 6.5, 0)],
      false, 'catmullrom', 0.5
    );

    this._bind();
  }

  _interiorIndex(t) {
    for (let i = 0; i < 9; i++) if (t < BEATS[i + 1].tIn) return i;
    return 9;
  }

  _frac(t, j) {
    const b = BEATS[j];
    return clamp01((t - b.tIn) / (b.tOut - b.tIn));
  }

  _sampleRail(t) {
    const staticBeat = BEATS[RAILS.static.beat];
    const N = RAILS.interior.points - 1;   // 10 段
    if (t < staticBeat.tIn) {
      const j = this._interiorIndex(t);
      const sPos = smooth(this._frac(t, j));
      const sFoc = smooth(Math.min(1, this._frac(t, j) / CONFIG.focusLeadRatio));
      this.railInterior.getPoint((j + sPos) / N, this.pos);
      const uf = (j - 1 + sFoc) / N;
      this.focusInterior.getPoint(uf < 0 ? 0 : uf, this.focus);
    } else if (t < staticBeat.tOut) {
      this.pos.set(...staticBeat.pos);
      this.focus.set(...staticBeat.focus);
    } else {
      const L = t <= BEATS[12].tOut ? 0 : 1;
      const j = 11 + L;
      const sPos = smooth(this._frac(t, j));
      const sFoc = smooth(Math.min(1, this._frac(t, j) / CONFIG.focusLeadRatio));
      const NF = RAILS.finale.points - 1;  // 2 段
      this.railFinale.getPoint((L + sPos) / NF, this.pos);
      this.focusFinale.getPoint((L + sFoc) / NF, this.focus);
    }
  }

  _bind() {
    const dom = this.dom;
    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.autoPlay = false;
      this.target = clamp01(this.target + Math.sign(e.deltaY) * CONFIG.scrollStep);
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') { this.keys.add('w'); this.autoPlay = false; }
      if (k === 's' || k === 'arrowdown') { this.keys.add('s'); this.autoPlay = false; }
      if (k === ' ') { e.preventDefault(); this.autoPlay = !this.autoPlay; }
    });
    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') this.keys.delete('w');
      if (k === 's' || k === 'arrowdown') this.keys.delete('s');
    });

    dom.addEventListener('pointerdown', (e) => {
      this.dragging = true;
      this.returning = false;
      try { dom.setPointerCapture(e.pointerId); } catch (_) {}
    });
    dom.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      this.yaw -= e.movementX * 0.0025;
      this.pitch -= e.movementY * 0.0020;
      this.pitch = Math.max(-1.2, Math.min(1.2, this.pitch));
      this.qOffset.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    });
    const release = (e) => {
      if (!this.dragging) return;
      this.dragging = false;
      this.returning = true;
      this.returnElapsed = 0;
      this.returnFrom.copy(this.qOffset);
      try { if (e && e.pointerId !== undefined) dom.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    dom.addEventListener('pointerup', release);
    dom.addEventListener('pointercancel', release);
  }

  /** 跳转到某一拍（立即到位，便于与关键帧逐帧比对） */
  jumpToBeat(beat) {
    const t = beat.jumpT ?? beat.tIn;
    this.target = t;
    this.current = t;
    this.autoPlay = false;
  }

  setAutoPlay(on) { this.autoPlay = on; }

  update(dt, time) {
    if (this.autoPlay) {
      this.target = clamp01(this.target + CONFIG.autoPlaySpeed * dt);
      if (this.target >= 1) this.autoPlay = false;
    }
    if (this.keys.has('w')) this.target = clamp01(this.target + CONFIG.keySpeed * dt);
    if (this.keys.has('s')) this.target = clamp01(this.target - CONFIG.keySpeed * dt);

    const k = 1 - Math.pow(1 - CONFIG.scrollDamping, dt * 60);
    this.current += (this.target - this.current) * k;

    this._sampleRail(this.current);

    const d = CONFIG.cameraDrift * 0.02;
    const dx = Math.sin(time * 0.7) * d;
    const dy = Math.sin(time * 0.53 + 1.7) * d * 0.6;
    const dz = Math.cos(time * 0.61) * d;

    this.camera.position.set(this.pos.x + dx, this.pos.y + dy, this.pos.z + dz);
    this._m.lookAt(this.camera.position, this.focus, this._up);
    this.baseQuat.setFromRotationMatrix(this._m);

    if (this.returning) {
      this.returnElapsed += dt;
      const p = Math.min(1, this.returnElapsed / CONFIG.slerpReturnTime);
      this.qOffset.slerpQuaternions(this.returnFrom, IDENTITY, smooth(p));
      if (p >= 1) { this.returning = false; this.qOffset.identity(); this.yaw = 0; this.pitch = 0; }
    }

    this.camera.quaternion.copy(this.baseQuat).multiply(this.qOffset);
  }

  get t() { return this.current; }
}
