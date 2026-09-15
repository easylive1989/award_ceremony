// 預設/範例資料
const DEFAULT_AWARDS = [
  { id: '1', category: '🏆 特優首獎', team: '極客探險隊' },
  { id: '2', category: '💡 最佳技術創新獎', team: '量子演算法實驗室' },
  { id: '3', category: '🎨 最佳使用者體驗獎', team: '靈感工坊設計組' },
  { id: '4', category: '🌟 評審團特別獎', team: '星火燎原專案團隊' }
];

class AwardCeremonyApp {
  constructor() {
    this.awards = [];
    this.currentIndex = 0;
    this.themeRevision = 0;
    this.screenDetails = null;
    this.availableScreens = [];

    this.cacheDom();
    this.music = new AwardMusicController(
      document.getElementById('award-music'),
      document.getElementById('music-toggle'),
      document.getElementById('music-volume'),
      document.getElementById('music-status')
    );
    this.bindEvents();
    this.initializeDisplays();
    this.loadState();
    this.themeManager = new AwardThemeManager(document.getElementById('theme-root'), window.AWARD_THEME_CATALOG);
    this.initializeThemes();
  }

  cacheDom() {
    // 後台 DOM
    this.awardListEl = document.getElementById('award-list');
    this.awardCountEl = document.getElementById('award-count');
    this.addItemBtn = document.getElementById('add-item-btn');
    this.loadSampleBtn = document.getElementById('load-sample-btn');
    this.clearAllBtn = document.getElementById('clear-all-btn');
    this.startBtn = document.getElementById('start-btn');
    this.toggleAwardListBtn = document.getElementById('toggle-award-list-btn');
    this.awardListContent = document.getElementById('award-list-content');
    this.formCard = document.querySelector('.form-card');
    this.displaySelect = document.getElementById('display-select');
    this.detectDisplaysBtn = document.getElementById('detect-displays-btn');
    this.displayStatus = document.getElementById('display-status');

    this.setupContainer = document.getElementById('app');

    // 舞台 / 全螢幕 DOM
    this.stageOverlay = document.getElementById('stage');
    this.themeSelect = document.getElementById('theme-select');
    this.themeStatus = document.getElementById('theme-status');
  }

