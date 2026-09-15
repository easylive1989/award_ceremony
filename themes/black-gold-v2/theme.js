window.AwardThemes.set('black-gold-v2', (host) => {
  host.innerHTML = `
    <canvas class="v2-effects" aria-hidden="true"></canvas>
    <div class="v2-vignette" aria-hidden="true"></div>
    <div class="v2-frame" aria-hidden="true"></div>
    <div class="v2-header" data-award-category aria-live="polite" aria-atomic="true"></div>
    <div class="v2-suspense" aria-hidden="true">And the winner is…</div>
    <div class="v2-envelope" aria-hidden="true">
      <div class="v2-shell">
        <div class="v2-envelope-back"></div>
        <div class="v2-envelope-lining"></div>
        <div class="v2-flap"></div>
      </div>
    </div>
    <div class="v2-envelope-front" aria-hidden="true">
      <div class="v2-shell">
        <div class="v2-pocket"></div>
        <div class="v2-seal">✦</div>
      </div>
    </div>
    <div class="v2-card-window">
    <div class="v2-card" aria-live="polite" aria-atomic="true">
      <div class="v2-kicker">✦ &nbsp; THE WINNING MOMENT &nbsp; ✦</div>
      <div class="v2-team" data-award-team></div>
      <div class="v2-congrats">恭喜獲獎<span>CONGRATULATIONS</span></div>
    </div>
    </div>
    <div class="v2-footer">每 一 份 熱 愛 ・ 都 值 得 閃 耀</div>
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
  const dust = Array.from({ length: 320 }, () => ({ x: random(), y: random(), speed: .3 + random(), size: .5 + random() * 2, phase: random() * 6.28 }));
  const confetti = Array.from({ length: 110 }, () => ({ x: random(), y: random(), phase: random() * 6.28, speed: .5 + random(), size: 2 + random() * 5 }));
  const burst = Array.from({ length: 210 }, () => ({ angle: random() * Math.PI * 2, speed: .07 + random() * .3, delay: random() * .25, size: .4 + random() * 1.7 }));

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

  function glow(x, y, radius, alpha) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(255,224,151,${alpha})`);
    gradient.addColorStop(.15, `rgba(221,168,68,${alpha * .6})`);
    gradient.addColorStop(1, 'rgba(221,168,68,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function draw() {
    if (!ctx || !width || !height) return;
    const w = width, h = height, unit = w / 1600;
    const revealAge = host.classList.contains('v2-waiting') ? -1 : reduced ? 8 : elapsed - REVEAL_AT;
    const celebration = reduced ? 1 : Math.min(1, Math.max(0, revealAge));
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'screen';

    // Eight moving theatre beams, strongest outside the typography's center.
    for (let i = 0; i < 8; i++) {
      const x = w * (.06 + i * .126);
      const aim = w * (.5 + Math.sin(time * .13 + i * 1.2) * .63);
      const spread = w * (.035 + (i % 3) * .017);
      const light = ctx.createLinearGradient(x, -h * .1, aim, h);
      light.addColorStop(0, `rgba(249,222,147,${.11 + celebration * .07})`);
      light.addColorStop(.55, 'rgba(192,144,56,.035)');
      light.addColorStop(1, 'rgba(192,144,56,0)');
      ctx.fillStyle = light;
      ctx.beginPath();
      ctx.moveTo(x, -h * .1);
      ctx.lineTo(aim - spread, h);
      ctx.lineTo(aim + spread, h);
      ctx.closePath();
      ctx.fill();
    }
    glow(w * .5, h * .54, w * .4, .08 + celebration * .10);

    // Rotating gold halo and fine engraved arcs frame the award card.
    for (let i = 0; i < 4; i++) {
      const radius = w * (.27 + i * .025);
      const angle = time * (i % 2 ? -.055 : .045) + i * 1.3;
      ctx.lineWidth = (i === 1 ? 1.4 : .65) * unit;
      ctx.strokeStyle = `rgba(224,180,82,${.055 + celebration * .07})`;
      ctx.beginPath();
      ctx.arc(w * .5, h * .51, radius, angle, angle + Math.PI * 1.3);
      ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.ellipse(w * .5, h * .86, w * (.16 + i * .047), h * (.021 + i * .014), 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(229,184,87,${i === 3 ? .33 : .10})`;
      ctx.lineWidth = unit;
      ctx.stroke();
    }

    for (const particle of dust) {
      const x = particle.x * w + Math.sin(time * .2 + particle.phase) * 15 * unit;
      const y = ((particle.y - time * .015 * particle.speed) % 1 + 1) % 1 * h;
      const alpha = .18 + (.5 + .5 * Math.sin(time + particle.phase)) * .55;
      ctx.fillStyle = `rgba(247,208,128,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, particle.size * unit, 0, Math.PI * 2);
      ctx.fill();
      if (particle.size > 2.3) glow(x, y, 12 * unit, alpha * .15);
    }

    // Continuous side fountains and falling foil begin when the envelope opens.
    if (celebration > 0) {
      for (const piece of confetti) {
        const y = ((piece.y + time * .04 * piece.speed) % 1) * h;
        const x = piece.x * w + Math.sin(time + piece.phase) * 22 * unit;
        if (x > w * .17 && x < w * .83 && y > h * .2 && y < h * .7) continue;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(piece.phase + time * .7);
        ctx.scale(Math.sin(piece.phase + time * 1.4), 1);
        ctx.fillStyle = `rgba(243,204,119,${celebration * .67})`;
        ctx.fillRect(-piece.size * unit / 2, -piece.size * unit, piece.size * unit, piece.size * 1.8 * unit);
        ctx.restore();
      }
      for (let i = 0; i < 90; i++) {
        const phase = (time * .3 + i / 90) % 1;
        const side = i % 2 ? .94 : .06;
        const x = w * (side + (i % 2 ? -1 : 1) * Math.sin(i * 2.4) * phase * .07);
        const y = h * (.98 - phase * .84);
        ctx.strokeStyle = `rgba(253,204,106,${(1 - phase) * celebration * .65})`;
        ctx.lineWidth = (1 + i % 3 * .4) * unit;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + (3 + (1 - phase) * 10) * unit);
        ctx.stroke();
      }
    }

    // One reveal burst, with a soft expanding ring rather than a full-screen flash.
    if (revealAge >= 0 && revealAge < 4 && !reduced) {
      for (const spark of burst) {
        const age = revealAge - spark.delay;
        if (age < 0) continue;
        const fade = Math.max(0, 1 - age / 3.5);
        const distance = w * spark.speed * age;
        const x = w * .5 + Math.cos(spark.angle) * distance;
        const y = h * .56 + Math.sin(spark.angle) * distance * .7 + age * age * 8 * unit;
        ctx.strokeStyle = `rgba(255,224,159,${fade * .8})`;
        ctx.lineWidth = spark.size * unit;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - Math.cos(spark.angle) * 13 * unit * fade, y - Math.sin(spark.angle) * 13 * unit * fade);
        ctx.stroke();
      }
      const fade = Math.max(0, 1 - revealAge / 1.8);
      ctx.strokeStyle = `rgba(255,224,151,${fade * .6})`;
      ctx.lineWidth = 2 * unit;
      ctx.beginPath();
      ctx.ellipse(w * .5, h * .55, w * revealAge * .33, h * revealAge * .24, 0, 0, Math.PI * 2);
      ctx.stroke();
      glow(w * .5, h * .6, w * .16, fade * .3);
    }
    ctx.globalCompositeOperation = 'source-over';
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
    host.classList.toggle('v2-paused', !playing);
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
      host.classList.remove('v2-run');
      host.classList.add('v2-waiting');
      fitText();
      sync();
    },
    update(award) {
      host.classList.remove('v2-waiting');
      category.textContent = award.category;
      team.textContent = award.team;
      elapsed = 0;
      previous = null;
      fitText();
      host.classList.remove('v2-run');
      void host.offsetWidth;
      host.classList.add('v2-run');
      sync();
    },
    setVisible(value) { visible = value; sync(); },
    destroy() {
      disposed = true;
      visible = false;
      if (frameId !== null) cancelAnimationFrame(frameId);
      host.classList.add('v2-paused');
      observer.disconnect();
      motion.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', sync);
    },
  };
});
