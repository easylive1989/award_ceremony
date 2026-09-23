import { createChestModel } from './chest-model.js';

window.AwardThemes.set('dungeon', (host) => {
  const flame = `<svg viewBox="0 0 80 120" fill="none" aria-hidden="true"><path d="M40 117C-4 101 11 66 23 49C19 73 32 69 27 41C26 23 42 17 46 1C66 31 49 48 63 65C68 57 68 50 67 45C91 78 74 111 40 117Z" fill="#db7529"/><path d="M40 111C17 101 20 82 34 60C29 82 44 77 43 44C69 76 68 98 40 111Z" fill="#ffc568"/><path d="M40 109C28 100 34 90 45 78C43 89 55 100 40 109Z" fill="#fff1bd"/></svg>`;
  const motes = Array.from({ length: 28 }, (_, i) => `<i style="--x:${7 + (i * 37 % 87)}%;--y:${20 + (i * 23 % 73)}%;--delay:${-(i % 9)}s;--duration:${6 + i % 6}s;--size:${i % 3 === 0 ? '.2' : '.11'}cqw"></i>`).join('');
  const sparks = Array.from({ length: 20 }, (_, i) => {
    const angle = i * Math.PI * 2 / 20;
    return `<i style="--dx:${(Math.cos(angle) * (15 + i % 4 * 3)).toFixed(2)}cqw;--dy:${(Math.sin(angle) * 12 - 12).toFixed(2)}cqw;--turn:${i * 39}deg;--lag:${i % 4 * .07}s"></i>`;
  }).join('');
  host.innerHTML = `
    <div class="dt-scene" aria-hidden="true"></div>
    <div class="dt-torch dt-torch-left" aria-hidden="true"><div class="dt-firelight"></div>${flame}</div>
    <div class="dt-torch dt-torch-right" aria-hidden="true"><div class="dt-firelight"></div>${flame}</div>
    <div class="dt-motes" aria-hidden="true">${motes}</div>
    <header class="dt-header">
      <div class="dt-overline">榮 耀 寶 藏<span lang="en">THE TREASURE OF HONOR</span></div>
      <div class="dt-category" data-award-category></div>
      <div class="dt-header-rule" aria-hidden="true"><span>◇</span></div>
    </header>
    <div class="dt-suspense">傳說，即將揭曉<span lang="en">A LEGEND AWAITS</span></div>
    <div class="dt-aura" aria-hidden="true"></div>
    <div class="dt-rays" aria-hidden="true"></div>
    <div class="dt-chest" aria-hidden="true">
      <canvas class="dt-model"></canvas>
      <div class="dt-model-clock"></div>
      <div class="dt-model-fallback"><img src="themes/dungeon/chest-front.svg" alt=""><img src="themes/dungeon/lid.svg" alt=""></div>
      <div class="dt-chest-effects">
        <div class="dt-opening-glow"></div>
        <div class="dt-chest-light"></div>
      </div>
    </div>
    <div class="dt-burst" aria-hidden="true">${sparks}</div>
    <div class="dt-scroll-window">
    <div class="dt-scroll-flight">
      <section class="dt-scroll" aria-live="polite" aria-atomic="true">
        <div class="dt-parchment">
          <div class="dt-scroll-border" aria-hidden="true"></div>
          <div class="dt-scroll-corner dt-scroll-corner-tl" aria-hidden="true">✧</div>
          <div class="dt-scroll-corner dt-scroll-corner-tr" aria-hidden="true">✧</div>
          <div class="dt-scroll-corner dt-scroll-corner-bl" aria-hidden="true">✧</div>
          <div class="dt-scroll-corner dt-scroll-corner-br" aria-hidden="true">✧</div>
          <div class="dt-scroll-copy">
            <div class="dt-winner-label">榮耀歸於<span lang="en">THE HONOR GOES TO</span></div>
            <div class="dt-team" data-award-team></div>
            <div class="dt-congrats">恭喜獲獎<span lang="en">CONGRATULATIONS</span></div>
          </div>
        </div>
        <div class="dt-roller dt-roller-top" aria-hidden="true"></div>
        <div class="dt-roller dt-roller-bottom" aria-hidden="true"></div>
      </section>
    </div>
    </div>
    <div class="dt-footer">每一份勇氣，皆是珍寶<span lang="en">EVERY ACT OF COURAGE IS A TREASURE</span></div>
  `;
  const category = host.querySelector('[data-award-category]');
  const team = host.querySelector('[data-award-team]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let disposed = false;
  let frameId = null;
  const canvas = host.querySelector('.dt-model');
  const clock = host.querySelector('.dt-model-clock');
  let model = null;
  try { model = createChestModel(canvas); }
  catch (error) { host.classList.add('dt-no-webgl'); console.warn('3D chest unavailable; using static fallback.', error); }

  function renderModel() {
    const revealing = host.classList.contains('dt-run');
    const time = motion.matches && revealing ? 5.2 : Number(clock.getAnimations()[0]?.currentTime || 0) / 1000;
    model?.render(time, revealing);
    return time;
  }

  function frame() {
    frameId = null;
    if (disposed || !visible || document.hidden || motion.matches || !model) return;
    if (renderModel() < 5.2 && host.classList.contains('dt-run')) frameId = requestAnimationFrame(frame);
  }

  function resizeModel() {
    if (disposed || !model || !canvas.clientWidth || !canvas.clientHeight) return;
    model.resize(canvas.clientWidth, canvas.clientHeight);
    renderModel();
    // Project the actual model rim into stage coordinates to mask the emerging scroll.
    const toStage = point => ({ x: 25 + point.x * 50, y: 30 + point.y * 58 });
    const left = toStage(model.project(-2.075, 1.67, 1.18));
    const right = toStage(model.project(2.075, 1.67, 1.18));
    const back = toStage(model.project(2.075, 1.67, -1.18));
    host.style.setProperty('--dt-mouth-clip', `polygon(0 0,100% 0,100% ${back.y}%,${back.x}% ${back.y}%,${right.x}% ${right.y}%,${left.x}% ${left.y}%,0 ${left.y}%)`);
    canvas.dataset.mouthY = String((left.y + right.y) / 2);
  }

  function fit() {
    if (disposed || !host.clientWidth || !host.clientHeight) return;
    for (const [element, ratio, heightRatio] of [[category, .035, .09], [team, .057, .15]]) {
      let size = host.clientWidth * ratio;
      element.style.fontSize = `${size}px`;
      while (size > 1 && (element.scrollWidth > element.clientWidth + 1 || element.offsetHeight > host.clientHeight * heightRatio)) {
        size = Math.max(1, size - .5);
        element.style.fontSize = `${size}px`;
      }
    }
  }

  function sync() {
    if (disposed) return;
    host.classList.toggle('dt-paused', !visible || document.hidden);
    host.classList.toggle('dt-reduced', motion.matches);
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    if (visible) { fit(); resizeModel(); }
    if (visible && !document.hidden && !motion.matches && host.classList.contains('dt-run') && model && renderModel() < 5.2) frameId = requestAnimationFrame(frame);
  }

  function setAward(award) {
    category.textContent = award.category;
    team.textContent = award.team;
    fit();
  }

  const observer = new ResizeObserver(() => { fit(); resizeModel(); });
  observer.observe(host);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  document.fonts.ready.then(fit);

  return {
    prepare(award) {
      host.classList.remove('dt-run');
      host.classList.add('dt-waiting');
      setAward(award);
      sync();
    },
    update(award) {
      host.classList.remove('dt-run');
      host.classList.remove('dt-waiting');
      setAward(award);
      // Restart the full reveal on every award without timers that can outlive it.
      void host.offsetWidth;
      host.classList.add('dt-run');
      sync();
    },
    setVisible(value) { visible = value; sync(); },
    destroy() {
      disposed = true;
      visible = false;
      host.classList.add('dt-paused');
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
      model?.destroy();
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      motion.removeEventListener('change', sync);
    },
  };
});
