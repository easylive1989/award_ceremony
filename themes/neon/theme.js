// A second, independent layout demonstrates the theme contract.
window.AwardThemes.set('neon', (host) => {
  host.innerHTML = `
    <div class="neon-grid" aria-hidden="true"></div>
    <div class="neon-orbit" aria-hidden="true"></div>
    <div class="neon-topline">THE NEXT BRILLIANT THING <span>AWARDS / 榮耀時刻</span></div>
    <div class="neon-content" aria-live="polite" aria-atomic="true">
      <div class="neon-kicker">✦ EXCELLENCE RECOGNIZED</div>
      <div class="neon-category" data-award-category></div>
      <div class="neon-team" data-award-team></div>
      <div class="neon-rule" aria-hidden="true"></div>
      <div class="neon-congratulations">恭喜獲獎 <span>CONGRATULATIONS</span></div>
    </div>
    <div class="neon-bottomline">BE BOLD. SHINE BRIGHT. <span>每一份熱愛，都值得閃耀。</span></div>
  `;
  const category = host.querySelector('[data-award-category]');
  const team = host.querySelector('[data-award-team]');
  const topline = host.querySelector('.neon-topline');
  const kicker = host.querySelector('.neon-kicker');
  const congratulations = host.querySelector('.neon-congratulations');
  const bottomline = host.querySelector('.neon-bottomline');
  let disposed = false;

  function applyLocale(locale) {
    const english = locale === 'en';
    topline.innerHTML = english ? 'THE NEXT BRILLIANT THING <span>AWARDS</span>' : '下一個閃耀時刻 <span>頒獎典禮</span>';
    kicker.textContent = english ? '✦ EXCELLENCE RECOGNIZED' : '✦ 卓越獲肯定';
    congratulations.innerHTML = english ? 'Congratulations <span>CONGRATULATIONS</span>' : '恭喜獲獎 <span>恭 喜</span>';
    bottomline.innerHTML = english ? 'BE BOLD. SHINE BRIGHT. <span>EVERY PASSION DESERVES TO SHINE.</span>' : '勇敢發光 <span>每一份熱愛，都值得閃耀。</span>';
  }

  function fit() {
    if (disposed || !host.clientWidth) return;
    for (const [element, ratio, height] of [[category, .022, .1], [team, .095, .30]]) {
      let size = host.clientWidth * ratio;
      element.style.fontSize = `${size}px`;
      while (size > 1 && (element.scrollWidth > element.clientWidth + 1 || element.offsetHeight > host.clientHeight * height)) {
        size = Math.max(1, size - .5);
        element.style.fontSize = `${size}px`;
      }
    }
  }
  const observer = new ResizeObserver(fit);
  observer.observe(host);
  const syncVisibility = () => host.classList.toggle('neon-document-hidden', document.hidden);
  document.addEventListener('visibilitychange', syncVisibility);
  syncVisibility();
  document.fonts.ready.then(fit);

  return {
    prepare(award) {
      applyLocale(award.locale);
      category.textContent = award.category;
      team.textContent = award.team;
      host.classList.remove('neon-enter');
      host.classList.add('neon-waiting');
      fit();
    },
    update(award) {
      applyLocale(award.locale);
      host.classList.remove('neon-waiting');
      category.textContent = award.category;
      team.textContent = award.team;
      fit();
      host.classList.remove('neon-enter');
      void host.offsetWidth;
      host.classList.add('neon-enter');
    },
    setVisible(visible) {
      host.classList.toggle('neon-visible', visible);
      if (visible) fit();
    },
    destroy() {
      disposed = true;
      observer.disconnect();
      document.removeEventListener('visibilitychange', syncVisibility);
    },
  };
});
