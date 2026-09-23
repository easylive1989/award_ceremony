const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

test('dungeon waits, opens, unfurls, resets, and cleans up its animations', { timeout: 45000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.waitForFunction(() => window.app?.themeManager.current);
    assert.equal(await page.evaluate(() => app.themeManager.catalog.defaultId), 'black-gold');
    await page.locator('.award-theme-select').first().selectOption('dungeon');
    await page.reload();
    await page.waitForFunction(() => window.app?.themeManager.current);
    assert.equal(await page.locator('.award-theme-select').first().inputValue(), 'dungeon');
    await page.locator('.test-award-btn').first().click();
    await page.waitForFunction(() => app.themeManager.current.id === 'dungeon' && document.querySelector('#stage').getAttribute('aria-busy') === 'false');
    await page.locator('.dt-chest img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    assert.equal(await page.locator('.dt-scroll-flight').isVisible(), false);
    await page.waitForTimeout(4200);
    assert.equal(await page.locator('.dt-scroll-flight').isVisible(), false);
    assert.equal(await page.evaluate(() => app.themeManager.revealed), false);
    await page.keyboard.press('Space');
    await page.waitForTimeout(650);
    assert.equal(await page.locator('.dt-scroll-flight').isVisible(), false);
    assert.equal(await page.locator('.dt-chest-lid').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).isIdentity), true);
    await page.waitForTimeout(1800);
    assert.equal(await page.locator('.dt-chest-lid').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).isIdentity), false);
    assert.equal(await page.locator('.dt-scroll-copy').evaluate(el => getComputedStyle(el).opacity), '0');
    await page.waitForTimeout(1700);
    assert.equal(await page.locator('.dt-scroll-flight').evaluate(el => getComputedStyle(el).opacity), '1');
    assert.equal(await page.locator('.dt-scroll-copy').evaluate(el => getComputedStyle(el).opacity), '1');
    assert(await page.locator('.dt-parchment').evaluate(el => {
      const clip = getComputedStyle(el).clipPath;
      return clip.startsWith('inset(') && clip.match(/[\d.]+/g).every(value => Number(value) === 0);
    }));
    assert(await page.locator('.dt-header').evaluate(el => el.getBoundingClientRect().bottom < document.querySelector('.dt-scroll').getBoundingClientRect().top));

    // Preparing a new award mid-reveal cannot allow the previous animation to leak through.
    await page.evaluate(() => {
      app.themeManager.update({ category: '新獎項', team: '第二支隊伍' });
      app.themeManager.reveal();
    });
    await page.waitForTimeout(300);
    await page.evaluate(() => app.themeManager.update({ category: '最終獎項', team: '第三支隊伍' }));
    assert.equal(await page.locator('.dt-scroll-flight').isVisible(), false);
    assert.equal(await page.locator('[data-award-team]').textContent(), '第三支隊伍');
    assert.equal(await page.locator('.dt-chest-lid').evaluate(el => getComputedStyle(el).transform), 'none');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const viewport of [{ width: 390, height: 844 }, { width: 1920, height: 1080 }]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => app.themeManager.update({
        category: '全國高中職跨領域創新與永續設計競賽特別獎',
        team: '<img src=x onerror=alert(1)>跨領域星際探索冒險團隊',
      }));
      assert.equal(await page.locator('.dt-scroll-flight').isVisible(), false);
      await page.evaluate(() => app.themeManager.reveal());
      assert.equal(await page.locator('.dt-scroll-copy').evaluate(el => getComputedStyle(el).opacity), '1');
      assert.equal(await page.locator('[data-award-team] img').count(), 0);
      assert(await page.locator('[data-award-team]').evaluate(el => {
        const bounds = el.getBoundingClientRect();
        const paper = el.closest('.dt-parchment').getBoundingClientRect();
        const congrats = el.parentElement.querySelector('.dt-congrats').getBoundingClientRect();
        return el.scrollWidth <= el.clientWidth + 1 && bounds.top >= paper.top && congrats.bottom <= paper.bottom;
      }));
      assert(await page.locator('.dt-header').evaluate(el => {
        const category = el.querySelector('[data-award-category]');
        return category.scrollWidth <= category.clientWidth + 1 && el.getBoundingClientRect().bottom < document.querySelector('.dt-scroll').getBoundingClientRect().top;
      }));
      assert.equal(await page.locator('[data-theme="dungeon"]').evaluate(el => el.getAnimations({ subtree: true }).length), 0);
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.keyboard.press('Escape');
    assert(await page.locator('[data-theme="dungeon"]').evaluate(el => el.getAnimations({ subtree: true }).every(animation => animation.playState === 'paused')));
    await page.evaluate(async () => {
      window.oldDungeon = document.querySelector('[data-theme="dungeon"]');
      await app.changeTheme('neon');
    });
    assert.equal(await page.locator('[data-theme="dungeon"]').count(), 0);
    assert.equal(await page.evaluate(() => oldDungeon.getAnimations({ subtree: true }).length), 0);
    assert.equal(await page.locator('[data-award-theme-style]').count(), 1);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
