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
    await page.addInitScript(() => {
      const request = requestAnimationFrame.bind(window), cancel = cancelAnimationFrame.bind(window);
      window.pendingFrames = new Set();
      window.requestAnimationFrame = callback => {
        const id = request(time => { pendingFrames.delete(id); callback(time); });
        pendingFrames.add(id); return id;
      };
      window.cancelAnimationFrame = id => { pendingFrames.delete(id); cancel(id); };
    });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.waitForFunction(() => window.app?.themeManager.current);
    assert.equal(await page.evaluate(() => app.themeManager.catalog.defaultId), 'black-gold');
    await page.locator('.award-theme-select').first().selectOption('dungeon');
    await page.reload();
    await page.waitForFunction(() => window.app?.themeManager.current);
    assert.equal(await page.locator('.award-theme-select').first().inputValue(), 'dungeon');
    await page.locator('.test-award-btn').first().click();
    await page.waitForFunction(() => app.themeManager.current.id === 'dungeon' && document.querySelector('#stage').getAttribute('aria-busy') === 'false');
    await page.waitForFunction(() => document.querySelector('.dt-model')?.dataset.frameTime === '0');
    assert.equal(await page.locator('.dt-no-webgl').count(), 0);
    assert.equal(await page.locator('.dt-model-fallback').isVisible(), false);
    assert.equal(await page.evaluate(() => pendingFrames.size), 0);
    assert.equal(await page.locator('.dt-scroll-flight').isVisible(), false);
    await page.waitForTimeout(4200);
    assert.equal(await page.locator('.dt-scroll-flight').isVisible(), false);
    assert.equal(await page.evaluate(() => app.themeManager.revealed), false);
    await page.keyboard.press('Space');
    await page.waitForTimeout(650);
    assert.equal(await page.locator('.dt-scroll-flight').isVisible(), false);
    assert.equal(await page.locator('.dt-model').getAttribute('data-lid-angle'), '0');
    const groundPosition = await page.locator('.dt-model').getAttribute('data-ground-position');
    const seek = async time => {
      await page.locator('[data-theme="dungeon"]').evaluate((host, time) => {
        host.getAnimations({ subtree: true }).forEach(animation => { animation.pause(); animation.currentTime = time; });
      }, time);
      await page.waitForFunction(time => Math.abs(Number(document.querySelector('.dt-model').dataset.frameTime) - time / 1000) < .001, time);
    };
    // Ground meshes must not inherit the chest's shake or settle transform.
    await seek(870);
    assert.equal(await page.locator('.dt-model').getAttribute('data-ground-position'), groundPosition);
    const hingeTransforms = [];
    for (const time of [1650, 1950, 2400]) {
      await seek(time);
      hingeTransforms.push(Number(await page.locator('.dt-model').getAttribute('data-lid-angle')));
      assert(await page.locator('.dt-chest-light').evaluate(el => Number(getComputedStyle(el).opacity) > .1));
      assert(await page.locator('.dt-opening-glow').evaluate(el => Number(getComputedStyle(el).opacity) > .1));
    }
    assert.equal(new Set(hingeTransforms).size, 3, 'the hinge rotates through intermediate angles');
    assert(hingeTransforms[0] > hingeTransforms[1] && hingeTransforms[1] > hingeTransforms[2], 'one mesh opens continuously around its hinge');
    await seek(3200);
    const halfExtracted = await page.locator('.dt-scroll-flight').boundingBox();
    assert(await page.locator('.dt-scroll-flight').evaluate(el => {
      const host = el.closest('.theme-surface');
      const mouth = host.getBoundingClientRect().top + host.clientHeight * Number(host.querySelector('.dt-model').dataset.mouthY) / 100;
      const card = el.getBoundingClientRect();
      const window = el.parentElement;
      return card.top < mouth && card.bottom > mouth && card.width < host.clientWidth * .21
        && getComputedStyle(window).clipPath !== 'none'
        && Number(getComputedStyle(window).zIndex) > Number(getComputedStyle(host.querySelector('.dt-chest')).zIndex);
    }));
    await seek(3800);
    const extracted = await page.locator('.dt-scroll-flight').boundingBox();
    assert(Math.abs(extracted.width - halfExtracted.width) < 1, 'keep the scroll small until it leaves the mouth');
    assert(await page.locator('.dt-scroll-flight').evaluate(el => {
      const host = el.closest('.theme-surface');
      return el.getBoundingClientRect().bottom < host.getBoundingClientRect().top + host.clientHeight * Number(host.querySelector('.dt-model').dataset.mouthY) / 100;
    }));
    await seek(5100);
    assert((await page.locator('.dt-scroll-flight').boundingBox()).width > extracted.width * 2);
    assert.equal(await page.locator('.dt-model').getAttribute('data-ground-position'), groundPosition);
    assert.equal(await page.locator('.dt-scroll-flight').evaluate(el => getComputedStyle(el).opacity), '1');
    assert.equal(await page.locator('.dt-scroll-copy').evaluate(el => getComputedStyle(el).opacity), '1');
    assert(await page.locator('.dt-parchment').evaluate(el => {
      const clip = getComputedStyle(el).clipPath;
      return clip.startsWith('inset(') && clip.match(/[\d.]+/g).every(value => Number(value) === 0);
    }));
    assert(await page.locator('.dt-header').evaluate(el => el.getBoundingClientRect().bottom < document.querySelector('.dt-scroll').getBoundingClientRect().top));
    const fadingOpacity = Number(await page.locator('.dt-model').getAttribute('data-chest-opacity'));
    assert(fadingOpacity > 0 && fadingOpacity < .5, 'chest is mostly faded after 150ms');
    await seek(5200);
    assert.equal(await page.locator('.dt-model').getAttribute('data-chest-opacity'), '0');
    assert.equal(await page.locator('.dt-model').getAttribute('data-ground-opacity'), '1');
    assert.equal(await page.locator('.dt-model').isVisible(), true);
    assert.equal(await page.locator('.dt-chest-effects').isVisible(), false);
    assert.equal(await page.locator('.dt-scroll-flight').isVisible(), true);
    assert.equal(await page.evaluate(() => pendingFrames.size), 0);

    // Preparing a new award mid-reveal cannot allow the previous animation to leak through.
    await page.evaluate(() => {
      app.themeManager.update({ category: '新獎項', team: '第二支隊伍' });
      app.themeManager.reveal();
    });
    await page.waitForTimeout(300);
    await page.evaluate(() => app.themeManager.update({ category: '最終獎項', team: '第三支隊伍' }));
    assert.equal(await page.locator('.dt-scroll-flight').isVisible(), false);
    assert.equal(await page.locator('[data-award-team]').textContent(), '第三支隊伍');
    assert.equal(await page.locator('.dt-model').getAttribute('data-lid-angle'), '0');
    assert.equal(await page.locator('.dt-chest').isVisible(), true);
    assert.equal(await page.locator('.dt-model').getAttribute('data-chest-opacity'), '1');

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
      assert.equal(await page.locator('.dt-model').getAttribute('data-chest-opacity'), '0');
      assert.equal(await page.locator('.dt-model').getAttribute('data-ground-opacity'), '1');
      assert.equal(await page.locator('.dt-model').isVisible(), true);
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
    assert.equal(await page.evaluate(() => oldDungeon.querySelector('.dt-model').dataset.disposed), 'true');
    assert.equal(await page.evaluate(() => pendingFrames.size), 0);
    assert.equal(await page.evaluate(() => oldDungeon.getAnimations({ subtree: true }).length), 0);
    assert.equal(await page.locator('[data-award-theme-style]').count(), 1);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

test('dungeon still reveals the award when WebGL is unavailable', { timeout: 30000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        return type.startsWith('webgl') ? null : getContext.call(this, type, ...args);
      };
    });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.waitForFunction(() => window.app?.themeManager.current);
    await page.locator('.award-theme-select').first().selectOption('dungeon');
    await page.locator('.test-award-btn').first().click();
    await page.waitForFunction(() => app.themeManager.current.id === 'dungeon');
    assert.equal(await page.locator('.dt-model-fallback').isVisible(), true);
    assert.equal(await page.locator('.dt-scroll-flight').isVisible(), false);
    await page.keyboard.press('Space');
    assert.equal(await page.locator('.dt-scroll-flight').isVisible(), true);
    assert.equal(await page.locator('.dt-model-fallback').isVisible(), false);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
