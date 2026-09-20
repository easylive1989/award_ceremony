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

async function waitForStage(page, themeId) {
  await page.waitForFunction(id => (
    app.themeManager.current?.id === id
    && document.getElementById('stage').getAttribute('aria-busy') === 'false'
  ), themeId);
}

test('each award keeps its own stage appearance and themes clean up when replaced', { timeout: 90000 }, async () => {
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
        { id: '1', category: 'Delight', team: 'ABc', themeId: 'black-gold' },
        { id: '2', category: '創新組', team: '星際探索隊', themeId: 'neon' },
      ]));
    });
    await page.reload();
    await page.waitForFunction(() => window.app?.themeManager.current);

    assert.equal(await page.locator('#theme-select').count(), 0);
    assert.equal(await page.locator('.item-index').count(), 0);
    assert.deepEqual(await page.locator('.award-theme-select').evaluateAll(selects => selects.map(select => select.value)), ['black-gold', 'neon']);
    assert.deepEqual(await page.evaluate(() => app.awards.map(({ id, themeId }) => ({ id, themeId }))), [
      { id: '1', themeId: 'black-gold' },
      { id: '2', themeId: 'neon' },
    ]);

    await startContinuousPresentation(page);
    await page.waitForFunction(() => !!document.fullscreenElement);
    await waitForStage(page, 'black-gold');
    assert.equal(await page.locator('[data-award-team]').textContent(), 'ABc');
    assert.equal(await page.locator('[data-award-theme-style]').count(), 1);
    await page.locator('#stage').click({ position: { x: 800, y: 460 } });
    assert.equal(await page.evaluate(() => app.themeManager.revealed), true);
    await page.locator('#stage').click({ position: { x: 800, y: 460 } });
    await waitForStage(page, 'neon');
    assert.equal(await page.locator('[data-award-team]').textContent(), '星際探索隊');
    assert.equal(await page.evaluate(() => app.themeManager.revealed), false);
    assert.equal(await page.locator('[data-award-theme-style]').count(), 1);
    await page.keyboard.press('ArrowLeft');
    await waitForStage(page, 'black-gold');
    assert.equal(await page.locator('[data-award-team]').textContent(), 'ABc');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.fullscreenElement);
    assert.equal(await page.evaluate(() => pendingAnimationFrames.size), 0);

    await page.locator('.award-theme-select').first().selectOption('claude-paper');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('award_ceremony_data'))[0].themeId), 'claude-paper');
    await page.locator('.test-award-btn').first().click();
    await waitForStage(page, 'claude-paper');
    assert.equal(await page.locator('[data-award-team]').textContent(), 'ABc');
    await page.keyboard.press('Escape');

    // Slower, earlier loads must not replace the latest request or leak stylesheets.
    await page.evaluate(async () => {
      await Promise.all([app.changeTheme('neon'), app.changeTheme('black-gold'), app.changeTheme('neon')]);
    });
    assert.equal(await page.evaluate(() => app.themeManager.current.id), 'neon');
    assert.equal(await page.locator('[data-award-theme-style]').count(), 1);
    assert.equal(await page.locator('.theme-surface').count(), 1);
    assert.match(await page.evaluate(() => app.themeManager.current.stylesheet.href), /[?&]v=20260920-per-award-theme-1(?:&|$)/);

    // Broken assets leave the current working appearance available.
    const applied = await page.evaluate(async () => {
      app.themeManager.catalog.themes.push({ id: 'broken', name: 'Broken', stylesheet: 'missing.css', script: 'missing.js' });
      return app.changeTheme('broken');
    });
    assert.equal(applied, false);
    assert.equal(await page.evaluate(() => app.themeManager.current.id), 'neon');
    assert.equal(await page.locator('[data-award-theme-style]').count(), 1);
    assert.equal(await page.locator('.play-award-btn').first().isEnabled(), true);
    assert.equal(await page.locator('.test-award-btn').first().isEnabled(), true);

    // A removed per-award appearance falls back to the catalog default and is migrated.
    await page.evaluate(() => {
      const awards = JSON.parse(localStorage.getItem('award_ceremony_data'));
      awards[0].themeId = 'removed-theme';
      localStorage.setItem('award_ceremony_data', JSON.stringify(awards));
    });
    await page.reload();
    await page.waitForFunction(() => window.app?.themeManager.current?.id === 'black-gold');
    assert.equal(await page.locator('.award-theme-select').first().inputValue(), 'black-gold');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('award_ceremony_data'))[0].themeId), 'black-gold');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('.award-theme-select').first().selectOption('neon');
    await page.locator('.test-award-btn').first().click();
    await waitForStage(page, 'neon');
    await page.evaluate(() => app.themeManager.update({
      category: '全國高中職跨領域創新與永續設計競賽組',
      team: '<img src=x onerror=alert(1)>這是一個長隊伍名稱測試',
    }));
    assert.equal(await page.locator('[data-award-team] img').count(), 0);
    assert(await page.locator('[data-award-team]').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
    await page.keyboard.press('Escape');
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
