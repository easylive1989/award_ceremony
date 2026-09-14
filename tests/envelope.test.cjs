const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

test('envelope theme conceals, reveals, and replays each winner', { timeout: 60000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
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
    await page.selectOption('#theme-select', 'black-gold-v2');
    await page.waitForFunction(() => app.themeManager.current.id === 'black-gold-v2' && !app.startBtn.disabled);
    const stored = await page.evaluate(() => localStorage.getItem('award_ceremony_data'));
    await page.locator('#start-btn').click();
    await page.waitForFunction(() => !!document.fullscreenElement);
    await page.waitForTimeout(600);
    assert.equal(await page.locator('.v2-card').evaluate(el => Number(getComputedStyle(el).opacity)), 0);
    assert.equal(await page.locator('.v2-seal').evaluate(el => Number(getComputedStyle(el).opacity)), 1);
    if (process.env.AWARD_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.AWARD_SCREENSHOT_DIR, 'envelope-closed.png') });
    await page.waitForTimeout(1700);
    if (process.env.AWARD_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.AWARD_SCREENSHOT_DIR, 'envelope-opening.png') });
    await page.waitForTimeout(2200);
    assert(await page.locator('.v2-card').evaluate(el => {
      const transform = getComputedStyle(el).transform;
      return transform === 'none' || new DOMMatrix(transform).isIdentity;
    }));
    assert.equal(await page.locator('.v2-card').evaluate(el => Number(getComputedStyle(el).opacity)), 1);
    assert.equal(await page.locator('.v2-seal').evaluate(el => Number(getComputedStyle(el).opacity)), 0);
    assert.equal(await page.locator('[data-award-team]').textContent(), 'ABc');
    if (process.env.AWARD_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.AWARD_SCREENSHOT_DIR, 'envelope-revealed.png') });
    assert.equal(await page.evaluate(() => pendingFrames.size), 1);

    await page.locator('audio').evaluate(el => { el.currentTime = 15; });
    await page.locator('#stage').click({ position: { x: 800, y: 450 } });
    assert.equal(await page.locator('[data-award-team]').textContent(), '星際探索隊');
    assert.equal(await page.locator('.v2-card').evaluate(el => Number(getComputedStyle(el).opacity)), 0);
    assert(await page.locator('audio').evaluate(el => el.currentTime < 2));
    // Interrupt the reveal repeatedly: only the latest winner should be shown.
    await page.locator('#prev-btn').click();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(4100);
    assert.equal(await page.locator('[data-award-team]').textContent(), '星際探索隊');
    assert.equal(await page.locator('.v2-card').evaluate(el => Number(getComputedStyle(el).opacity)), 1);

    await page.evaluate(() => app.changeTheme('neon'));
    assert.equal(await page.evaluate(() => pendingFrames.size), 0);
    assert.equal(await page.locator('.v2-envelope').count(), 0);
    await page.evaluate(() => app.changeTheme('black-gold-v2'));
    assert.equal(await page.evaluate(() => pendingFrames.size), 1);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.fullscreenElement);
    assert.equal(await page.evaluate(() => pendingFrames.size), 0);

    // Reduced motion goes directly to the open envelope and final card.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => { document.documentElement.requestFullscreen = () => Promise.reject(new Error('Test fallback')); });
    await page.locator('#start-btn').click();
    await page.evaluate(() => app.themeManager.update({ category: '全國高中職跨領域創新永續設計競賽組', team: '<script>測試</script>這是一個非常長的隊伍名稱' }));
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => pendingFrames.size), 0);
    assert.equal(await page.locator('.v2-card').evaluate(el => Number(getComputedStyle(el).opacity)), 1);
    assert(await page.locator('[data-award-team]').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
    assert(await page.locator('.v2-card').evaluate(el => el.scrollHeight <= el.clientHeight + 1));
    assert.equal(await page.locator('[data-award-team] script').count(), 0);
    assert.equal(await page.evaluate(() => localStorage.getItem('award_ceremony_data')), stored);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
