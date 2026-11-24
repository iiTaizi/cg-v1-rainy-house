/**
 * M1 占位体场景：只用基础几何体搭出礁石 / 灯塔 / 螺旋石阶 / 海面 / 菲涅尔透镜。
 * 尺度对齐 TECH_SPEC §3（米制、Blender Z-up ↔ three.js Y-up）。
 */
import * as THREE from 'three/webgpu';
import { positionLocal, mix, vec3, sin } from 'three/tsl';

export const SCENE = {
  seaLevel: 0,
  platformTop: 2.5,
  platformRadius: 9,
  shaftBottom: 2.5,
  shaftTop: 11.5,
  lanternFloor: 11.5,
  lanternTop: 13.5,
  apex: 14.5,
  lensCenter: 12.5,
  stepCount: 48,
  stepRise: 0.1875,
  stepTread: 0.5,
  rampInner: 3.2,
  rampOuter: 4.6
};

export function buildPlaceholders(scene) {
  const group = new THREE.Group();
  group.name = 'Placeholders';

  // ---- 海面（单一水平面，y = 0）----
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardNodeMaterial({ color: 0x0b132b, roughness: 0.18, metalness: 0.15 })
  );
  sea.name = 'Sea';
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = SCENE.seaLevel;
  group.add(sea);

  // ---- 礁石平台（十二边形柱体，顶面 y = 2.5）----
  const rock = new THREE.Mesh(
    new THREE.CylinderGeometry(SCENE.platformRadius, 11, 2.5, 12, 1),
    new THREE.MeshStandardNodeMaterial({ color: 0x2b3038, roughness: 0.95, metalness: 0.0 })
  );
  rock.name = 'Rock';
  rock.position.y = 1.25;
  group.add(rock);

  // ---- 灯塔塔身（八棱柱，2.5 → 11.5）----
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 3.0, SCENE.shaftTop - SCENE.shaftBottom, 8, 1),
    new THREE.MeshStandardNodeMaterial({ color: 0x8b8f96, roughness: 0.85, metalness: 0.0 })
  );
  shaft.name = 'LighthouseShaft';
  shaft.position.y = (SCENE.shaftBottom + SCENE.shaftTop) / 2;
  group.add(shaft);

  // ---- 灯室（11.5 → 13.5）----
  const lantern = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.2, SCENE.lanternTop - SCENE.lanternFloor, 8, 1, true),
    new THREE.MeshStandardNodeMaterial({
      color: 0x1b2436, roughness: 0.25, metalness: 0.1,
      transparent: true, opacity: 0.55, side: THREE.DoubleSide
    })
  );
  lantern.name = 'LanternRoom';
  lantern.position.y = (SCENE.lanternFloor + SCENE.lanternTop) / 2;
  group.add(lantern);

  // ---- 顶罩（13.5 → 14.5）----
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.6, 1.0, 8),
    new THREE.MeshStandardNodeMaterial({ color: 0x2f3742, roughness: 0.6, metalness: 0.3 })
  );
  roof.name = 'LighthouseRoof';
  roof.position.y = SCENE.lanternTop + 0.5;
  group.add(roof);

  // ---- 螺旋石阶（48 级 InstancedMesh，1 次 draw call）----
  const stepGeo = new THREE.BoxGeometry(1.0, SCENE.stepRise, SCENE.stepTread);
  const steps = new THREE.InstancedMesh(
    stepGeo,
    new THREE.MeshStandardNodeMaterial({ color: 0x3c4149, roughness: 0.25, metalness: 0.05 }),
    SCENE.stepCount
  );
  steps.name = 'SpiralStairs';
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);
  const rMean = (SCENE.rampInner + SCENE.rampOuter) / 2;
  for (let i = 0; i < SCENE.stepCount; i++) {
    const theta = (i / SCENE.stepCount) * Math.PI * 2;
    const r = rMean + Math.sin(i * 0.7) * 0.25;
    const y = SCENE.platformTop + (i + 0.5) * SCENE.stepRise;
    p.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
    e.set(0, -theta, 0);
    q.setFromEuler(e);
    m.compose(p, q, one);
    steps.setMatrixAt(i, m);
  }
  steps.instanceMatrix.needsUpdate = true;
  group.add(steps);

  // ---- 栏杆立柱（每 4 级一根，InstancedMesh）----
  const postCount = Math.floor(SCENE.stepCount / 4);
  const posts = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.9, 6),
    new THREE.MeshStandardNodeMaterial({ color: 0x1a1d22, roughness: 0.55, metalness: 0.7 }),
    postCount
  );
  posts.name = 'RailingPosts';
  for (let i = 0; i < postCount; i++) {
    const step = i * 4;
    const theta = (step / SCENE.stepCount) * Math.PI * 2;
    const r = SCENE.rampOuter - 0.15;
    p.set(Math.cos(theta) * r, SCENE.platformTop + (step + 1) * SCENE.stepRise + 0.45, Math.sin(theta) * r);
    q.identity();
    m.compose(p, q, one);
    posts.setMatrixAt(i, m);
  }
  posts.instanceMatrix.needsUpdate = true;
  group.add(posts);

  // ---- 菲涅尔透镜（8 圈环 + 发光核心；核心用 TSL 节点材质，验证 TSL 通路）----
  const lensGroup = new THREE.Group();
  lensGroup.name = 'FresnelLens';
  const ringMat = new THREE.MeshStandardNodeMaterial({
    color: 0xdfe7f2, roughness: 0.08, metalness: 0.0, transparent: true, opacity: 0.85
  });
  for (let i = 0; i < 8; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.07, 8, 48), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = SCENE.lensCenter - 0.42 + i * 0.12;
    lensGroup.add(ring);
  }
  const coreMat = new THREE.MeshStandardNodeMaterial({
    color: 0xffb347, emissive: 0xff9d2e, emissiveIntensity: 1.0, roughness: 0.4
  });
  // TSL 节点：沿高度做条纹明暗，作为 TSL 通路可用性的最小验证
  coreMat.emissiveNode = mix(
    vec3(0.85, 0.42, 0.08),
    vec3(1.0, 0.78, 0.36),
    sin(positionLocal.y.mul(18.0)).mul(0.5).add(0.5)
  );
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), coreMat);
  core.name = 'LensCore';
  lensGroup.add(core);
  group.add(lensGroup);

  scene.add(group);
  return { group, sea, rock, shaft, lantern, roof, steps, posts, lensGroup, lensCore: core, coreMat, ringMat };
}
