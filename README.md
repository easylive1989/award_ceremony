# 頒獎典禮播放系統

直接用瀏覽器開啟 `index.html`，或放在靜態網站伺服器上使用，不需要編譯。

在每筆名單選擇自己的「舞台外觀」後，可按該筆後方的「單獨播放」，在所選螢幕建立只包含該獎項的一次性全螢幕場次；也可按垃圾桶左側的「測試」，只在目前網頁內覆蓋顯示舞台，不呼叫瀏覽器全螢幕。每頁先等待，點擊舞台或按空白鍵開始揭曉；Esc 結束播放或測試並返回設定頁。「隱藏隊伍名稱」只會遮住設定頁中的獲獎隊伍欄位，獎項、舞台外觀與操作按鈕仍會保留。設定頁固定使用中文；各舞台固定文案同時呈現中文與英文，使用者輸入的組別及隊伍名稱維持原文。名單與各自選擇的外觀會儲存在瀏覽器中。

## 多螢幕播放

首頁的「播放螢幕」可指定全螢幕舞台要顯示在哪一個螢幕。按「偵測螢幕」並允許瀏覽器的多螢幕管理權限後，選單會列出螢幕名稱、解析度、目前使用及主螢幕標記。瀏覽器不支援、未授權或只偵測到一個螢幕時，仍會在目前所在螢幕播放。

此功能使用 Window Management API，建議以最新版 Chrome 或 Edge，透過 `http://localhost` 或 HTTPS 開啟。直接使用 `file://`、Safari 或 Firefox 時可能只有目前螢幕選項。螢幕選擇會儲存在瀏覽器中，再次偵測到相同螢幕時會自動選回。

## 配樂

按「單獨播放」或「測試」時，會從頭播放 `assets/audio/triomphe-eclatant.mp3` 並循環；換皮時不中斷，結束播放或測試時停止並回到曲首。

首頁的播放設定區同時提供螢幕選擇、靜音及音量調整；配樂預設為 35%，並記住音量與靜音設定。設定時不會自動播放；進入展示後套用設定。全螢幕不顯示頁碼、操作提示或控制列；如需調整音量，按 Esc 返回設定。

更換配樂可更新 `index.html` 中 `#award-music` 的 `src`；所有皮膚共用這個音訊元素，不需修改皮膚檔案。循環保留原音檔的開頭及結尾，不另外剪接。

## 檔案分工

| 檔案 | 職責 |
| --- | --- |
| `app.js` | 名單、儲存、手動換頁、全螢幕、每筆舞台外觀 |
| `music-controller.js` | 共用配樂播放、循環、停止、音量與靜音設定 |
| `theme-manager.js` | 載入及切換舞台外觀，傳遞得獎資料，釋放舊外觀資源 |
| `style.css` | 設定頁、16:9 舞台容器、共用控制按鈕 |
| `assets/audio/` | 共用頒獎配樂，目前收錄 `triomphe-eclatant.mp3`（Triomphe Éclatant） |
| `assets/icons/` | 設定頁使用的介面圖示 |
| `themes/catalog.js` | 可選舞台外觀清單及預設外觀 |
| `themes/black-gold/` | 黑金榮耀的版面、CSS、Canvas 動畫 |
| `themes/black-gold-v2/` | 無字信封抖動、開封彈出得獎卡片、金粉噴泉與光束特效 |
| `themes/claude-paper/` | Claude 舞台的信封揭曉與頒獎台動畫 |
| `themes/claude-final/` | 以 Claude 舞台為基礎，加入四邊金色月桂葉框 |
| `themes/neon/` | 霓虹光幕的獨立版面、CSS 動畫；可複製作為範本 |
| `themes/dungeon/` | 地下城 SVG 場景、Three.js 3D 寶箱與羊皮捲軸揭曉動畫 |

每款皮膚有自己的 DOM 結構，不必沿用黑金版的獎盃或文字排列。共用程式只傳入 `{ category, team }`，不查詢皮膚裡的元素。

## 黑金榮耀 v2

在該筆名單的「舞台外觀」選擇「黑金榮耀 v2」。組別名稱放大置於頂部，從登場到揭曉全程顯示，卡片內僅顯示隊伍名稱與祝賀文字。每次換頁先停在封好的信封，點擊後播放約 4 秒的登場：信封抖動、封蠟脫落、封口掀開、得獎信紙從前袋後方向上抽出，下半部沿前袋折線遮擋，半抽出時短暫停留，完全離開封口後再放大，信封在開封後淡出；揭曉後隊伍名稱保持顯示，背景持續播放金粉、光束與側邊噴泉。配樂沿用每次換頁從頭播放的設定。減少動態效果模式仍先等待點擊，點擊後直接顯示得獎卡片。

