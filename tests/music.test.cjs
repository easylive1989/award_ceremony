const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

test('music restarts on navigation, loops, and stops on exit', { timeout: 60000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    const url = pathToFileURL(path.resolve(__dirname, '../index.html')).href;
    await page.goto(url);
    await page.waitForFunction(() => window.app?.themeManager.current);
    assert(await page.locator('audio').evaluate(el => el.paused));
    await page.locator('#start-btn').click();
    await page.waitForFunction(() => !!document.fullscreenElement);
    // Decode and play the actual checked-in MP3, not a mocked media element.
    await page.waitForFunction(() => {
      const audio = document.querySelector('audio');
      return !audio.paused && audio.currentTime > .15 && audio.readyState >= 2;
    });
    assert.equal(await page.locator('audio').evaluate(el => el.volume), .35);
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
    await seek();
    await page.locator('#stage').click({ position: { x: 800, y: 460 } });
    await restarted();
    assert.equal(await page.locator('#current-index-label').textContent(), '2');
    await seek();
    await page.locator('#prev-btn').click();
    await restarted();
    assert.equal(await page.locator('#current-index-label').textContent(), '1');
    await seek();
    await page.keyboard.press('ArrowLeft');
    await restarted();
    assert.equal(await page.locator('#current-index-label').textContent(), '4');
    await seek();
    await page.evaluate(() => document.activeElement.blur());
    await page.keyboard.press('Space');
    await restarted();
    assert.equal(await page.locator('#current-index-label').textContent(), '1');

    // Theme replacement and audio controls leave the current track position intact.
    await seek();
    await page.evaluate(() => app.changeTheme('neon'));
    assert(await page.locator('audio').evaluate(el => el.currentTime >= 12 && !el.paused));
    await page.locator('#music-toggle').click();
    assert(await page.locator('audio').evaluate(el => el.muted));
    assert.equal(await page.locator('#current-index-label').textContent(), '1');
    await page.locator('#music-volume').fill('48');
    await page.locator('#music-volume').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#music-volume').inputValue(), '49');
    assert.equal(await page.locator('#current-index-label').textContent(), '1');
    assert(await page.locator('audio').evaluate(el => !el.muted && el.currentTime >= 12));

    // Verify real media looping around the end of the track.
    await page.locator('audio').evaluate(el => { el.currentTime = el.duration - .15; });
    await restarted();
    await page.locator('#exit-fullscreen-btn').click();
    await page.waitForFunction(() => !document.fullscreenElement);
    assert(await page.locator('audio').evaluate(el => el.paused && el.currentTime === 0));
    await page.reload();
    await page.waitForFunction(() => window.app?.themeManager.current);
    assert.equal(await page.locator('#music-volume').inputValue(), '49');

    // A rejected play request has a visible, user-activated retry without blocking slides.
    await page.evaluate(() => {
      const audio = document.querySelector('audio');
      audio.originalPlay = audio.play;
      audio.play = () => Promise.reject(new DOMException('Test blocked playback', 'NotAllowedError'));
    });
    await page.locator('#start-btn').click();
    await page.waitForFunction(() => !!document.fullscreenElement);
    await page.waitForFunction(() => document.getElementById('music-status').textContent.length > 0);
    await page.locator('#next-btn').click();
    assert.equal(await page.locator('#current-index-label').textContent(), '2');
    await page.evaluate(() => { const audio = document.querySelector('audio'); audio.play = audio.originalPlay; });
    await page.locator('#music-toggle').click();
    await page.waitForFunction(() => !document.querySelector('audio').paused);
    assert.equal(await page.locator('#music-status').textContent(), '');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.fullscreenElement);

    // Finishing immediately after starting must not let a delayed promise restart audio.
    await page.locator('#start-btn').click();
    await page.locator('#exit-fullscreen-btn').click();
    await page.waitForTimeout(200);
    assert(await page.locator('audio').evaluate(el => el.paused && el.currentTime === 0));
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
