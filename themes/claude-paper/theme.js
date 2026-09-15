window.AwardThemes.set('claude-paper', (host) => {
  host.innerHTML = `
    <canvas class="paper-effects" aria-hidden="true"></canvas>
    <div class="paper-vignette" aria-hidden="true"></div>
    <div class="paper-header" data-award-category aria-live="polite" aria-atomic="true"></div>
    <div class="paper-suspense" aria-hidden="true">And the winner is…</div>
    <div class="paper-envelope" aria-hidden="true">
      <div class="paper-shell">
        <div class="paper-envelope-back"></div>
        <div class="paper-envelope-lining"></div>
        <div class="paper-flap"></div>
      </div>
    </div>
    <div class="paper-envelope-front" aria-hidden="true">
      <div class="paper-shell">
        <div class="paper-pocket"></div>
        <div class="paper-seal"><svg viewBox="-2 -2 104 104" aria-hidden="true"><path fill="currentColor" d="m19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z"/></svg></div>
      </div>
    </div>
    <div class="paper-card" aria-live="polite" aria-atomic="true">
      <div class="paper-kicker">A moment worth celebrating.</div>
      <div class="paper-team" data-award-team></div>
      <div class="paper-congrats">恭喜獲獎<span>CONGRATULATIONS</span></div>
    </div>
    <div class="paper-delivery" aria-hidden="true">
      <div class="paper-helper paper-helper-rear">
        <div class="paper-helper-body">
          <img class="paper-mascot" src="assets/images/clawd-base.png" width="924" height="750" alt="" draggable="false">
        </div>
      </div>
      <svg class="paper-podium" viewBox="0 0 300 118" fill="none">
        <ellipse cx="150" cy="107" rx="143" ry="8" fill="#573c2c" opacity=".16"/>
        <path d="M14 53 38 38h224l24 15v49H14z" fill="#e4cfad" stroke="#6f5140" stroke-width="1.5"/>
        <path d="M14 53h272v49H14z" fill="#eee1c9"/>
        <path d="M14 53h272M18 101h264" stroke="#c1a582" stroke-width="2"/>
        <path d="m99 19 14-10h74l14 10v83H99z" fill="#faf4e6" stroke="#c1a582" stroke-width="1.5"/>
        <path d="M99 19h102l-14-10h-74z" fill="#fffaf0"/>
        <path d="M107 95h86" stroke="#dbc8a9"/>
        <path d="M138 39h24v10c0 10-5 16-12 16s-12-6-12-16V39Zm0 5h-7v7c0 7 4 10 10 11m21-18h7v7c0 7-4 10-10 11m-9 3v10m-9 4h18" stroke="#b66a49" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <div class="paper-helper paper-helper-front">
        <div class="paper-helper-body">
          <img class="paper-mascot" src="assets/images/clawd-base.png" width="924" height="750" alt="" draggable="false">
        </div>
      </div>
    </div>
    <div class="paper-footer">每 一 份 熱 愛 ・ 都 值 得 閃 耀</div>
  `;
  const canvas = host.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const category = host.querySelector('[data-award-category]');
  const team = host.querySelector('[data-award-team]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, disposed = false, reduced = motion.matches;
  let width = 0, height = 0, time = 0, elapsed = 0, previous = null, frameId = null;
  const REVEAL_AT = 1.85; // Matches the card's CSS delay; never advances the playlist.
  let seed = 31987;
  const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  const dust = Array.from({ length: 130 }, () => ({ x: random(), y: random(), speed: .3 + random(), size: .5 + random() * 2, phase: random() * 6.28 }));
  const confetti = Array.from({ length: 65 }, () => ({ x: random(), y: random(), phase: random() * 6.28, speed: .5 + random(), size: 9 + random() * 9 }));
  const burst = Array.from({ length: 90 }, () => ({ angle: random() * Math.PI * 2, speed: .07 + random() * .3, delay: random() * .25, size: .4 + random() * 1.7 }));

  function fitText() {
    if (disposed || !width || !height) return;
    for (const [element, ratio, maxHeight] of [[category, .028, .10], [team, .078, .185]]) {
      let size = width * ratio;
      element.style.fontSize = `${size}px`;
      while (size > 1 && (element.scrollWidth > element.clientWidth + 1 || element.offsetHeight > height * maxHeight)) {
        size = Math.max(1, size - .5);
        element.style.fontSize = `${size}px`;
      }
    }
  }

  function wash(x, y, radius, alpha) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(250,230,200,${alpha})`);
    gradient.addColorStop(1, 'rgba(250,230,200,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function draw() {
    if (!ctx || !width || !height) return;
    const w = width, h = height, unit = w / 1600;
    const revealAge = host.classList.contains('paper-waiting') ? -1 : reduced ? 8 : elapsed - REVEAL_AT;
    const celebration = reduced ? 1 : Math.min(1, Math.max(0, revealAge));
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    // Keep the terracotta background soft and free of contour lines.
    wash(w * (.08 + Math.sin(time * .08) * .025), h * .76, w * .38, .10);
    wash(w * .92, h * (.18 + Math.sin(time * .09) * .025), w * .33, .075);
    for (const speck of dust) {
      const x = speck.x * w + Math.sin(time * .14 + speck.phase) * 10 * unit;
      const y = ((speck.y - time * .006 * speck.speed) % 1 + 1) % 1 * h;
      ctx.fillStyle = `rgba(255,238,211,${.07 + (.5 + .5 * Math.sin(time * .3 + speck.phase)) * .12})`;
      ctx.beginPath();
      ctx.arc(x, y, speck.size * .65 * unit, 0, Math.PI * 2);
      ctx.fill();
    }
    // Broad paper ribbons tumble behind the award card.
    const colors = ['255,244,220', '235,202,143', '185,204,156', '174,206,223'];
    if (celebration > 0) {
      confetti.forEach((piece, index) => {
        const y = ((piece.y + time * .015 * piece.speed) % 1) * h;
        const x = piece.x * w + Math.sin(time * .5 + piece.phase) * 20 * unit;
        if (x > w * .15 && x < w * .85 && y > h * .19 && y < h * .72) return;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(piece.phase + time * .3);
        ctx.scale(Math.cos(piece.phase + time * .5), 1);
        ctx.fillStyle = `rgba(${colors[index % colors.length]},${celebration * .85})`;
        const breadth = piece.size * unit;
        const length = breadth * (index % 3 === 0 ? 4.2 : 2.4);
        ctx.beginPath();
        ctx.moveTo(-breadth / 2, -length / 2);
        ctx.bezierCurveTo(breadth * .8, -length * .2, -breadth * .8, length * .2, -breadth / 2, length / 2);
        ctx.lineTo(breadth / 2, length / 2);
        ctx.bezierCurveTo(-breadth * .1, length * .2, breadth * 1.8, -length * .2, breadth / 2, -length / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
    }
    if (revealAge >= 0 && revealAge < 3.5 && !reduced) {
      burst.forEach((spark, index) => {
        const age = revealAge - spark.delay;
        if (age < 0) return;
        const fade = Math.max(0, 1 - age / 3);
        const distance = w * spark.speed * age * .65;
        const x = w * .5 + Math.cos(spark.angle) * distance;
        const y = h * .56 + Math.sin(spark.angle) * distance * .7 + age * age * 10 * unit;
        ctx.fillStyle = `rgba(${colors[index % colors.length]},${fade * .8})`;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(spark.angle + age);
        ctx.fillRect(0, 0, (1 + spark.size) * 5 * unit, (1 + spark.size) * 12 * unit);
        ctx.restore();
      });
    }
  }

  function resize() {
    if (disposed || !host.clientWidth || !host.clientHeight) return;
    width = host.clientWidth;
    height = host.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    fitText();
    draw();
  }

  function frame(now) {
    frameId = null;
    if (disposed || !visible || document.hidden || reduced || !ctx) return;
    const delta = previous === null ? 0 : Math.min((now - previous) / 1000, .1);
    time += delta;
    elapsed += delta;
    previous = now;
    draw();
    frameId = requestAnimationFrame(frame);
  }

  function sync() {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    previous = null;
    const playing = visible && !disposed && !document.hidden;
    host.classList.toggle('paper-paused', !playing);
    if (!playing) return;
    resize();
    if (!reduced && ctx) frameId = requestAnimationFrame(frame);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const onMotionChange = () => { reduced = motion.matches; sync(); };
  motion.addEventListener('change', onMotionChange);
  document.addEventListener('visibilitychange', sync);
  document.fonts.ready.then(fitText);

  return {
    prepare(award) {
      category.textContent = award.category;
      team.textContent = award.team;
      elapsed = 0;
      previous = null;
      host.classList.remove('paper-run');
      host.classList.add('paper-waiting');
      fitText();
      sync();
    },
    update(award) {
      host.classList.remove('paper-waiting');
      category.textContent = award.category;
      team.textContent = award.team;
      elapsed = 0;
      previous = null;
      fitText();
      host.classList.remove('paper-run');
      void host.offsetWidth;
      host.classList.add('paper-run');
      sync();
    },
    setVisible(value) { visible = value; sync(); },
    destroy() {
      disposed = true;
      visible = false;
      if (frameId !== null) cancelAnimationFrame(frameId);
      host.classList.add('paper-paused');
      observer.disconnect();
      motion.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', sync);
    },
  };
});
