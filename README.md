# 頒獎典禮播放系統

直接用瀏覽器開啟 `index.html`，或放在靜態網站伺服器上使用，不需要編譯。

設定名單、選擇「舞台皮膚」，按「開始全螢幕播放」。每頁先等待，點擊舞台或按空白鍵開始揭曉，再點一下切到下一組。左右方向鍵可直接切換到等待畫面，Esc 結束播放。最後一組之後回到第一組，不會自動跳頁。名單與選擇的皮膚分別儲存在瀏覽器中。

## 配樂

按「開始全螢幕播放」時，會從頭播放 `assets/audio/triomphe-eclatant.mp3` 並循環。每次換頁（包含上一組、下一組、回到第一組）都會從曲首重新播放；換皮時不中斷，結束頒獎時停止並回到曲首。

首頁「配樂設定」可靜音及調整音量，預設為 35%，並記住音量與靜音設定。設定時不會自動播放；進入展示後套用設定。全螢幕不顯示頁碼、操作提示或控制列；如需調整音量，按 Esc 返回設定。

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
| `themes/black-gold-v2/` | 無字信封抖動、開封彈出得獎卡片、金粉噴泉與光束特效 |
| `themes/claude-paper/` | Claude 風格陶土橘背景、暖紙信封、襯線字與大片彩帶特效 |
| `themes/neon/` | 霓虹光幕的獨立版面、CSS 動畫；可複製作為範本 |

每款皮膚有自己的 DOM 結構，不必沿用黑金版的獎盃或文字排列。共用程式只傳入 `{ category, team }`，不查詢皮膚裡的元素。

## 黑金榮耀 v2

在「舞台皮膚」選擇「黑金榮耀 v2」。組別名稱放大置於頂部，從登場到揭曉全程顯示，卡片內僅顯示隊伍名稱與祝賀文字。每次換頁先停在封好的信封，點擊後播放約 4 秒的登場：信封抖動、封蠟脫落、封口掀開、得獎卡片彈出放大，信封在開封後淡出；揭曉後隊伍名稱保持顯示，背景持續播放金粉、光束與側邊噴泉。配樂沿用每次換頁從頭播放的設定。減少動態效果模式仍先等待點擊，點擊後直接顯示得獎卡片。

## Claude 暖紙

在皮膚選單選擇「Claude 暖紙」。沿用黑金 v2 的四秒信封揭曉流程與組別置頂；使用參考圖片的陶土橘背景（`#BC7A5E`）、暖米白紙張、陶土橘封蠟、深灰襯線文字與大片飄落彩帶。開封後信封淡出，換頁先等待點擊才開始動畫，音樂仍在換頁時從頭播放。背景不含波紋。點擊揭曉時，螢幕最底部的小型 Claude 吉祥物（使用 `assets/images/clawd-base.png`）會晃動身體推動頒獎台，從左側一路橫越至右側離開螢幕，中途不停留；約 7 秒完成，每次揭曉播放一次。換頁時重置，減少動態效果模式略過此裝飾動畫。信封僅保留 Claude 圖案封蠟，不放文字。頂部不加入角落標語或四角星。

配色參考 [Anthropic 公開品牌指南](https://github.com/anthropics/skills/blob/main/skills/brand-guidelines/SKILL.md) 的 `#faf9f5`、`#141413`、`#d97757` 等色彩；這是一款風格改編的頒獎皮膚。

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

每份 `theme.js` 使用一般 script 註冊工廠函式，接收屬於自己的 `host`，回傳以下方法：

```js
window.AwardThemes.set('my-theme', (host) => {
  host.innerHTML = '<div data-award-category></div><div data-award-team></div>';
  const category = host.querySelector('[data-award-category]');
  const team = host.querySelector('[data-award-team]');
  return {
    prepare(award) {
      // 每頁等待畫面：顯示組別、隱藏隊伍，暫不執行揭曉動畫。
      category.textContent = award.category;
      team.textContent = award.team;
      team.style.visibility = 'hidden';
    },
    update(award) {
      team.style.visibility = '';
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

- `prepare()` 在初始化、換頁及尚未揭曉時換皮呼叫；`update()` 在點擊揭曉及已開始揭曉時換皮呼叫。舊皮膚沒有 `prepare()` 時仍相容原本的 `update()` 行為。`setVisible()` 傳入舞台顯示狀態。`destroy()` 在換皮或卸載時呼叫。
- 工廠與初次 `prepare()` / `update()` / `setVisible()` 可能在 host 尚未插入文件時呼叫；使用 `ResizeObserver` 在實際顯示後量測尺寸，黑金與霓虹範例皆有示範。
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

測試使用獨立瀏覽器，不修改平常使用的名單。涵蓋皮膚切換、手動換頁、儲存、快速換皮、載入失敗、樣式隔離與資源清理。
