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
    await page.waitForFunction(id => app.themeManager.current.id === id && !document.querySelector('.play-award-btn').disabled, themeId);
    if (themeId === 'claude-paper') {
      assert.equal(await page.locator('#theme-select option[value="claude-paper"]').textContent(), 'Claude');
      assert.equal(await page.locator('[data-theme="claude-paper"]').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(250, 249, 245)');
      assert.equal(await page.locator('.paper-header').evaluate(el => getComputedStyle(el).textAlign), 'center');
      assert.equal(await page.locator('.paper-category-label').count(), 0);
      assert.notEqual(await page.locator('.paper-header').evaluate(el => getComputedStyle(el).borderTopWidth), '0px');
      assert(await page.locator('.paper-header').evaluate(el => parseFloat(getComputedStyle(el).borderRadius) > 0));
      assert.equal(await page.locator('.paper-header').evaluate(el => getComputedStyle(el, '::before').content), 'none');
      assert.equal(await page.locator('.paper-header-label').textContent(), 'Group 組別');
      assert(await page.locator('.paper-header-value').evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 48));
      assert(await page.locator('.paper-suspense').evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 24));
      assert.match(await page.locator('.paper-header-value').evaluate(el => getComputedStyle(el).fontFamily), /Poppins/);
      assert.match(await page.locator('.paper-team').evaluate(el => getComputedStyle(el).fontFamily), /Lora/);
      assert.equal(await page.locator('.paper-envelope-back').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(240, 238, 230)');
      assert.equal(await page.locator('.paper-seal').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(217, 119, 87)');
      assert.equal(await page.locator('.paper-vignette').evaluate(el => getComputedStyle(el).display), 'none');
      assert.notEqual(await page.locator('[data-theme="claude-paper"]').evaluate(el => getComputedStyle(el).backgroundImage), 'none');
      assert.equal(await page.locator('.paper-envelope-glow').count(), 1);
      assert(await page.locator('.paper-envelope-glow').evaluate(el => Number(getComputedStyle(el).zIndex))
        < await page.locator('.paper-envelope').evaluate(el => Number(getComputedStyle(el).zIndex)));
    }
    const stored = await page.evaluate(() => localStorage.getItem('award_ceremony_data'));
    await startContinuousPresentation(page);
    await page.waitForFunction(() => !!document.fullscreenElement);
      assert.equal(await page.locator('#stage button, #stage input, .stage-progress, .stage-controls').count(), 0);
    // Waiting longer than the complete animation must not reveal the winner.
    await page.waitForTimeout(4300);
    assert.equal(await page.locator(`.${prefix}-card`).isVisible(), false);
    assert.equal(await page.locator(`.${prefix}-envelope`).evaluate(el => Number(getComputedStyle(el).opacity)), 1);
    assert.equal(await page.locator(`.${prefix}-flap`).evaluate(el => new DOMMatrix(getComputedStyle(el).transform).isIdentity), true);
    assert.equal(await page.evaluate(() => app.themeManager.revealed), false);
    if (themeId === 'claude-paper') {
      assert(await page.locator('.paper-delivery').evaluate(el => el.getBoundingClientRect().right < 0));
      assert(await page.locator('.paper-envelope-glow').evaluate(el => Number(getComputedStyle(el).opacity) > 0));
    }
    await page.locator('#stage').click({ position: { x: 800, y: 450 } });
    assert.equal(await page.evaluate(() => String(app.currentIndex + 1)), '1');
    await page.waitForTimeout(600);
    assert.equal(await page.locator('[data-award-category]').textContent(), 'Delight');
    assert.equal(await page.locator(`.${prefix}-card [data-award-category]`).count(), 0);
    assert(await page.locator(`.${prefix}-header`).isVisible());
    assert.equal(await page.locator(`.${prefix}-card`).evaluate(el => Number(getComputedStyle(el).opacity)), 0);
    assert.equal(await page.locator(`.${prefix}-seal`).evaluate(el => Number(getComputedStyle(el).opacity)), 1);
    assert.equal(await page.locator(`.${prefix}-envelope`).evaluate(el => Number(getComputedStyle(el).opacity)), 1);
    if (themeId === 'claude-paper') {
      assert(await page.locator('.paper-header').evaluate(el => Number(getComputedStyle(el).zIndex))
        > await page.locator('.paper-envelope-front').evaluate(el => Number(getComputedStyle(el).zIndex)));
      assert.match(await page.locator('.paper-envelope-glow').evaluate(el => getComputedStyle(el).animationName), /claudePaperGlowBurst/);
    }
    if (process.env.AWARD_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.AWARD_SCREENSHOT_DIR, `${themeId}-closed.png`) });
    await page.waitForTimeout(1250);
    if (process.env.AWARD_SCREENSHOT_DIR && themeId === 'claude-paper') await page.screenshot({ path: path.join(process.env.AWARD_SCREENSHOT_DIR, `${themeId}-burst.png`) });
    await page.waitForTimeout(450);
    // The small card is still inside the opening and behind the opaque front pocket.
    assert(await page.locator(`.${prefix}-card`).evaluate((card, prefix) => {
      const front = card.closest('.theme-surface').querySelector(`.${prefix}-envelope-front`);
      const c = card.getBoundingClientRect(), f = front.getBoundingClientRect();
      return c.width < f.width && c.bottom > f.top && c.bottom < f.bottom
        && Number(getComputedStyle(card).zIndex) < Number(getComputedStyle(front).zIndex)
        && getComputedStyle(card.parentElement).clipPath !== 'none';
    }, prefix));
    if (process.env.AWARD_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.AWARD_SCREENSHOT_DIR, `${themeId}-opening.png`) });
    await page.waitForTimeout(2200);
    assert(await page.locator(`.${prefix}-card`).evaluate(el => {
      const transform = getComputedStyle(el).transform;
      return transform === 'none' || new DOMMatrix(transform).isIdentity;
    }));
    assert.equal(await page.locator(`.${prefix}-card`).evaluate(el => Number(getComputedStyle(el).opacity)), 1);
    assert.equal(await page.locator(`.${prefix}-envelope`).evaluate(el => Number(getComputedStyle(el).opacity)), 0);
    assert.equal(await page.locator(`.${prefix}-seal`).evaluate(el => Number(getComputedStyle(el).opacity)), 0);
    assert.equal(await page.locator(`.${prefix}-envelope-front`).evaluate(el => Number(getComputedStyle(el).opacity)), 0);
    if (themeId === 'claude-paper') {
      assert.equal(await page.locator('.paper-envelope-glow').evaluate(el => Number(getComputedStyle(el).opacity)), 0);
      assert(await page.locator('.paper-podium').evaluate(el => {
        const podium = el.getBoundingClientRect(), stage = el.closest('.theme-surface').getBoundingClientRect();
        const card = el.closest('.theme-surface').querySelector('.paper-card').getBoundingClientRect();
        return Math.abs(podium.x + podium.width / 2 - stage.x - stage.width / 2) < 1 && podium.top > card.bottom && Math.abs(podium.bottom - innerHeight) < 1;
      }));
    }
    assert.equal(await page.locator('[data-award-team]').textContent(), 'ABc');
    assert.equal(await page.locator('[data-award-category]').textContent(), 'Delight');
    assert(await page.locator(`.${prefix}-header`).isVisible());
    if (process.env.AWARD_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.AWARD_SCREENSHOT_DIR, `${themeId}-revealed.png`) });
    assert.equal(await page.evaluate(() => pendingFrames.size), 1);
    if (themeId === 'claude-paper') {
      await page.waitForTimeout(3000);
      assert(await page.locator('.paper-recipient').evaluate(el => {
        const person = el.getBoundingClientRect(), podium = el.parentElement.querySelector('.paper-podium').getBoundingClientRect();
        return Math.abs(person.x + person.width / 2 - podium.x - podium.width / 2) < 1 && person.bottom < podium.top + 10;
      }));
      assert(await page.locator('.paper-trophy').evaluate(el => {
        const trophy = el.getBoundingClientRect(), recipient = el.closest('.theme-surface').querySelector('.paper-recipient').getBoundingClientRect();
        return Math.abs(trophy.x - recipient.right) < recipient.width / 2 && trophy.bottom < recipient.bottom;
      }));
      assert.equal(await page.locator('.paper-footer').count(), 0);
      assert.equal(await page.locator('[data-award-team]').textContent(), 'ABc');
    }

    await page.locator('audio').evaluate(el => { el.currentTime = 15; });
    await page.locator('#stage').click({ position: { x: 800, y: 450 } });
    assert.equal(await page.locator('[data-award-team]').textContent(), '星際探索隊');
    assert.equal(await page.locator('[data-award-category]').textContent(), '創新設計組');
    assert(await page.locator(`.${prefix}-header`).isVisible());
    assert.equal(await page.locator(`.${prefix}-card`).evaluate(el => Number(getComputedStyle(el).opacity)), 0);
    assert(await page.locator('audio').evaluate(el => el.currentTime < 2));
    assert.equal(await page.locator(`.${prefix}-envelope`).evaluate(el => Number(getComputedStyle(el).opacity)), 1);
    // Interrupt the reveal repeatedly: only the latest winner should be shown.
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator(`.${prefix}-card`).isVisible(), false);
    if (themeId === 'claude-paper') assert(await page.locator('.paper-delivery').evaluate(el => el.getBoundingClientRect().right < 0));
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
    await startContinuousPresentation(page);
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
    if (themeId === 'claude-paper') {
      assert(await page.locator('.paper-mascot').evaluateAll(images => images.length === 3 && images.every(el => el.tagName === 'IMG' && el.complete && el.naturalWidth === 924)));
      assert.equal(await page.locator('.paper-delivery').isVisible(), false);
      assert.equal(await page.locator('.paper-presenter').isVisible(), false);
    }
    assert.equal(await page.evaluate(() => localStorage.getItem('award_ceremony_data')), stored);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

}
