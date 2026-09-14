const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

for (const [themeId, prefix] of [['black-gold-v2', 'v2'], ['claude-paper', 'paper']]) {
test(`${themeId} conceals, reveals, and replays each winner`, { timeout: 90000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.addInitScript(() => {
      const request = requestAnimationFrame.bind(window);
      const cancel = cancelAnimationFrame.bind(window);
      window.pendingFrames = new Set();
      window.requestAnimationFrame = callback => {
        const id = request(time => { pendingFrames.delete(id); callback(time); });
        pendingFrames.add(id);
        return id;
      };
      window.cancelAnimationFrame = id => { pendingFrames.delete(id); cancel(id); };
    });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.waitForFunction(() => window.app?.themeManager.current);
    await page.evaluate(() => {
      localStorage.setItem('award_ceremony_data', JSON.stringify([
        { id: 'a', category: 'Delight', team: 'ABc' },
        { id: 'b', category: '創新設計組', team: '星際探索隊' },
      ]));
    });
    await page.reload();
    await page.waitForFunction(() => window.app?.themeManager.current);
    await page.selectOption('#theme-select', themeId);
    await page.waitForFunction(id => app.themeManager.current.id === id && !app.startBtn.disabled, themeId);
    const stored = await page.evaluate(() => localStorage.getItem('award_ceremony_data'));
    await page.locator('#start-btn').click();
    await page.waitForFunction(() => !!document.fullscreenElement);
    // Waiting longer than the complete animation must not reveal the winner.
    await page.waitForTimeout(4300);
    assert.equal(await page.locator(`.${prefix}-card`).isVisible(), false);
    assert.equal(await page.locator(`.${prefix}-envelope`).evaluate(el => Number(getComputedStyle(el).opacity)), 1);
    assert.equal(await page.locator(`.${prefix}-flap`).evaluate(el => new DOMMatrix(getComputedStyle(el).transform).isIdentity), true);
    assert.equal(await page.evaluate(() => app.themeManager.revealed), false);
    await page.locator('#stage').click({ position: { x: 800, y: 450 } });
    assert.equal(await page.locator('#current-index-label').textContent(), '1');
    await page.waitForTimeout(600);
    assert.equal(await page.locator(`.${prefix}-header[data-award-category]`).textContent(), 'Delight');
    assert.equal(await page.locator(`.${prefix}-card [data-award-category]`).count(), 0);
    assert(await page.locator(`.${prefix}-header`).isVisible());
    assert.equal(await page.locator(`.${prefix}-card`).evaluate(el => Number(getComputedStyle(el).opacity)), 0);
    assert.equal(await page.locator(`.${prefix}-seal`).evaluate(el => Number(getComputedStyle(el).opacity)), 1);
    assert.equal(await page.locator(`.${prefix}-envelope`).evaluate(el => Number(getComputedStyle(el).opacity)), 1);
    if (process.env.AWARD_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.AWARD_SCREENSHOT_DIR, `${themeId}-closed.png`) });
    await page.waitForTimeout(1700);
    if (process.env.AWARD_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.AWARD_SCREENSHOT_DIR, `${themeId}-opening.png`) });
    await page.waitForTimeout(2200);
    assert(await page.locator(`.${prefix}-card`).evaluate(el => {
      const transform = getComputedStyle(el).transform;
      return transform === 'none' || new DOMMatrix(transform).isIdentity;
    }));
    assert.equal(await page.locator(`.${prefix}-card`).evaluate(el => Number(getComputedStyle(el).opacity)), 1);
    assert.equal(await page.locator(`.${prefix}-envelope`).evaluate(el => Number(getComputedStyle(el).opacity)), 0);
    assert.equal(await page.locator(`.${prefix}-seal`).evaluate(el => Number(getComputedStyle(el).opacity)), 0);
    assert.equal(await page.locator('[data-award-team]').textContent(), 'ABc');
    assert.equal(await page.locator(`.${prefix}-header`).textContent(), 'Delight');
    assert(await page.locator(`.${prefix}-header`).isVisible());
    if (process.env.AWARD_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.AWARD_SCREENSHOT_DIR, `${themeId}-revealed.png`) });
    assert.equal(await page.evaluate(() => pendingFrames.size), 1);

    await page.locator('audio').evaluate(el => { el.currentTime = 15; });
    await page.locator('#stage').click({ position: { x: 800, y: 450 } });
    assert.equal(await page.locator('[data-award-team]').textContent(), '星際探索隊');
    assert.equal(await page.locator(`.${prefix}-header`).textContent(), '創新設計組');
    assert(await page.locator(`.${prefix}-header`).isVisible());
    assert.equal(await page.locator(`.${prefix}-card`).evaluate(el => Number(getComputedStyle(el).opacity)), 0);
    assert(await page.locator('audio').evaluate(el => el.currentTime < 2));
    assert.equal(await page.locator(`.${prefix}-envelope`).evaluate(el => Number(getComputedStyle(el).opacity)), 1);
    // Interrupt the reveal repeatedly: only the latest winner should be shown.
    await page.locator('#prev-btn').click();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator(`.${prefix}-card`).isVisible(), false);
    await page.evaluate(() => document.activeElement.blur());
    await page.keyboard.press('Space');
    await page.waitForTimeout(4100);
    assert.equal(await page.locator('[data-award-team]').textContent(), '星際探索隊');
    assert.equal(await page.locator(`.${prefix}-card`).evaluate(el => Number(getComputedStyle(el).opacity)), 1);
    assert.equal(await page.locator(`.${prefix}-envelope`).evaluate(el => Number(getComputedStyle(el).opacity)), 0);

    await page.evaluate(() => app.changeTheme('neon'));
    assert.equal(await page.evaluate(() => pendingFrames.size), 0);
    assert.equal(await page.locator(`.${prefix}-envelope`).count(), 0);
    await page.evaluate(id => app.changeTheme(id), themeId);
    assert.equal(await page.evaluate(() => pendingFrames.size), 1);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.fullscreenElement);
    assert.equal(await page.evaluate(() => pendingFrames.size), 0);

    // Reduced motion goes directly to the final card with the envelope hidden.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => { document.documentElement.requestFullscreen = () => Promise.reject(new Error('Test fallback')); });
    await page.locator('#start-btn').click();
    await page.evaluate(() => app.themeManager.update({ category: '全國高中職跨領域創新永續設計競賽組', team: '<script>測試</script>這是一個非常長的隊伍名稱' }));
    assert.equal(await page.locator(`.${prefix}-card`).isVisible(), false);
    await page.locator('#stage').click({ position: { x: 180, y: 420 } });
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => pendingFrames.size), 0);
    assert.equal(await page.locator(`.${prefix}-card`).evaluate(el => Number(getComputedStyle(el).opacity)), 1);
    assert.equal(await page.locator(`.${prefix}-envelope`).evaluate(el => Number(getComputedStyle(el).opacity)), 0);
    assert(await page.locator('[data-award-team]').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
    assert(await page.locator(`.${prefix}-header`).evaluate(el => {
      const card = el.parentElement.querySelector('[data-award-team]').parentElement;
      return el.scrollWidth <= el.clientWidth + 1 && el.getBoundingClientRect().bottom < card.getBoundingClientRect().top;
    }));
    assert(await page.locator(`.${prefix}-card`).evaluate(el => el.scrollHeight <= el.clientHeight + 1));
    assert.equal(await page.locator('[data-award-team] script').count(), 0);
    assert.equal(await page.evaluate(() => localStorage.getItem('award_ceremony_data')), stored);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

}
