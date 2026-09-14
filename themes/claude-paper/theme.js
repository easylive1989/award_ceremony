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
        <div class="paper-pocket"></div>
        <div class="paper-envelope-label">A LETTER OF RECOGNITION</div>
        <div class="paper-seal"><svg viewBox="0 0 60 60" aria-hidden="true"><g stroke="currentColor" stroke-width="3" stroke-linecap="round">${Array.from({ length: 12 }, (_, i) => `<path d="M30 10V22" transform="rotate(${i * 30} 30 30)"/>`).join('')}</g></svg></div>
      </div>
    </div>
    <div class="paper-card" aria-live="polite" aria-atomic="true">
      <div class="paper-kicker">A moment worth celebrating.</div>
      <div class="paper-team" data-award-team></div>
      <div class="paper-congrats">恭喜獲獎<span>CONGRATULATIONS</span></div>
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
    // Quiet warm washes and pencil-like contours replace the theatre spotlights.
    wash(w * (.08 + Math.sin(time * .08) * .025), h * .76, w * .38, .10);
    wash(w * .92, h * (.18 + Math.sin(time * .09) * .025), w * .33, .075);
    ctx.strokeStyle = 'rgba(255,238,211,.16)';
    ctx.lineWidth = .85 * unit;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.ellipse(w * .035, h * .88, w * (.16 + i * .022), h * (.12 + i * .043), -.4 + Math.sin(time * .06) * .03, -2, 1.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(w * .97, h * .18, w * (.12 + i * .017), h * (.14 + i * .033), -.4, 1.8, 4.1);
      ctx.stroke();
    }
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
