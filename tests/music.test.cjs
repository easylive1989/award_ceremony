const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

test('setup audio preferences persist and music restarts on navigation', { timeout: 60000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.waitForFunction(() => window.app?.themeManager.current);
    assert.equal(await page.locator('#music-volume').inputValue(), '35');
    assert(await page.locator('#app #music-toggle').isVisible());
    await page.locator('#music-volume').fill('48');
    await page.locator('#music-volume').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#music-volume').inputValue(), '49');
    await page.locator('#music-toggle').click();
    assert(await page.locator('audio').evaluate(el => el.paused && el.muted));
    await page.reload();
    await page.waitForFunction(() => window.app?.themeManager.current);
    assert.equal(await page.locator('#music-volume').inputValue(), '49');
    assert(await page.locator('audio').evaluate(el => el.paused && el.muted));
    await page.locator('#music-toggle').click();
    assert(await page.locator('audio').evaluate(el => el.paused && !el.muted));
    await page.locator('#start-btn').click();
    await page.waitForFunction(() => !!document.fullscreenElement);
    assert.equal(await page.locator('#stage button, #stage input, .stage-progress, .stage-controls').count(), 0);
    assert(await page.locator('#app').evaluate(el => el.inert));
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#app').evaluate(el => el.contains(document.activeElement)), false);
    // Decode and play the checked-in MP3 with the volume configured on setup.
    await page.waitForFunction(() => {
      const audio = document.querySelector('audio');
      return !audio.paused && audio.currentTime > .15 && audio.readyState >= 2;
    });
    assert.equal(await page.locator('audio').evaluate(el => el.volume), .49);
    assert.equal(await page.locator('audio').evaluate(el => el.loop), true);
    async function seek() {
      await page.locator('audio').evaluate(el => { el.currentTime = 12; });
      await page.waitForFunction(() => document.querySelector('audio').currentTime >= 12);
    }
    async function restarted() {
      await page.waitForFunction(() => {
        const audio = document.querySelector('audio');
        return !audio.paused && audio.currentTime < 2;
      });
    }
    await page.locator('#stage').click({ position: { x: 800, y: 460 } });
    assert.equal(await page.evaluate(() => app.currentIndex), 0);
    await seek();
    await page.locator('#stage').click({ position: { x: 800, y: 460 } });
    await restarted();
    assert.equal(await page.evaluate(() => app.currentIndex), 1);
    await seek();
    await page.keyboard.press('ArrowLeft');
    await restarted();
    assert.equal(await page.evaluate(() => app.currentIndex), 0);
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.evaluate(() => app.currentIndex), 3);
    await seek();
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => app.currentIndex), 3);
    assert(await page.locator('audio').evaluate(el => el.currentTime >= 12));
    await page.keyboard.press('Space');
    await restarted();
    assert.equal(await page.evaluate(() => app.currentIndex), 0);
    await seek();
    await page.evaluate(() => app.changeTheme('neon'));
    assert(await page.locator('audio').evaluate(el => el.currentTime >= 12 && !el.paused));
    await page.locator('audio').evaluate(el => { el.currentTime = el.duration - .15; });
    await restarted();
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.fullscreenElement);
    assert(await page.locator('audio').evaluate(el => el.paused && el.currentTime === 0));
    assert.equal(await page.locator('#app').evaluate(el => el.inert), false);
    assert(await page.locator('#music-toggle').isVisible());
    // A failed playback attempt must not prevent navigation or returning to setup.
    await page.evaluate(() => {
      const audio = document.querySelector('audio');
      audio.originalPlay = audio.play;
      audio.play = () => Promise.reject(new DOMException('Test blocked playback', 'NotAllowedError'));
    });
    await page.locator('#start-btn').click();
    await page.waitForFunction(() => !!document.fullscreenElement);
    await page.waitForFunction(() => document.getElementById('music-status').textContent.length > 0);
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => app.currentIndex), 1);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.fullscreenElement);
    await page.evaluate(() => { const audio = document.querySelector('audio'); audio.play = audio.originalPlay; });
    await page.locator('#start-btn').click();
    await page.waitForFunction(() => !!document.fullscreenElement);
    await restarted();
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.fullscreenElement);
    await page.waitForTimeout(200);
    assert(await page.locator('audio').evaluate(el => el.paused && el.currentTime === 0));
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
