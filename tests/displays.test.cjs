const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

test('detects displays and requests fullscreen on the selected screen', { timeout: 30000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.addInitScript(() => {
      const screens = [
        { label: 'Built-in Display', left: 0, top: 0, width: 1600, height: 900, isPrimary: true },
        { label: 'Projector', left: 1600, top: 0, width: 1920, height: 1080, isPrimary: false },
      ];
      window.__testScreens = screens;
      window.getScreenDetails = async () => ({ screens, currentScreen: screens[0], addEventListener() {} });
      Element.prototype.requestFullscreen = function (options) {
        window.__fullscreenTarget = options?.screen || null;
        return Promise.resolve();
      };
    });

    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.waitForFunction(() => window.app?.themeManager.current);
    assert.equal(await page.locator('.form-card #start-btn').count(), 0);
    assert.equal(await page.locator('.appearance-settings > .theme-settings + .music-settings').count(), 1);
    assert.equal(await page.locator('.music-settings').evaluate(el => getComputedStyle(el).borderTopWidth), '0px');
    await page.locator('#toggle-award-list-btn').click();
    assert.equal(await page.locator('#award-list-content').isVisible(), true);
    assert.equal(await page.locator('.award-item').first().isVisible(), true);
    assert.equal(await page.locator('.award-item').first().locator('.input-group').first().isVisible(), true);
    assert.equal(await page.locator('.team-input-group').first().isVisible(), false);
    assert.equal(await page.locator('.play-award-btn').first().isVisible(), true);
    assert.equal(await page.locator('#toggle-award-list-btn').getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator('#toggle-award-list-btn').textContent(), '顯示隊伍名稱');
    await page.locator('#toggle-award-list-btn').click();
    assert.equal(await page.locator('.team-input-group').first().isVisible(), true);
    assert.match(await page.locator('#display-status').textContent(), /偵測螢幕/);
    await page.locator('#detect-displays-btn').click();
    assert.equal(await page.locator('#display-select option').count(), 2);
    assert.match(await page.locator('#display-select option').nth(0).textContent(), /Built-in Display · 1600×900（目前使用、主螢幕）/);
    assert.match(await page.locator('#display-select option').nth(1).textContent(), /Projector · 1920×1080/);
    await page.selectOption('#display-select', '1');
    await page.locator('.play-award-btn').nth(1).click();
    assert.equal(await page.evaluate(() => window.__fullscreenTarget === window.__testScreens[1]), true);
    assert.equal(await page.evaluate(() => app.presentationAwards.length), 1);
    assert.deepEqual(await page.evaluate(() => ({
      category: app.presentationAwards[0].category,
      team: app.presentationAwards[0].team,
    })), { category: 'Everyday', team: '' });
    await page.locator('#stage').click();
    assert.equal(await page.evaluate(() => app.themeManager.revealed), true);
    await page.locator('#stage').click();
    assert.equal(await page.locator('#stage').isHidden(), true);
    assert.match(await page.evaluate(() => localStorage.getItem('award_ceremony_display')), /^Projector\|1600\|0\|1920\|1080$/);
  } finally {
    await browser.close();
  }
});
