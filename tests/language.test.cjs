const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

test('language setting switches and remembers setup and stage copy', { timeout: 60000 }, async () => {
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
    assert.equal(await page.locator('#language-select').inputValue(), 'zh');
    assert.equal(await page.locator('h1').textContent(), '頒獎典禮名單設定');

    await page.locator('#language-select').selectOption('en');
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.equal(await page.locator('h1').textContent(), 'Award Ceremony Setup');
    assert.equal(await page.locator('.input-group').first().locator('label').textContent(), 'Award category');
    assert.match(await page.locator('.play-award-btn').first().textContent(), /Present/);
    assert.equal(await page.locator('#theme-select option[value="black-gold"]').textContent(), 'Black Gold');
    assert.equal(await page.evaluate(() => localStorage.getItem('award_ceremony_locale')), 'en');

    await page.locator('#theme-select').selectOption('claude-paper');
    await page.waitForFunction(() => window.app.themeManager.current?.id === 'claude-paper');
    await page.locator('.test-award-btn').first().click();
    assert.equal(await page.locator('.paper-suspense').textContent(), 'And the winner is…');
    await page.locator('#stage').click();
    assert.equal(await page.locator('.paper-congrats').textContent(), 'Congratulations');
    await page.keyboard.press('Escape');

    await page.reload();
    await page.waitForFunction(() => window.app?.themeManager?.current);
    assert.equal(await page.locator('#language-select').inputValue(), 'en');
    assert.equal(await page.locator('h1').textContent(), 'Award Ceremony Setup');

    await page.locator('#language-select').selectOption('zh');
    assert.equal(await page.locator('html').getAttribute('lang'), 'zh-TW');
    await page.locator('.test-award-btn').first().click();
    assert.equal(await page.locator('.paper-suspense').textContent(), '得獎的是…');
    await page.locator('#stage').click();
    assert.equal(await page.locator('.paper-congrats').textContent(), '恭喜獲獎');
    await page.keyboard.press('Escape');

    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
