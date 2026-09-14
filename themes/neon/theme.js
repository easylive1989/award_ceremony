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
  let disposed = false;

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
      category.textContent = award.category;
      team.textContent = award.team;
      host.classList.remove('neon-enter');
      host.classList.add('neon-waiting');
      fit();
    },
    update(award) {
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
