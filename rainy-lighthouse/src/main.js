/**
 * 雨夜灯塔：失落的信标 —— M1 最小可运行闭环
 * WebGPU 优先，自动降级 WebGL2；双轨样条运镜；滚轮/W·S 推进；调试面板。
 */
import * as THREE from 'three/webgpu';
import { CONFIG, BEATS, RAILS, beatAt } from './config.js';
import { buildPlaceholders } from './scene/placeholders.js';
import { BeaconController, flashFactor, exposureAt } from './scene/beacon.js';
import { RailRig } from './camera/rail.js';
import { createHud } from './ui/hud.js';
import { createPanel } from './ui/panel.js';

const canvas = document.getElementById('stage');
const flashEl = document.getElementById('flash');
const params = new URLSearchParams(location.search);
const forceWebGL = params.get('webgl') === '1';

function detectBackend(renderer) {
  const b = renderer.backend;
  if (!b) return { label: '未知', isGpu: false };
  if (b.isWebGPUBackend === true) return { label: 'WebGPU', isGpu: true };
  if (b.isWebGLBackend === true) return { label: 'WebGL2', isGpu: false };
  const n = b.constructor?.name || '';
  if (/WebGPU/i.test(n)) return { label: 'WebGPU', isGpu: true };
  if (/WebGL/i.test(n)) return { label: 'WebGL2', isGpu: false };
  return { label: '未知', isGpu: false };
}

function railName(t) {
  const staticBeat = BEATS[RAILS.static.beat];
  if (t < staticBeat.tIn) return 'railInterior';
  if (t < staticBeat.tOut) return 'railStatic';
  return 'railFinale';
}

async function boot() {
  // ---- 渲染器：WebGPU 优先，失败或被指定时回退 WebGL2 ----
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, forceWebGL });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.maxPixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  await renderer.init();

  const backend = detectBackend(renderer);

  // ---- 场景 ----
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b132b);
  scene.fog = new THREE.FogExp2(0x0b132b, CONFIG.fogDensity);

  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 1.2, 62);

  const ph = buildPlaceholders(scene);

  // ---- 光照 ----
  const hemi = new THREE.HemisphereLight(CONFIG.hemi.sky, CONFIG.hemi.ground, CONFIG.ambient.night);
  const lensLight = new THREE.PointLight(CONFIG.beaconLight.color, 1.0, CONFIG.beaconLight.distance, 2);
  lensLight.position.set(0, 12.5, 0);
  const moon = new THREE.DirectionalLight(CONFIG.moon.color, CONFIG.moon.intensity);
  moon.position.set(...CONFIG.moon.position);
  const windowLights = [];
  for (const h of CONFIG.windowLights.heights) {
    const w = new THREE.PointLight(CONFIG.windowLights.color, 1.0, CONFIG.windowLights.distance, 2);
    w.position.set(0, h, 2.4);
    windowLights.push(w);
  }
  scene.add(hemi, lensLight, moon, ...windowLights);

  const beacon = new BeaconController({ lensLight, windowLights, hemi });

  // ---- 相机轨道与交互 ----
  const rig = new RailRig(camera, canvas);

  // ---- UI ----
  const hud = createHud(document.getElementById('hud'));
  hud.setBackend(backend.label, backend.isGpu);

  let wireframe = false;
  const panel = createPanel(document.getElementById('panel'), {
    backendLabel: backend.label,
    isGpu: backend.isGpu,
    onJump: (beat) => rig.jumpToBeat(beat),
    onTogglePlay: () => { rig.setAutoPlay(!rig.autoPlay); return rig.autoPlay; },
    onToggleWireframe: () => {
      wireframe = !wireframe;
      scene.traverse((o) => {
        if (o.isMesh && o.material && 'wireframe' in o.material) {
          o.material.wireframe = wireframe;
          o.material.needsUpdate = true;
        }
      });
      return wireframe;
    }
  });
  panel.setPlaying(rig.autoPlay);

  // ---- 尺寸自适应 ----
  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.maxPixelRatio));
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize);

  // ---- 主循环 ----
  const timer = new THREE.Timer();
  renderer.setAnimationLoop(() => {
    timer.update();
    const dt = Math.min(0.05, timer.getDelta());
    const time = timer.getElapsed();

    rig.update(dt, time);

    const t = rig.t;
    const beat = beatAt(t);

    // 焦段按拍硬切（不可插值）
    if (Math.abs(camera.fov - beat.fov) > 0.01) {
      camera.fov = beat.fov;
      camera.updateProjectionMatrix();
    }

    // 信标三通道
    beacon.apply(t, time);

    // 闪白转场：CSS 遮罩 + 曝光 ramp（后端无关）
    flashEl.style.opacity = String(flashFactor(t));
    renderer.toneMappingExposure = exposureAt(t);

    // 透镜自转 + 脉动
    ph.lensGroup.rotation.y = time * (CONFIG.beacon.rotationSpeed * Math.PI / 180);
    ph.coreMat.emissiveIntensity = 0.6 + beacon.state.beacon * 1.4;

    hud.update(t, beat);
    hud.setRail(railName(t));
    panel.setRail(railName(t));
    panel.setSample('t ' + t.toFixed(4));

    renderer.render(scene, camera);
  });

  // 调试句柄（浏览器控制台可直接核对）
  window.__LH__ = {
    renderer, scene, camera, rig, beacon,
    get t() { return rig.t; },
    get beat() { return beatAt(rig.t).id; },
    get backend() { return backend.label; }
  };

  window.addEventListener('beforeunload', () => {
    renderer.setAnimationLoop(null);
    scene.traverse((o) => {
      if (o.isMesh) {
        o.geometry?.dispose?.();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) m?.dispose?.();
      }
    });
    renderer.dispose?.();
  });
}

boot().catch((err) => {
  console.error('[rainy-lighthouse] 启动失败', err);
  const el = document.getElementById('hud');
  if (el) {
    el.innerHTML = '<div style="color:#FCD34D;font-size:12px;line-height:1.7">启动失败：' +
      (err?.message || err) + '<br/>如为 WebGPU 不可用，请追加 ?webgl=1 重试。</div>';
  }
});