## Claude

在該筆名單的「舞台外觀」選擇「Claude」。此版本沿用黑金 v2 的四秒信封揭曉流程、組別置頂與每頁點擊後播放的操作方式。

信紙從封口向上抽出時，較高的紙面下半部會被信封前袋折線遮住，半抽出時短暫停留，完全離開後才放大，信封隨後淡出。等待揭曉時，信封後方維持淡金色呼吸光暈；信紙開始抽出的瞬間，光暈會擴張成柔和光束與圓環並快速淡出，同時 10 顆較大的圓角星星先藏在信封前袋後方，沿著與卡片相同的封口遮罩從信封內左右兩側升起，再向外迸發、旋轉散落後淡出；星星沿用彩帶的陶土橘、綠色與紫色系，每次揭曉播放一次，減少動態效果模式則略過。換頁先等待點擊才開始動畫，音樂仍在換頁時從頭播放。背景不含波紋或紙張雜訊。點擊揭曉時，螢幕最底部的兩隻小型 Claude 吉祥物（使用 `assets/images/clawd-base.png`）會一前一後將頒獎台搬到中央放下；同時第三隻 Clawd 從右側拿著獎盃進場。一位搬台角色跳上頒獎台，接過獎盃後停留合影。約 6.5 秒完成，每次揭曉播放一次，底部不顯示標語。換頁時重置，減少動態效果模式略過此裝飾動畫。信封僅保留 Claude 圖案封蠟，不放文字。頂部不加入角落標語或四角星。

## Claude Final

在該筆名單的「舞台外觀」選擇「Claude Final」。播放流程與 Claude 相同，組別標題框及得獎卡以密集金色月桂葉直接覆蓋原有四邊及圓角，不另加底線。得獎卡抽出時，多款 Clawd 會從畫面左右露出半身，以傾斜姿態上下歡呼。

配色參考 [Anthropic 公開品牌指南](https://github.com/anthropics/skills/blob/main/skills/brand-guidelines/SKILL.md) 的 `#faf9f5`、`#141413`、`#d97757` 等色彩；這是一款風格改編的頒獎皮膚。

## 地下城寶藏

在每筆名單的「舞台外觀」選擇「地下城寶藏」，再按「測試」或「單獨播放」。等待畫面以石造拱門、暖色火把、漂浮光塵與雕紋寶箱呈現奇幻地下城；獎項／組別固定放在頂部。

點擊舞台或按空白鍵後，寶箱先抖動約 1.45 秒，地面金幣與寶石保持固定；完整弧面箱蓋沿後方鉸鏈連續翻開，同時從箱內泛出金光與碎金。羊皮捲軸以小尺寸從箱中抽出，下半部由箱口與前板遮住，半抽出時短暫停留，完全離開箱口後才放大展開，約 5 秒後完整顯示得獎隊伍與中英祝賀文字；捲軸完整展開後，寶箱在 0.25 秒內淡出，地面金幣與寶石保留，名單保持顯示。沿用共用配樂，不另外加入音效。換頁時重置為等待畫面，Esc 返回設定。

背景維持本機 SVG；寶箱改用 Three.js / WebGL 2 建立真正的中空箱身、弧形厚殼箱蓋、金屬箍帶、鉚釘、金幣與寶石。箱蓋全程是同一組 3D 網格，繞箱身後緣的鉸鏈旋轉，內外表面與側面厚度由深度測試與燈光呈現。捲軸的遮罩依 3D 箱口投影定位。模型與程序木紋材質全部在本機生成，無需 CDN 或模型下載，可直接用 `file://` 開啟；無法建立 WebGL 時使用靜態 SVG 備援，仍可揭曉名單。

文字會隨舞台及長隊名自動縮放；減少動態效果模式仍等待點擊，點擊後直接顯示展開的捲軸。3D 只在揭曉期間繪製連續影格，等待與淡出後停止；隱藏舞台或頁籤時暫停，換皮時釋放 GPU 材質、幾何、貼圖、context 與監聽器。新增此皮膚不更動預設外觀或既有名單。

地下城的可編輯原始碼在 `themes/dungeon/src/theme.js` 與 `src/chest-model.js`，修改後執行 `npm run build:dungeon`，產生已包含 Three.js 的一般 script `themes/dungeon/theme.js`。產物一併納入版本控制，使用網站不需要安裝 npm 或建置。Three.js 的 MIT 授權保留在 `themes/dungeon/THREE-LICENSE.txt`。

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
