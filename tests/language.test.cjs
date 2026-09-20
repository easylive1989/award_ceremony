const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

test('setup stays Chinese while stage presents Chinese and English together', { timeout: 60000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    const url = pathToFileURL(path.resolve(__dirname, '../index.html')).href;

    await page.goto(url);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.app?.themeManager?.current);

    assert.equal(await page.locator('#language-select').count(), 0);
    assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hant');
    assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(240, 238, 230)');
    assert.equal(await page.locator('.card').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(250, 249, 245)');
    assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).color), 'rgb(20, 20, 19)');
    assert.match(await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily), /Arial/);
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()), '#d97757');
    assert.equal(await page.locator('h1').textContent(), '頒獎典禮名單設定');
    assert.equal(await page.locator('h1 small').count(), 0);
    assert.equal(await page.locator('.input-group').first().locator('label').textContent(), '得獎組別 / 獎項');
    assert.equal(await page.locator('.team-input-group').first().locator('label').textContent(), '獲獎隊伍');
    assert(await page.locator('.award-item').first().evaluate(row => {
      const category = row.querySelector('.input-group:first-child').getBoundingClientRect();
      const team = row.querySelector('.team-input-group').getBoundingClientRect();
      const appearance = row.querySelector('.theme-input-group').getBoundingClientRect();
      const actions = row.querySelector('.item-actions').getBoundingClientRect();
      return Math.abs(category.top - team.top) < 1 && Math.abs(appearance.bottom - actions.bottom) < 1;
    }));
    assert.match(await page.locator('.play-award-btn').first().textContent(), /單獨播放/);
    assert.equal(await page.locator('#theme-select').count(), 0);
    assert.equal(await page.locator('.award-theme-select').first().locator('option[value="black-gold"]').textContent(), '黑金榮耀');
    assert.equal(await page.locator('.award-theme-select').first().locator('option[value="claude-final"]').textContent(), 'Claude Final');
    assert.equal(await page.locator('.theme-input-group').first().locator('label').textContent(), '舞台外觀');
    assert.equal(await page.evaluate(() => localStorage.getItem('award_ceremony_locale')), null);

    await page.locator('.award-theme-select').first().selectOption('claude-paper');
    await page.locator('.test-award-btn').first().click();
    await page.waitForFunction(() => window.app.themeManager.current?.id === 'claude-paper' && document.getElementById('stage').getAttribute('aria-busy') === 'false');
    assert.equal(await page.locator('.paper-header-label').textContent(), 'Group 組別');
    assert.equal(await page.locator('.paper-header-value').textContent(), 'Delight');
    assert.equal(await page.locator('.paper-suspense .copy-zh').textContent(), '得獎的是…');
    assert.equal(await page.locator('.paper-suspense .copy-en').textContent(), 'And the winner is…');
    await page.locator('#stage').click();
    assert.equal(await page.locator('.paper-congrats .copy-zh').textContent(), '恭喜獲獎');
    assert.equal(await page.locator('.paper-congrats .copy-en').textContent(), 'Congratulations');
    await page.keyboard.press('Escape');

    await page.reload();
    await page.waitForFunction(() => window.app?.themeManager?.current);
    assert.equal(await page.locator('#language-select').count(), 0);
    assert.match(await page.locator('.subtitle').textContent(), /點擊一次揭曉/);
    assert.doesNotMatch(await page.locator('.subtitle').textContent(), /Click once to reveal/);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
