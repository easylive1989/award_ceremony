const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

test('award list persists after reloading the page', { timeout: 30000 }, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    const url = pathToFileURL(path.resolve(__dirname, '../index.html')).href;

    await page.goto(url);
    await page.waitForFunction(() => window.app?.themeManager.current);
    assert.deepEqual(
      await page.evaluate(() => window.app.awards.map(({ category, team }) => ({ category, team }))),
      [
        { category: 'Delight', team: '' },
        { category: 'Everyday', team: '' },
        { category: 'Breadkthrough', team: '' },
      ]
    );
    await page.evaluate(() => localStorage.setItem('award_ceremony_data', JSON.stringify([
      { id: '1', category: '🏆 特優首獎', team: '極客探險隊' },
      { id: '2', category: '💡 最佳技術創新獎', team: '量子演算法實驗室' },
      { id: '3', category: '🎨 最佳使用者體驗獎', team: '靈感工坊設計組' },
      { id: '4', category: '🌟 評審團特別獎', team: '星火燎原專案團隊' },
    ])));
    await page.reload();
    await page.waitForFunction(() => window.app?.themeManager.current);
    assert.deepEqual(
      JSON.parse(await page.evaluate(() => localStorage.getItem('award_ceremony_data'))).map(({ category, team }) => ({ category, team })),
      [
        { category: 'Delight', team: '' },
        { category: 'Everyday', team: '' },
        { category: 'Breadkthrough', team: '' },
      ]
    );
    await page.locator('.award-item').first().locator('input').nth(0).fill('年度創意獎');
    await page.locator('.award-item').first().locator('input').nth(1).fill('Local Storage 隊');
    await page.locator('#add-item-btn').click();
    await page.locator('.award-item').last().locator('input').nth(0).fill('最佳人氣獎');
    await page.locator('.award-item').last().locator('input').nth(1).fill('重新整理也在隊');

    const beforeReload = await page.evaluate(() => window.app.awards.map(award => ({ ...award })));
    assert.deepEqual(
      JSON.parse(await page.evaluate(() => localStorage.getItem('award_ceremony_data'))),
      beforeReload
    );

    await page.reload();
    await page.waitForFunction(() => window.app?.themeManager.current);

    assert.deepEqual(
      await page.evaluate(() => window.app.awards.map(award => ({ ...award }))),
      beforeReload
    );
    assert.equal(await page.locator('.award-item').first().locator('input').nth(0).inputValue(), '年度創意獎');
    assert.equal(await page.locator('.award-item').last().locator('input').nth(1).inputValue(), '重新整理也在隊');
  } finally {
    await browser.close();
  }
});
