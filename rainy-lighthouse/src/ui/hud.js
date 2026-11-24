/** 左下 HUD：后端标识 + 当前拍 + 时间码 + t 值 + 进度 */
import { beatAt } from '../config.js';

export function createHud(el) {
  el.innerHTML = `
    <div class="row" style="margin:0 0 8px">
      <span class="badge" id="hud-backend"><i class="dot"></i><span>初始化中</span></span>
      <span class="badge" id="hud-rail"><i class="dot" style="background:#F59E0B"></i><span>railInterior</span></span>
    </div>
    <div class="beat">
      <span class="beat-id" id="hud-beat">B1</span>
      <span class="beat-name" id="hud-name">远景海面 · 孤灯初现</span>
    </div>
    <div class="row mono">
      <span id="hud-tc">0:00–0:05</span>
      <span>t <span id="hud-t">0.0000</span></span>
      <span id="hud-act">第一幕 逼近与登岛</span>
    </div>
    <div class="bar"><i id="hud-bar" style="width:0%"></i></div>
    <div class="hint">滚轮 / W·S 推进与倒带 ｜ 按住拖拽偏移视角，松手四元数回正 ｜ 空格播放/暂停</div>
  `;
  const $ = (id) => el.querySelector('#' + id);
  return {
    setBackend(label, isGpu) {
      const b = $('hud-backend');
      b.className = 'badge ' + (isGpu ? 'gpu' : 'gl');
      b.querySelector('span').textContent = label;
    },
    setRail(name) { $('hud-rail').querySelector('span').textContent = name; },
    update(t, beat) {
      $('hud-beat').textContent = beat.id;
      $('hud-name').textContent = beat.name;
      $('hud-tc').textContent = beat.tc;
      $('hud-t').textContent = t.toFixed(4);
      $('hud-act').textContent = beat.actName;
      $('hud-bar').style.width = (t * 100).toFixed(2) + '%';
    }
  };
}
