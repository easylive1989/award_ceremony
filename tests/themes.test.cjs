const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

async function startContinuousPresentation(page) {
  await page.evaluate(() => {
    document.querySelector('.play-award-btn').addEventListener('click', event => {
      event.stopImmediatePropagation();
      app.startPresentation();
    }, { capture: true, once: true });
  });
  await page.locator('.play-award-btn').first().click();
}

test('themes preserve manual presentation and clean up when replaced', { timeout: 90000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.addInitScript(() => {
      const request = window.requestAnimationFrame.bind(window);
      const cancel = window.cancelAnimationFrame.bind(window);
      window.pendingAnimationFrames = new Set();
      window.requestAnimationFrame = callback => {
        const id = request(ms => { pendingAnimationFrames.delete(id); callback(ms); });
        pendingAnimationFrames.add(id);
        return id;
      };
      window.cancelAnimationFrame = id => { pendingAnimationFrames.delete(id); cancel(id); };
    });
    const url = pathToFileURL(path.resolve(__dirname, '../index.html')).href;
    await page.goto(url);
    await page.waitForFunction(() => window.app?.themeManager.current);
    await page.evaluate(() => {
      localStorage.setItem('award_ceremony_data', JSON.stringify([
        { id: '1', category: 'Delight', team: 'ABc' },
        { id: '2', category: '創新組', team: '星際探索隊' },
      ]));
    });
    await page.reload();
    await page.waitForFunction(() => window.app?.themeManager.current);
    const stored = await page.evaluate(() => localStorage.getItem('award_ceremony_data'));
    const setupStyle = await page.locator('.card').evaluate(el => getComputedStyle(el).backgroundColor);

    for (const id of ['black-gold', 'neon', 'black-gold']) {
      await page.selectOption('#theme-select', id);
      await page.waitForFunction(id => app.themeManager.current.id === id && !document.querySelector('.play-award-btn').disabled, id);
      assert.equal(await page.locator('.card').evaluate(el => getComputedStyle(el).backgroundColor), setupStyle);
      assert.equal(await page.locator('[data-award-theme-style]').count(), 1);
      await startContinuousPresentation(page);
      await page.waitForFunction(() => !!document.fullscreenElement);
      assert.equal(await page.locator('#stage button, #stage input, .stage-progress, .stage-controls').count(), 0);
      assert.equal(await page.locator('[data-award-team]').textContent(), 'ABc');
      assert.equal(await page.locator('[data-award-team]').isVisible(), false);
      await page.locator('#stage').click({ position: { x: 800, y: 460 } });
      assert.equal(await page.evaluate(() => String(app.currentIndex + 1)), '1');
      await page.waitForTimeout(2600);
      if (process.env.AWARD_SCREENSHOT_DIR) {
        await page.screenshot({ path: path.join(process.env.AWARD_SCREENSHOT_DIR, `theme-${id}.png`) });
      }
      await page.locator('#stage').click({ position: { x: 800, y: 460 } });
      assert.equal(await page.locator('[data-award-team]').textContent(), '星際探索隊');
      await page.keyboard.press('ArrowLeft');
      assert.equal(await page.locator('[data-award-team]').textContent(), 'ABc');
      await page.keyboard.press('ArrowLeft');
      assert.equal(await page.locator('[data-award-team]').textContent(), '星際探索隊');
      await page.evaluate(() => document.activeElement.blur());
      await page.keyboard.press('Space');
      assert.equal(await page.locator('[data-award-team]').textContent(), '星際探索隊');
      assert.equal(await page.evaluate(() => app.themeManager.revealed), true);
      await page.keyboard.press('Space');
      assert.equal(await page.locator('[data-award-team]').textContent(), 'ABc');
      assert.equal(await page.evaluate(() => app.themeManager.revealed), false);
      assert.equal(await page.locator('#slide-progress').count(), 0);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.fullscreenElement);
      assert.equal(await page.evaluate(() => pendingAnimationFrames.size), 0);
    }

    // Slow earlier loads must not replace the latest selection or leak stylesheets.
    await page.evaluate(async () => {
      await Promise.all([app.changeTheme('neon'), app.changeTheme('black-gold'), app.changeTheme('neon')]);
    });
    assert.equal(await page.locator('#theme-select').inputValue(), 'neon');
    assert.equal(await page.locator('[data-award-theme-style]').count(), 1);
    assert.equal(await page.locator('.theme-surface').count(), 1);
    assert.equal(await page.evaluate(() => pendingAnimationFrames.size), 0);
    assert.equal(await page.evaluate(() => localStorage.getItem('award_ceremony_data')), stored);
    await page.reload();
    await page.waitForFunction(() => window.app?.themeManager.current?.id === 'neon');
    assert.equal(await page.locator('#theme-select').inputValue(), 'neon');
    assert.match(await page.evaluate(() => app.themeManager.current.stylesheet.href), /[?&]v=20260919-preview-2(?:&|$)/);

    // Failed assets keep the previous working theme and leave playback available.
    await page.evaluate(async () => {
      app.themeManager.catalog.themes.push({ id: 'broken', name: 'Broken', stylesheet: 'missing.css', script: 'missing.js' });
      app.themeSelect.add(new Option('Broken', 'broken'));
      await app.changeTheme('broken');
    });
    assert.equal(await page.locator('#theme-select').inputValue(), 'neon');
    assert.equal(await page.locator('[data-award-theme-style]').count(), 1);
    assert.equal(await page.locator('#start-btn').count(), 0);
    assert.equal(await page.locator('.play-award-btn').first().isEnabled(), true);
    assert.equal(await page.locator('.test-award-btn').first().isEnabled(), true);
    assert.match(await page.locator('#theme-status').textContent(), /載入失敗/);

    // A removed saved theme falls back to the catalog default.
    await page.evaluate(() => localStorage.setItem('award_ceremony_theme', 'removed-theme'));
    await page.reload();
    await page.waitForFunction(() => window.app?.themeManager.current?.id === 'black-gold');
    await startContinuousPresentation(page);
    await page.waitForFunction(() => !!document.fullscreenElement);
      assert.equal(await page.locator('#stage button, #stage input, .stage-progress, .stage-controls').count(), 0);
    await page.waitForTimeout(5500);
    assert.equal(await page.locator('[data-award-team]').textContent(), 'ABc');
    assert.equal(await page.evaluate(() => pendingAnimationFrames.size), 1);

    // Switching a visible stage retains the displayed award and releases the canvas loop.
    await page.keyboard.press('ArrowRight');
    await page.evaluate(() => app.changeTheme('neon'));
    assert.equal(await page.locator('[data-award-team]').textContent(), '星際探索隊');
    assert.equal(await page.locator('[data-award-team]').isVisible(), false);
    assert.equal(await page.evaluate(() => pendingAnimationFrames.size), 0);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.fullscreenElement);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => { document.documentElement.requestFullscreen = () => Promise.reject(new Error('Test fallback')); });
    await startContinuousPresentation(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const id of ['neon', 'black-gold']) {
      await page.evaluate(id => app.changeTheme(id), id);
      await page.evaluate(() => app.themeManager.update({
        category: '全國高中職跨領域創新與永續設計競賽組',
        team: '<img src=x onerror=alert(1)>這是一個長隊伍名稱測試',
      }));
      await page.waitForTimeout(150);
      assert.equal(await page.locator('[data-award-team] img').count(), 0);
      assert(await page.locator('[data-award-team]').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
      assert.equal(await page.evaluate(() => pendingAnimationFrames.size), 0);
    }
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.fullscreenElement);
    assert.equal(await page.evaluate(() => localStorage.getItem('award_ceremony_data')), stored);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
