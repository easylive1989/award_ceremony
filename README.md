# 頒獎典禮播放系統

直接用瀏覽器開啟 `index.html`，或放在靜態網站伺服器上使用，不需要編譯。

設定名單、選擇「舞台皮膚」，按「開始全螢幕播放」。點擊舞台或按空白鍵切到下一組，左右方向鍵切換，Esc 結束播放。最後一組之後回到第一組，不會自動跳頁。名單與選擇的皮膚分別儲存在瀏覽器中。

## 配樂

按「開始全螢幕播放」時，會從頭播放 `assets/audio/triomphe-eclatant.mp3` 並循環。每次換頁（包含上一組、下一組、回到第一組）都會從曲首重新播放；換皮時不中斷，結束頒獎時停止並回到曲首。

舞台右上角可靜音及調整音量，預設為 35%，並記住音量與靜音設定。若瀏覽器阻擋播放或音檔載入失敗，會顯示提示，可按 ♪ 重試，頒獎畫面仍可操作。

更換配樂可更新 `index.html` 中 `#award-music` 的 `src`；所有皮膚共用這個音訊元素，不需修改皮膚檔案。循環保留原音檔的開頭及結尾，不另外剪接。

## 檔案分工

| 檔案 | 職責 |
| --- | --- |
| `app.js` | 名單、儲存、手動換頁、全螢幕、皮膚選單 |
| `music-controller.js` | 共用配樂播放、循環、停止、音量與靜音設定 |
| `theme-manager.js` | 載入及切換皮膚，傳遞得獎資料，釋放舊皮膚資源 |
| `style.css` | 設定頁、16:9 舞台容器、共用控制按鈕 |
| `assets/audio/` | 共用頒獎配樂，目前收錄 `triomphe-eclatant.mp3`（Triomphe Éclatant） |
| `themes/catalog.js` | 可選皮膚清單及預設皮膚 |
| `themes/black-gold/` | 黑金榮耀的版面、CSS、Canvas 動畫 |
| `themes/neon/` | 霓虹光幕的獨立版面、CSS 動畫；可複製作為範本 |

每款皮膚有自己的 DOM 結構，不必沿用黑金版的獎盃或文字排列。共用程式只傳入 `{ category, team }`，不查詢皮膚裡的元素。

## 新增皮膚

1. 複製 `themes/neon/` 到 `themes/my-theme/`。
2. 將 `theme.js` 的 `AwardThemes.set('neon', ...)` 改為 `AwardThemes.set('my-theme', ...)`，修改版面及動畫。
3. 將 CSS 中所有 `[data-theme="neon"]` 改為 `[data-theme="my-theme"]`，並使用自己的 class 及 keyframe 名稱。
4. 在 `themes/catalog.js` 的 `themes` 陣列新增：

```js
{
  id: 'my-theme',
  name: '我的新皮膚',
  stylesheet: 'themes/my-theme/theme.css',
  script: 'themes/my-theme/theme.js',
},
```

重新整理後，皮膚便會出現在選單。不需要修改 `app.js` 或 `index.html`。若要改預設外觀，修改 `defaultId`；使用者已儲存的選擇仍優先。

## 皮膚介面

每份 `theme.js` 使用一般 script 註冊工廠函式，接收屬於自己的 `host`，回傳三個方法：

```js
window.AwardThemes.set('my-theme', (host) => {
  host.innerHTML = '<div data-award-category></div><div data-award-team></div>';
  const category = host.querySelector('[data-award-category]');
  const team = host.querySelector('[data-award-team]');
  return {
    update(award) {
      category.textContent = award.category;
      team.textContent = award.team;
      // 在此重播文字登場動畫。
    },
    setVisible(visible) {
      // 顯示時啟動動畫；隱藏時停止 requestAnimationFrame 等工作。
    },
    destroy() {
      // 取消動畫、disconnect observers、移除全域事件監聽器。
    },
  };
});
```

- `update()` 會在初始化、換頁或換皮時呼叫。`setVisible()` 傳入舞台顯示狀態。`destroy()` 在換皮或卸載時呼叫。
- 工廠與初次 `update()` / `setVisible()` 可能在 host 尚未插入文件時呼叫；使用 `ResizeObserver` 在實際顯示後量測尺寸，黑金與霓虹範例皆有示範。
- 只在自己的 host 內查詢及修改 DOM。得獎文字透過 `textContent` 寫入，勿插入 HTML。
- CSS 必須限定在 `[data-theme="my-theme"]` 之下，避免改到設定頁或其他皮膚；`@keyframes` 名稱也應使用獨立前綴。
- 尊重 `prefers-reduced-motion`，並在頁面不可見時暫停持續動畫。每次建立工廠都應有獨立狀態，不能累加全域監聽器。
- 皮膚不可控制名單、換頁、全螢幕或使用名單的 localStorage key。
- 使用一般 script，不使用 `fetch()` 讀模板或 ES module import，以維持直接開啟本機 HTML 的能力。模板可寫在 `theme.js`；圖片路徑相對於 `index.html`，CSS 的 `url()` 相對於 CSS 檔。
- 皮膚為本機受信任的程式碼，不是執行不受信任外掛的沙箱。

載入失敗時保留目前外觀；已刪除的已存皮膚會改用預設皮膚。快速切換時只套用最後一次選擇，且每次換皮會清理舊樣式與動畫。

## 驗證

```sh
npm install
npx playwright install chromium
npm test
```

測試使用獨立瀏覽器，不修改平常使用的名單。涵蓋兩款皮膚、手動換頁、儲存、快速換皮、載入失敗、樣式隔離與資源清理。
