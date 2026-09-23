window.AwardThemes.set('claude-final', (host) => {
  const laurelLeaf = (index) => `
    <svg class="final-laurel-leaf${index % 2 ? ' final-laurel-leaf-alt' : ''}" viewBox="0 0 54 30" fill="none" aria-hidden="true">
      <path class="final-laurel-leaf-shadow" d="M3 25C9 8 27-2 51 4C45 21 27 33 3 25Z"/>
      <path class="final-laurel-leaf-fill" d="M3 23C10 8 27 0 49 5C42 20 26 29 3 23Z"/>
      <path class="final-laurel-vein" d="M7 21C20 16 32 11 45 6"/>
    </svg>`;
  const laurelRail = (count) => Array.from({ length: count }, (_, index) => laurelLeaf(index)).join('');
  const laurelFrame = (horizontalCount, verticalCount, sizeClass) => `
    <span class="final-laurel-frame ${sizeClass}" aria-hidden="true">
      <span class="final-laurel-rail final-laurel-top">${laurelRail(horizontalCount)}</span>
      <span class="final-laurel-rail final-laurel-right">${laurelRail(verticalCount)}</span>
      <span class="final-laurel-rail final-laurel-bottom">${laurelRail(horizontalCount)}</span>
      <span class="final-laurel-rail final-laurel-left">${laurelRail(verticalCount)}</span>
      <span class="final-laurel-corner final-laurel-corner-tl">${laurelLeaf(0)}</span>
      <span class="final-laurel-corner final-laurel-corner-tr">${laurelLeaf(1)}</span>
      <span class="final-laurel-corner final-laurel-corner-br">${laurelLeaf(0)}</span>
      <span class="final-laurel-corner final-laurel-corner-bl">${laurelLeaf(1)}</span>
    </span>`;
  host.innerHTML = `
    <canvas class="paper-effects" aria-hidden="true"></canvas>
    <div class="paper-vignette" aria-hidden="true"></div>
    <div class="paper-header" aria-live="polite" aria-atomic="true">
      ${laurelFrame(18, 5, 'final-laurel-header')}
      <span class="paper-header-label">Group 組別</span><span class="paper-header-value" data-award-category></span>
    </div>
    <div class="paper-suspense" aria-hidden="true">And the winner is…</div>
    <div class="paper-envelope-glow" aria-hidden="true"></div>
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
    <div class="paper-card-window">
    <div class="paper-card" aria-live="polite" aria-atomic="true">
      ${laurelFrame(36, 12, 'final-laurel-card')}
      <div class="paper-team" data-award-team></div>
      <div class="paper-congrats">恭喜獲獎</div>
    </div>
    </div>
    <div class="final-crowd" aria-hidden="true">
      <div class="final-crowd-fan final-crowd-left final-crowd-one"><div class="final-crowd-bob"><img src="assets/images/clawd-headphones.png" width="924" height="828" alt="" draggable="false"></div></div>
      <div class="final-crowd-fan final-crowd-left final-crowd-two"><div class="final-crowd-bob"><img src="assets/images/clawd-heart.png" width="924" height="702" alt="" draggable="false"></div></div>
      <div class="final-crowd-fan final-crowd-left final-crowd-three"><div class="final-crowd-bob"><img src="assets/images/clawd-wand.png" width="924" height="480" alt="" draggable="false"></div></div>
      <div class="final-crowd-fan final-crowd-left final-crowd-four"><div class="final-crowd-bob"><img src="assets/images/clawd-bubble.png" width="924" height="678" alt="" draggable="false"></div></div>
      <div class="final-crowd-fan final-crowd-right final-crowd-one"><div class="final-crowd-bob"><img src="assets/images/clawd-cape.png" width="798" height="924" alt="" draggable="false"></div></div>
      <div class="final-crowd-fan final-crowd-right final-crowd-two"><div class="final-crowd-bob"><img src="assets/images/clawd-kite.png" width="924" height="876" alt="" draggable="false"></div></div>
      <div class="final-crowd-fan final-crowd-right final-crowd-three"><div class="final-crowd-bob"><img src="assets/images/clawd-lightbulb.png" width="630" height="924" alt="" draggable="false"></div></div>
      <div class="final-crowd-fan final-crowd-right final-crowd-four"><div class="final-crowd-bob"><img src="assets/images/clawd-magnifier.png" width="924" height="834" alt="" draggable="false"></div></div>
    </div>
    <canvas class="paper-stars" aria-hidden="true"></canvas>
    <div class="paper-delivery" aria-hidden="true">
      <div class="paper-helper paper-helper-rear">
        <div class="paper-helper-body">
          <img class="paper-mascot" src="assets/images/clawd-base.png" width="924" height="750" alt="" draggable="false">
        </div>
      </div>
      <svg class="paper-podium" viewBox="0 0 300 118" fill="none">
        <ellipse cx="150" cy="107" rx="143" ry="8" fill="#141413" opacity=".12"/>
        <path d="M14 53 38 38h224l24 15v49H14z" fill="#DEDCD1" stroke="#141413" stroke-width="1.5"/>
        <path d="M14 53h272v49H14z" fill="#F0EEE6"/>
        <path d="M14 53h272M18 101h264" stroke="#B0AEA5" stroke-width="2"/>
        <path d="m99 19 14-10h74l14 10v83H99z" fill="#FAF9F5" stroke="#141413" stroke-width="1.5"/>
        <path d="M99 19h102l-14-10h-74z" fill="#CBCADB"/>
        <path d="M107 95h86" stroke="#B0AEA5"/>
        <text x="150" y="76" text-anchor="middle" fill="#D97757" font-family="Poppins, Arial, sans-serif" font-size="48" font-weight="600">1</text>
      </svg>
      <div class="paper-helper paper-helper-front paper-recipient">
        <div class="paper-helper-body">
          <img class="paper-mascot" src="assets/images/clawd-base.png" width="924" height="750" alt="" draggable="false">
        </div>
      </div>
    </div>
    <div class="paper-presenter" aria-hidden="true">
      <div class="paper-helper-body">
        <img class="paper-mascot" src="assets/images/clawd-base.png" width="924" height="750" alt="" draggable="false">
      </div>
      <svg class="paper-trophy" viewBox="0 0 64 80" fill="none">
        <path d="M18 10H46V30C46 43 40 51 32 51S18 43 18 30V10Z" fill="#D97757" stroke="#141413" stroke-width="2.5"/>
        <path d="M18 17H7V29C7 40 14 44 23 44M46 17H57V29C57 40 50 44 41 44" stroke="#D97757" stroke-width="6" stroke-linejoin="round"/>
        <path d="M32 51V64M23 64H41L45 72H19L23 64Z" stroke="#141413" stroke-width="3" fill="#D97757"/>
        <path d="m32 18 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z" fill="#FAF9F5"/>
      </svg>
    </div>
  `;
  const canvas = host.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const starCanvas = host.querySelector('.paper-stars');
  const starCtx = starCanvas.getContext('2d');
  const category = host.querySelector('[data-award-category]');
  const team = host.querySelector('[data-award-team]');
  const suspense = host.querySelector('.paper-suspense');
  const congrats = host.querySelector('.paper-congrats');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, disposed = false, reduced = motion.matches;
  let width = 0, height = 0, time = 0, elapsed = 0, previous = null, frameId = null;
  const REVEAL_AT = 1.85; // Matches the card's CSS delay; never advances the playlist.
  let seed = 31987;
  const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  const confetti = Array.from({ length: 54 }, () => ({ x: random(), y: random(), phase: random() * 6.28, speed: .5 + random(), size: 9 + random() * 9 }));
  const burst = Array.from({ length: 90 }, () => ({ angle: random() * Math.PI * 2, speed: .07 + random() * .3, delay: random() * .25, size: .4 + random() * 1.7 }));
  // Stars and ribbons share the same Claude palette.
  const colors = ['217,119,87', '98,153,135', '120,140,93', '130,125,189', '203,202,219'];
  const stars = Array.from({ length: 10 }, (_, index) => ({
    origin: (index % 2 ? 1 : -1) * (.105 + random() * .015),
    vx: (index % 2 ? 1 : -1) * (.1 + random() * .2),
    vy: .24 + random() * .2,
    delay: random() * .12,
    lifetime: 1.5 + random() * .6,
    radius: 13 + random() * 5,
    rotation: random() * Math.PI * 2,
    spin: (random() - .5) * 7,
  }));

  // Round each tip and inner corner with a tangent quadratic curve.
  const starPoints = Array.from({ length: 10 }, (_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI / 5;
    const radius = index % 2 ? .44 : 1;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
  const starPath = new Path2D();
  starPoints.forEach((point, index) => {
    const previous = starPoints[(index + 9) % 10];
    const next = starPoints[(index + 1) % 10];
    const roundness = index % 2 ? .18 : .28;
    const entryX = point.x + (previous.x - point.x) * roundness;
    const entryY = point.y + (previous.y - point.y) * roundness;
    const exitX = point.x + (next.x - point.x) * roundness;
    const exitY = point.y + (next.y - point.y) * roundness;
    if (index === 0) starPath.moveTo(entryX, entryY);
    else starPath.lineTo(entryX, entryY);
    starPath.quadraticCurveTo(point.x, point.y, exitX, exitY);
  });
  starPath.closePath();

  function drawStars(revealAge) {
    if (!starCtx) return;
    starCtx.clearRect(0, 0, width, height);
    if (reduced || revealAge < 0 || revealAge > 2.25) return;
    stars.forEach((star, index) => {
      const age = revealAge - star.delay;
      if (age < 0 || age >= star.lifetime) return;
      const progress = age / star.lifetime;
      const travel = (1 - Math.exp(-1.6 * age)) / 1.6;
      // Rise through the opening before spreading outward from either side.
      const outwardAge = Math.max(0, age - .16);
      const outwardTravel = (1 - Math.exp(-1.6 * outwardAge)) / 1.6;
      const x = width * (.5 + star.origin + star.vx * outwardTravel);
      const y = height * .38 + width * (.08 - star.vy * travel + .035 * age * age);
      const radius = star.radius * width / 1600 * (1 - .3 * progress);
      const fade = Math.min(1, age / .06) * Math.min(1, (1 - progress) / .4);
      starCtx.save();
      starCtx.translate(x, y);
      starCtx.rotate(star.rotation + star.spin * age);
      starCtx.fillStyle = `rgba(${colors[index % colors.length]},${fade * .95})`;
      starCtx.scale(radius, radius);
      starCtx.fill(starPath);
      starCtx.restore();
    });
  }

  function applyBilingualCopy() {
    suspense.innerHTML = '<span class="copy-zh">得獎的是…</span><span class="copy-en" lang="en">And the winner is…</span>';
    congrats.innerHTML = '<span class="copy-zh">恭喜獲獎</span><span class="copy-en" lang="en">Congratulations</span>';
  }

  function fitText() {
    if (disposed || !width || !height) return;
    for (const [element, ratio, maxHeight] of [[category, .04, .14], [team, .065, .16]]) {
      let size = width * ratio;
      element.style.fontSize = `${size}px`;
      while (size > 1 && (element.scrollWidth > element.clientWidth + 1 || element.offsetHeight > height * maxHeight)) {
        size = Math.max(1, size - .5);
        element.style.fontSize = `${size}px`;
      }
    }
  }

  function draw() {
    if (!ctx || !width || !height) return;
    const w = width, h = height, unit = w / 1600;
    const revealAge = host.classList.contains('paper-waiting') ? -1 : reduced ? 8 : elapsed - REVEAL_AT;
    const celebration = reduced ? 1 : Math.min(1, Math.max(0, revealAge));
    drawStars(revealAge);
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    // Broad paper ribbons use only the CwC 2026 Claude palette.
    if (celebration > 0) {
      confetti.forEach((piece, index) => {
        const y = ((piece.y + time * .015 * piece.speed) % 1) * h;
        const x = piece.x * w + Math.sin(time * .5 + piece.phase) * 20 * unit;
        if (x > w * .15 && x < w * .85 && y > h * .19 && y < h * .72) return;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(piece.phase + time * .3);
        ctx.scale(Math.cos(piece.phase + time * .5), 1);
        ctx.fillStyle = `rgba(${colors[index % colors.length]},${celebration * .72})`;
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
    starCanvas.width = canvas.width;
    starCanvas.height = canvas.height;
    starCtx?.setTransform(dpr, 0, 0, dpr, 0, 0);
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
      applyBilingualCopy();
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
      applyBilingualCopy();
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