  bindEvents() {
    this.addItemBtn.addEventListener('click', () => this.addAwardItem());
    this.loadSampleBtn.addEventListener('click', () => this.loadSampleData());
    this.clearAllBtn.addEventListener('click', () => this.clearAll());
    this.startBtn.addEventListener('click', () => this.startPresentation());
    this.toggleAwardListBtn.addEventListener('click', () => this.toggleAwardList());
    this.detectDisplaysBtn.addEventListener('click', () => this.detectDisplays());
    this.displaySelect.addEventListener('change', () => this.selectDisplay());

    this.themeSelect.addEventListener('change', () => this.changeTheme(this.themeSelect.value));

    // 每頁先等待點擊揭曉，再次點擊才換頁。
    this.stageOverlay.addEventListener('click', () => {
      this.advancePresentation();
    });

    // 鍵盤快捷鍵
    document.addEventListener('keydown', (e) => {
      if (this.stageOverlay.classList.contains('hidden')) return;

      if (e.key !== 'Escape' && e.target.matches('input, select, textarea')) return;

      if (e.key === 'ArrowRight') {
        this.nextSlide();
      } else if (e.key === 'ArrowLeft') {
        this.prevSlide();
      } else if (e.key === ' ') {
        e.preventDefault();
        if (!e.repeat) this.advancePresentation();
      } else if (e.key === 'Escape') {
        this.exitPresentation();
      }
    });

    // 監聽瀏覽器全螢幕退出
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && !this.stageOverlay.classList.contains('hidden')) {
        this.exitPresentation();
      }
    });
  }

  toggleAwardList() {
    this.setAwardListCollapsed(!this.awardListContent.hidden);
  }

  setAwardListCollapsed(collapsed) {
    this.awardListContent.hidden = collapsed;
    this.formCard.classList.toggle('is-collapsed', collapsed);
    this.toggleAwardListBtn.setAttribute('aria-expanded', String(!collapsed));
    this.toggleAwardListBtn.textContent = collapsed ? '顯示名單' : '隱藏名單';
  }

  initializeDisplays() {
    if ('getScreenDetails' in window) {
      this.displayStatus.textContent = '按「偵測螢幕」選擇外接螢幕或投影機。';
      return;
    }

    this.detectDisplaysBtn.disabled = true;
    this.detectDisplaysBtn.title = '此瀏覽器不支援多螢幕選擇';
    this.displayStatus.textContent = '此瀏覽器不支援指定螢幕，將在目前所在螢幕播放。';
  }

  async detectDisplays() {
    if (!('getScreenDetails' in window)) return;

    this.detectDisplaysBtn.disabled = true;
    this.displayStatus.textContent = '正在偵測螢幕…';
    try {
      const details = await window.getScreenDetails();
      if (this.screenDetails !== details) {
        this.screenDetails?.removeEventListener?.('screenschange', this.handleScreensChange);
        this.screenDetails?.removeEventListener?.('currentscreenchange', this.handleScreensChange);
        this.screenDetails = details;
        this.handleScreensChange = () => this.renderDisplayOptions();
        details.addEventListener?.('screenschange', this.handleScreensChange);
        details.addEventListener?.('currentscreenchange', this.handleScreensChange);
      }
      this.renderDisplayOptions();
    } catch (error) {
      this.availableScreens = [];
      this.displaySelect.innerHTML = '<option value="current">目前所在螢幕</option>';
      this.displaySelect.disabled = true;
      this.displayStatus.textContent = error?.name === 'NotAllowedError'
        ? '未取得多螢幕權限，將在目前所在螢幕播放。'
        : '無法偵測螢幕，將在目前所在螢幕播放。';
      console.warn('Screen detection denied or unavailable:', error);
    } finally {
      this.detectDisplaysBtn.disabled = false;
    }
  }

  renderDisplayOptions() {
    const screens = Array.from(this.screenDetails?.screens || []);
    const previousKey = this.displaySelect.value === 'current'
      ? this.getSavedDisplayKey()
      : this.getScreenKey(this.availableScreens[Number(this.displaySelect.value)]);

    this.availableScreens = screens;
    this.displaySelect.innerHTML = '';
    screens.forEach((screen, index) => {
      const markers = [];
      if (screen === this.screenDetails.currentScreen) markers.push('目前使用');
      if (screen.isPrimary) markers.push('主螢幕');
      const name = screen.label || `螢幕 ${index + 1}`;
      const resolution = screen.width && screen.height ? ` · ${screen.width}×${screen.height}` : '';
      const suffix = markers.length ? `（${markers.join('、')}）` : '';
      this.displaySelect.add(new Option(`${name}${resolution}${suffix}`, String(index)));
    });

    const rememberedIndex = screens.findIndex(screen => this.getScreenKey(screen) === previousKey);
    const currentIndex = screens.indexOf(this.screenDetails.currentScreen);
    this.displaySelect.value = String(rememberedIndex >= 0 ? rememberedIndex : Math.max(0, currentIndex));
    this.displaySelect.disabled = screens.length < 2;
    this.selectDisplay();
    this.displayStatus.textContent = screens.length > 1
      ? `已偵測到 ${screens.length} 個螢幕，播放時會在所選螢幕進入全螢幕。`
      : '目前只偵測到一個螢幕。';
  }

  selectDisplay() {
    const screen = this.getSelectedScreen();
    if (!screen) return;
    try { localStorage.setItem('award_ceremony_display', this.getScreenKey(screen)); } catch { /* Display storage is optional. */ }
  }

  getSelectedScreen() {
    if (this.displaySelect.value === 'current') return null;
    return this.availableScreens[Number(this.displaySelect.value)] || null;
  }

  getScreenKey(screen) {
    if (!screen) return '';
    return [screen.label, screen.left, screen.top, screen.width, screen.height].join('|');
  }

  getSavedDisplayKey() {
    try { return localStorage.getItem('award_ceremony_display') || ''; } catch { return ''; }
  }

  initializeThemes() {
    const catalog = window.AWARD_THEME_CATALOG;
    for (const theme of catalog.themes) {
      this.themeSelect.add(new Option(theme.name, theme.id));
    }
    let saved;
    try { saved = localStorage.getItem('award_ceremony_theme'); } catch { /* Theme storage is optional. */ }
    const id = catalog.themes.some(theme => theme.id === saved) ? saved : catalog.defaultId;
    this.themeSelect.value = id;
    this.changeTheme(id, true);
  }

  async changeTheme(id, initial = false) {
    const revision = ++this.themeRevision;
    this.startBtn.disabled = true;
    this.themeStatus.textContent = '載入皮膚中…';
    try {
      const applied = await this.themeManager.select(id);
      if (!applied || revision !== this.themeRevision) return;
      this.themeSelect.value = this.themeManager.current.id;
      this.themeStatus.textContent = '播放前可切換外觀';
      try { localStorage.setItem('award_ceremony_theme', this.themeManager.current.id); } catch { /* Keep the selected theme for this session. */ }
    } catch (error) {
      if (revision !== this.themeRevision) return;
      if (initial && id !== window.AWARD_THEME_CATALOG.defaultId) {
        await this.changeTheme(window.AWARD_THEME_CATALOG.defaultId);
        return;
      }
      this.themeSelect.value = this.themeManager.current?.id || id;
      this.themeStatus.textContent = this.themeManager.current ? '皮膚載入失敗，已保留原本外觀。' : '皮膚載入失敗，請重新選擇。';
      console.error(error);
    } finally {
      if (revision === this.themeRevision) this.startBtn.disabled = !this.themeManager.current;
    }
  }

  loadState() {
    const saved = localStorage.getItem('award_ceremony_data');
    if (saved) {
      try {
        this.awards = JSON.parse(saved);
      } catch (e) {
        this.awards = [...DEFAULT_AWARDS];
      }
    } else {
      this.awards = [...DEFAULT_AWARDS];
    }
    this.renderList();
  }

  saveState() {
    localStorage.setItem('award_ceremony_data', JSON.stringify(this.awards));
  }

  addAwardItem(category = '', team = '') {
    const item = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      category: category,
      team: team
    };
    this.awards.push(item);
    this.saveState();
    this.renderList();
  }

  removeAwardItem(id) {
    this.awards = this.awards.filter(item => item.id !== id);
    this.saveState();
    this.renderList();
  }

  updateItem(id, field, value) {
    const target = this.awards.find(item => item.id === id);
    if (target) {
      target[field] = value;
      this.saveState();
    }
  }

  loadSampleData() {
    this.awards = JSON.parse(JSON.stringify(DEFAULT_AWARDS));
    this.saveState();
    this.renderList();
  }

  clearAll() {
    if (this.awards.length === 0) return;
    if (confirm('確定要清空所有得獎名單嗎？')) {
      this.awards = [];
      this.saveState();
      this.renderList();
    }
  }

  renderList() {
    this.awardCountEl.textContent = this.awards.length;
    this.awardListEl.innerHTML = '';

    if (this.awards.length === 0) {
      const emptyNotice = document.createElement('div');
      emptyNotice.className = 'empty-state';
      emptyNotice.innerHTML = '尚無得獎名單，請點選上方「新增得獎項目」或「載入範例資料」';
      this.awardListEl.appendChild(emptyNotice);
      return;
    }

    this.awards.forEach((award, index) => {
      const row = document.createElement('div');
      row.className = 'award-item';
      row.innerHTML = `
        <div class="item-index">#${index + 1}</div>
        <div class="input-group">
          <label>得獎組別 / 獎項</label>
          <input type="text" placeholder="例如：特優首獎" value="${this.escapeHtml(award.category)}">
        </div>
        <div class="input-group">
          <label>獲獎隊伍 / 人員名稱</label>
          <input type="text" placeholder="例如：第 1 隊 (隊伍名稱)" value="${this.escapeHtml(award.team)}">
        </div>
        <button class="del-btn" title="刪除此項目">🗑️</button>
      `;

      const inputs = row.querySelectorAll('input');
      const categoryInput = inputs[0];
      const teamInput = inputs[1];
      const delBtn = row.querySelector('.del-btn');

      categoryInput.addEventListener('input', (e) => {
        this.updateItem(award.id, 'category', e.target.value);
      });

      teamInput.addEventListener('input', (e) => {
        this.updateItem(award.id, 'team', e.target.value);
      });

      delBtn.addEventListener('click', () => {
        this.removeAwardItem(award.id);
      });

      this.awardListEl.appendChild(row);
    });
  }

  // ============================
  // 全螢幕展示控制邏輯
  // ============================
  getValidAwards() {
    return this.awards.filter(a => a.category.trim() !== '' || a.team.trim() !== '');
  }

  startPresentation() {
    if (!this.themeManager.current) return;
    const validAwards = this.getValidAwards();
    if (validAwards.length === 0) {
      alert('請至少填寫一組完整的得獎組別或隊伍名稱！');
      return;
    }

    this.currentIndex = 0;
    this.setupContainer.inert = true;
    this.stageOverlay.classList.remove('hidden');
    this.stageOverlay.focus({ preventScroll: true });
    this.themeManager.setVisible(true);

    this.renderCurrentSlide();

    // 嘗試在使用者指定的螢幕進入全螢幕。
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      const selectedScreen = this.getSelectedScreen();
      const options = selectedScreen ? { screen: selectedScreen } : undefined;
      elem.requestFullscreen(options).catch(err => {
        console.warn('Fullscreen request denied or not supported:', err);
      });
    }

  }

  renderCurrentSlide() {
    const validAwards = this.getValidAwards();
    const current = validAwards[this.currentIndex];

    if (!this.stageOverlay.classList.contains('hidden')) this.music.start();
    this.themeManager.update(current);
  }

  advancePresentation() {
    if (this.stageOverlay.classList.contains('hidden')) return;
    if (!this.themeManager.revealed) {
      this.themeManager.reveal();
    } else {
      this.nextSlide();
    }
  }

  nextSlide() {
    const validAwards = this.getValidAwards();
    if (this.currentIndex < validAwards.length - 1) {
      this.currentIndex++;
      this.renderCurrentSlide();
    } else {
      // 最後一組之後回到第一組
      this.currentIndex = 0;
      this.renderCurrentSlide();
    }
  }

  prevSlide() {
    const validAwards = this.getValidAwards();
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.renderCurrentSlide();
    } else {
      this.currentIndex = validAwards.length - 1;
      this.renderCurrentSlide();
    }
  }

  exitPresentation() {
    this.music.stop();
    this.themeManager.setVisible(false);
    this.stageOverlay.classList.add('hidden');
    this.setupContainer.inert = false;
    this.startBtn.focus({ preventScroll: true });
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// 初始化啟動
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AwardCeremonyApp();
});
