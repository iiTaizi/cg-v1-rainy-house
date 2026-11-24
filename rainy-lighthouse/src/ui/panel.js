/** 右上调试面板：默认收起；跳转到某拍、播放控制、线框视图、后端标识 */
import { BEATS } from '../config.js';

export function createPanel(el, opts) {
  const { onJump, onTogglePlay, onToggleWireframe, backendLabel, isGpu } = opts;
  const beatsHtml = BEATS.map(b =>
    `<button data-beat="${b.id}" title="${b.tc} · ${b.actName}">${b.id}</button>`
  ).join('');

  el.innerHTML = `
    <header>
      <h2>图形学调试面板</h2>
      <span class="toggle">展开 ▲</span>
    </header>
    <div class="body">
      <div class="sec">
        <h3>渲染后端</h3>
        <span class="badge ${isGpu ? 'gpu' : 'gl'}" id="p-backend"><i class="dot"></i><span>${backendLabel}</span></span>
        <div class="note">追加 <span class="mono">?webgl=1</span> 可强制 WebGL2 后端，验证降级路径不黑屏。</div>
      </div>
      <div class="sec">
        <h3>跳转到某拍</h3>
        <div class="beats">${beatsHtml}</div>
      </div>
      <div class="sec">
        <h3>播放与视图</h3>
        <div class="row">
          <button class="act" id="p-play">暂停</button>
          <button class="act" id="p-wire">线框视图</button>
        </div>
        <div class="note" id="p-status">自动推进中</div>
      </div>
      <div class="sec">
        <h3>模块状态</h3>
        <div class="note">
          轨道：<span class="val" id="p-rail">railInterior</span><br/>
          采样：<span class="val" id="p-sample">t 0.0000</span><br/>
          M1 范围：占位体 + 双轨运镜 + 交互；着色器与光照预设属 M3/M4。
        </div>
      </div>
    </div>
  `;

  const header = el.querySelector('header');
  const toggle = el.querySelector('.toggle');
  header.addEventListener('click', () => {
    el.classList.toggle('open');
    toggle.textContent = el.classList.contains('open') ? '收起 ▼' : '展开 ▲';
  });

  el.querySelectorAll('.beats button').forEach(btn => {
    btn.addEventListener('click', () => {
      const beat = BEATS.find(b => b.id === btn.dataset.beat);
      onJump(beat);
      el.querySelectorAll('.beats button').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const playBtn = el.querySelector('#p-play');
  playBtn.addEventListener('click', () => {
    const on = onTogglePlay();
    playBtn.textContent = on ? '暂停' : '播放';
    el.querySelector('#p-status').textContent = on ? '自动推进中' : '已暂停';
  });

  const wireBtn = el.querySelector('#p-wire');
  wireBtn.addEventListener('click', () => {
    const on = onToggleWireframe();
    wireBtn.textContent = on ? '着色视图' : '线框视图';
  });

  return {
    setStatus(text) { el.querySelector('#p-status').textContent = text; },
    setRail(name) { el.querySelector('#p-rail').textContent = name; },
    setSample(text) { el.querySelector('#p-sample').textContent = text; },
    setPlaying(on) {
      playBtn.textContent = on ? '暂停' : '播放';
      el.querySelector('#p-status').textContent = on ? '自动推进中' : '已暂停';
    }
  };
}
