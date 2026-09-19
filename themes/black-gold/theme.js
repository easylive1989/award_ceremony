// This theme owns its markup, typography and animation resources only.
window.AwardThemes.set('black-gold', (host) => {
  host.innerHTML = `
      <canvas id="stage-particles" aria-hidden="true"></canvas>
      <div class="stage-shade" aria-hidden="true"></div>
      <div class="stage-grain" aria-hidden="true"></div>
      <div class="stage-frame" aria-hidden="true"></div>
      <div class="stage-edition" aria-hidden="true">THE MOMENT<br><span>OF EXCELLENCE</span></div>
      <div class="stage-badge" id="display-badge">榮 耀 時 刻</div>
      <svg class="stage-star" viewBox="0 0 40 40" aria-hidden="true"><path fill="currentColor" d="M20 0 24 16 40 20 24 24 20 40 16 24 0 20 16 16Z"/></svg>
      <div class="stage-ghost" aria-hidden="true">WINNER</div>
      <div class="stage-side" aria-hidden="true">CELEBRATING EXCELLENCE</div>
      <div class="stage-side stage-side-right" aria-hidden="true">CELEBRATING EXCELLENCE</div>
      <div class="presentation-box" aria-live="polite" aria-atomic="true">
        <svg class="stage-emblem" viewBox="0 0 120 130" fill="none" aria-hidden="true">
          <defs><linearGradient id="metal" x1="10" y1="0" x2="110" y2="120" gradientUnits="userSpaceOnUse"><stop stop-color="#9d733d"/><stop offset=".42" stop-color="#fff0b5"/><stop offset=".7" stop-color="#c69747"/><stop offset="1" stop-color="#fff0b5"/></linearGradient></defs>
          <path d="M31 23h58v26c0 20-13 33-29 33S31 69 31 49V23Z" stroke="url(#metal)" stroke-width="2" fill="#ddb76a0d"/>
          <path d="M31 32H18v13c0 14 8 22 23 24M89 32h13v13c0 14-8 22-23 24M60 82v19m-18 9h36m-31-9h26v9H47Z" stroke="url(#metal)" stroke-width="2"/>
          <path d="m60 34 4.8 10 11 1.5-8 7.8 1.9 11L60 59l-9.7 5.3 1.9-11-8-7.8 11-1.5Z" fill="url(#metal)"/>
          <path d="M34 105C16 94 7 78 10 59m76 46c18-11 27-27 24-46" stroke="#ba9857" stroke-width="1"/>
          <g fill="#c1a162"><ellipse cx="15" cy="81" rx="3" ry="7" transform="rotate(-40 15 81)"/><ellipse cx="24" cy="94" rx="3" ry="7" transform="rotate(-45 24 94)"/><ellipse cx="9" cy="65" rx="3" ry="6" transform="rotate(-15 9 65)"/><ellipse cx="105" cy="81" rx="3" ry="7" transform="rotate(40 105 81)"/><ellipse cx="96" cy="94" rx="3" ry="7" transform="rotate(45 96 94)"/><ellipse cx="111" cy="65" rx="3" ry="6" transform="rotate(15 111 65)"/></g>
        </svg>
        <div class="stage-category-row"><div class="award-category-title" id="display-category" data-award-category>得獎組別</div></div>
        <div class="award-winner-team" id="display-team" data-award-team>獲獎隊伍</div>
        <div class="stage-award-message">恭喜獲獎</div>
        <div class="divider" aria-hidden="true"></div>
        <div class="stage-congratulations">CONGRATULATIONS</div>
      </div>
      <div class="stage-footer">每 一 份 熱 愛 ・ 都 值 得 閃 耀</div>
    `;
  const composition = host;
  const presentation = host.querySelector('.presentation-box');
  const category = host.querySelector('[data-award-category]');
  const team = host.querySelector('[data-award-team]');
  const edition = host.querySelector('.stage-edition');
  const badge = host.querySelector('.stage-badge');
  const ghost = host.querySelector('.stage-ghost');
  const sides = host.querySelectorAll('.stage-side');
  const awardMessage = host.querySelector('.stage-award-message');
  const congratulations = host.querySelector('.stage-congratulations');
  const footer = host.querySelector('.stage-footer');
  const canvas = host.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  let visible = false;
  let disposed = false;
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = motionPreference.matches;
  let w = 0, h = 0, time = 0, previous = 0, burstAt = 0, frameId = null;

  function applyLocale(locale) {
    const english = locale === 'en';
    edition.innerHTML = english ? 'THE MOMENT<br><span>OF EXCELLENCE</span>' : '榮 耀<br><span>時 刻</span>';
    badge.textContent = english ? 'THE WINNING MOMENT' : '榮 耀 時 刻';
    ghost.textContent = english ? 'WINNER' : '得獎';
    sides.forEach(side => { side.textContent = english ? 'CELEBRATING EXCELLENCE' : '卓 越 榮 耀'; });
    awardMessage.textContent = english ? 'Congratulations' : '恭喜獲獎';
    congratulations.textContent = english ? 'CONGRATULATIONS' : '恭 喜';
    footer.textContent = english ? 'EVERY PASSION DESERVES TO SHINE' : '每 一 份 熱 愛 ・ 都 值 得 閃 耀';
  }

  function isVisible() {
    return visible && !disposed && !document.hidden;
  }

  function fitText() {
    if (disposed || !w || !h) return;
    // Fit both fields independently; the original app accepts unrestricted text.
    for (const [element, initial, maxHeight] of [
      [category, w * 0.0155, h * 0.09],
      [team, w * 0.074, h * 0.24],
    ]) {
      let size = initial;
      element.style.fontSize = `${size}px`;
      while (size > 1 && (element.scrollWidth > element.clientWidth + 1 || element.offsetHeight > maxHeight)) {
        size = Math.max(1, size - 0.5);
        element.style.fontSize = `${size}px`;
      }
    }
  }

  function resize() {
    const bounds = composition.getBoundingClientRect();
    if (disposed || !bounds.width || !bounds.height) return;
    w = bounds.width;
    h = bounds.height;
    if (ctx) {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    fitText();
  }

  let seed=847;function rnd(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646}
const dust=Array.from({length:230},()=>({x:rnd(),y:rnd(),r:.3+rnd()*1.7,s:.4+rnd(),phase:rnd()*6.28}));
const ribbons=Array.from({length:94},()=>({x:rnd(),y:rnd(),s:.45+rnd(),phase:rnd()*6.28,depth:rnd()}));
const sparks=Array.from({length:145},()=>({angle:rnd()*Math.PI*2,speed:.06+rnd()*.25,delay:rnd()*.4,r:.5+rnd()*1.5}));
function glow(x,y,r,alpha){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(251,222,151,${alpha})`);g.addColorStop(.12,`rgba(218,165,65,${alpha*.6})`);g.addColorStop(1,'rgba(218,165,65,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}
function draw(){
ctx.clearRect(0,0,w,h);ctx.globalCompositeOperation='screen';const u=w/1600;
// Slowly moving theatre lights.
for(let i=0;i<5;i++){const originX=w*(.15+i*.18),endX=w*(.5+Math.sin(time*.11+i*1.7)*.55),spread=w*(.075+i*.01);const g=ctx.createLinearGradient(originX,-h*.08,endX,h*.95);g.addColorStop(0,'rgba(236,213,151,.075)');g.addColorStop(.55,'rgba(204,175,99,.02)');g.addColorStop(1,'rgba(204,175,99,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(originX,-h*.1);ctx.lineTo(endX-spread,h);ctx.lineTo(endX+spread,h);ctx.closePath();ctx.fill()}
glow(w*.5,h*.82,w*.43,.1);glow(w*.5,h*.22,w*.19,.035);
// Fine orbital arcs form a luminous stage below the typography.
for(let k=0;k<7;k++){ctx.save();ctx.translate(w*.5,h*.83);ctx.scale(1,.20+k*.004);ctx.rotate(Math.sin(time*.11+k)*.035);const radius=w*(.21+k*.037);ctx.lineWidth=(k===3?1.3:.65)*u;ctx.strokeStyle=`rgba(215,174,82,${.06+(k===3?.23:.02)})`;ctx.beginPath();ctx.ellipse(0,0,radius,radius,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=`rgba(255,217,135,${.12+(k===3?.32:0)})`;ctx.beginPath();ctx.arc(0,0,radius,time*.14+k*.7,time*.14+k*.7+.55);ctx.stroke();ctx.restore()}
for(const p of dust){const x=(p.x*w+Math.sin(time*.14+p.phase)*20*u),y=((p.y-time*.012*p.s)%1+1)%1*h;const edge=Math.abs(x/w-.5);const alpha=(.2+.5*(.5+.5*Math.sin(time*p.s+p.phase)))*(edge<.25?.35:1);ctx.fillStyle=`rgba(241,206,132,${alpha})`;ctx.beginPath();ctx.arc(x,y,p.r*u,0,6.283);ctx.fill();if(p.r>1.65)glow(x,y,10*u,alpha*.12)}
// Confetti remains around the edges so the winning name stays readable.
for(const p of ribbons){const y=((p.y+time*.018*p.s)%1)*h;let x=p.x*w+Math.sin(time*.35+p.phase)*w*.025;if(x>w*.27&&x<w*.73&&y>h*.24&&y<h*.72)continue;ctx.save();ctx.translate(x,y);ctx.rotate(p.phase+time*.3*p.s);ctx.scale(Math.sin(time*1.2+p.phase),1);ctx.fillStyle=p.depth>.7?'rgba(247,225,169,.6)':'rgba(185,143,65,.38)';ctx.fillRect(-2*u,-4*u,(2+p.depth*3)*u,(5+p.depth*6)*u);ctx.restore()}
const age=time-burstAt;if(age<5&&!reduced){for(const p of sparks){const t=age-p.delay;if(t<0)continue;const fade=Math.max(0,1-t/4);const dist=w*p.speed*t;const x=w*.5+Math.cos(p.angle)*dist,y=h*.51+Math.sin(p.angle)*dist*.68+t*t*6*u;ctx.strokeStyle=`rgba(255,219,140,${fade*.65})`;ctx.lineWidth=p.r*u;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-Math.cos(p.angle)*12*u*fade,y-Math.sin(p.angle)*8*u*fade);ctx.stroke()}}
// A quiet horizon flare.
const line=ctx.createLinearGradient(w*.17,0,w*.83,0);line.addColorStop(0,'#d8ad5500');line.addColorStop(.5,'#f9d68d88');line.addColorStop(1,'#d8ad5500');ctx.fillStyle=line;ctx.fillRect(w*.17,h*.807,w*.66,1*u);glow(w*.5,h*.807,w*.055,.2);ctx.globalCompositeOperation='source-over';
}


  function frame(ms) {
    frameId = null;
    if (!isVisible() || reduced || !ctx) return;
    if (previous) time += Math.min((ms - previous) / 1000, 0.05);
    previous = ms;
    draw();
    frameId = requestAnimationFrame(frame);
  }

  function syncVisibility() {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    previous = 0;
    if (!isVisible()) return;
    resize();
    if (!reduced && ctx) frameId = requestAnimationFrame(frame);
  }


  const observer = new ResizeObserver(resize);
  observer.observe(host);
  document.addEventListener('visibilitychange', syncVisibility);
  const onMotionChange = () => {
    reduced = motionPreference.matches;
    syncVisibility();
  };
  motionPreference.addEventListener('change', onMotionChange);
  document.fonts.ready.then(fitText);

  return {
    prepare(award) {
      applyLocale(award.locale);
      category.textContent = award.category;
      team.textContent = award.team;
      presentation.classList.remove('stage-enter');
      host.classList.add('gold-waiting');
      fitText();
    },
    update(award) {
      applyLocale(award.locale);
      host.classList.remove('gold-waiting');
      category.style.animation = 'none';
      team.style.animation = 'none';
      category.textContent = award.category;
      team.textContent = award.team;
      burstAt = time;
      fitText();
      presentation.classList.remove('stage-enter');
      void presentation.offsetWidth;
      category.style.animation = '';
      team.style.animation = '';
      presentation.classList.add('stage-enter');
      if (ctx && w && h && isVisible()) draw();
    },
    setVisible(value) {
      visible = value;
      syncVisibility();
    },
    destroy() {
      disposed = true;
      visible = false;
      if (frameId !== null) cancelAnimationFrame(frameId);
      observer.disconnect();
      document.removeEventListener('visibilitychange', syncVisibility);
      motionPreference.removeEventListener('change', onMotionChange);
    },
  };
});
