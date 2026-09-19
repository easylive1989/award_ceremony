// 預設/範例資料
const DEFAULT_AWARDS = [
  { id: '1', category: 'Delight', team: '' },
  { id: '2', category: 'Everyday', team: '' },
  { id: '3', category: 'Breadkthrough', team: '' }
];
const LEGACY_DEFAULT_AWARDS = [
  { id: '1', category: '🏆 特優首獎', team: '極客探險隊' },
  { id: '2', category: '💡 最佳技術創新獎', team: '量子演算法實驗室' },
  { id: '3', category: '🎨 最佳使用者體驗獎', team: '靈感工坊設計組' },
  { id: '4', category: '🌟 評審團特別獎', team: '星火燎原專案團隊' }
];
const AWARD_STORAGE_KEY = 'award_ceremony_data';

const UI_COPY = {
  documentTitle: '頒獎典禮播放系統',
  badge: '頒獎典禮播放系統',
  heading: '頒獎典禮名單設定',
  subtitle: '設定得獎組別與獲獎隊伍，點擊一次揭曉，再點擊切換下一組。',
  appearanceRegion: '舞台外觀與配樂', themeLabel: '舞台皮膚', musicLabel: '配樂音量', musicControls: '配樂控制',
  displayRegion: '播放螢幕設定', displayLabel: '播放螢幕', displayControls: '播放螢幕控制', currentDisplay: '目前所在螢幕', detectDisplays: '偵測螢幕',
  displayHelp: '初次偵測時，瀏覽器會詢問多螢幕管理權限。',
  listTitle: '名單清單', addAward: '新增得獎項目', loadSample: '載入範例資料', clearAll: '清空',
  awardCountPrefix: '目前共有', awardCountSuffix: '個得獎項目', stageLabel: '得獎展示舞台', showTeams: '顯示隊伍名稱', hideTeams: '隱藏隊伍名稱',
  themeLoading: '載入皮膚中…', themeReady: '播放前可切換外觀', themeFailedKept: '皮膚載入失敗，已保留原本外觀。', themeFailedChoose: '皮膚載入失敗，請重新選擇。',
  displayPrompt: '按「偵測螢幕」選擇外接螢幕或投影機。', displayUnsupportedTitle: '此瀏覽器不支援多螢幕選擇', displayUnsupported: '此瀏覽器不支援指定螢幕，將在目前螢幕播放。',
  displayDetecting: '正在偵測螢幕…', displayDenied: '未取得多螢幕權限，將在目前螢幕播放。', displayFailed: '無法偵測螢幕，將在目前螢幕播放。',
  displayDetected: '已偵測到 {count} 個螢幕。', displaySingle: '目前只偵測到一個螢幕。', currentMarker: '目前使用', primaryMarker: '主螢幕', screenName: '螢幕 {number}',
  emptyList: '尚無得獎名單，請新增項目或載入範例資料。', categoryLabel: '得獎組別 / 獎項', categoryPlaceholder: '例如：Delight',
  teamLabel: '獲獎隊伍 / 人員名稱', teamPlaceholder: '例如：第 1 隊', playOne: '單獨播放', testOne: '測試', playOneAria: '單獨播放第 {number} 個獎項', testOneAria: '在網頁內測試第 {number} 個獎項', deleteTitle: '刪除此項目', deleteAria: '刪除第 {number} 個獎項',
  clearConfirm: '確定要清空所有得獎名單嗎？', missingAwards: '請至少填寫一組完整資料。', missingAward: '請先填寫此獎項或隊伍名稱。',
  musicRetry: '重試播放配樂', musicUnmute: '開啟配樂', musicMute: '靜音配樂', musicLoadFailed: '配樂無法載入；仍可繼續頒獎。', musicStartFailed: '配樂未開始，請按配樂按鈕。',
};

class AwardCeremonyApp {
  constructor() {
    this.awards = [];
    this.presentationAwards = [];
    this.currentIndex = 0;
    this.closePresentationAtEnd = false;
    this.presentationTrigger = null;
    this.teamNamesHidden = false;
    this.themeRevision = 0;
    this.screenDetails = null;
    this.availableScreens = [];

    this.cacheDom();
    this.music = new AwardMusicController(
      document.getElementById('award-music'),
      document.getElementById('music-toggle'),
      document.getElementById('music-volume'),
      document.getElementById('music-status'),
      key => this.t(key)
    );
    this.bindEvents();
    this.applyStaticCopy();
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
    this.toggleAwardListBtn = document.getElementById('toggle-award-list-btn');
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
    this.toggleAwardListBtn.addEventListener('click', () => this.toggleTeamNames());
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

  t(key, values = {}) {
    const template = UI_COPY[key] ?? key;
    return Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), template);
  }

  applyStaticCopy() {
    document.documentElement.lang = 'zh-Hant';
    document.title = this.t('documentTitle');
    document.querySelectorAll('[data-i18n]').forEach(element => {
      element.textContent = this.t(element.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
      element.setAttribute('aria-label', this.t(element.dataset.i18nAriaLabel));
    });
    this.themeStatus.textContent = this.themeManager?.current ? this.t('themeReady') : this.t('themeLoading');
    this.music?.syncControls();
    this.setTeamNamesHidden(this.teamNamesHidden);
  }

  themeName(theme) {
    return theme.name;
  }

  toggleTeamNames() {
    this.setTeamNamesHidden(!this.teamNamesHidden);
  }

  setTeamNamesHidden(hidden) {
    this.teamNamesHidden = hidden;
    this.formCard.classList.toggle('team-names-hidden', hidden);
    this.toggleAwardListBtn.setAttribute('aria-expanded', String(!hidden));
    this.toggleAwardListBtn.textContent = hidden ? this.t('showTeams') : this.t('hideTeams');
  }

  initializeDisplays() {
    if ('getScreenDetails' in window) {
      this.detectDisplaysBtn.disabled = false;
      this.detectDisplaysBtn.title = '';
      this.displayStatus.textContent = this.t('displayPrompt');
      return;
    }

    this.detectDisplaysBtn.disabled = true;
    this.detectDisplaysBtn.title = this.t('displayUnsupportedTitle');
    this.displayStatus.textContent = this.t('displayUnsupported');
  }

  async detectDisplays() {
    if (!('getScreenDetails' in window)) return;

    this.detectDisplaysBtn.disabled = true;
    this.displayStatus.textContent = this.t('displayDetecting');
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
      this.displaySelect.replaceChildren(new Option(this.t('currentDisplay'), 'current'));
      this.displaySelect.disabled = true;
      this.displayStatus.textContent = error?.name === 'NotAllowedError'
        ? this.t('displayDenied')
        : this.t('displayFailed');
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
      if (screen === this.screenDetails.currentScreen) markers.push(this.t('currentMarker'));
      if (screen.isPrimary) markers.push(this.t('primaryMarker'));
      const name = screen.label || this.t('screenName', { number: index + 1 });
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
      ? this.t('displayDetected', { count: screens.length })
      : this.t('displaySingle');
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
      this.themeSelect.add(new Option(this.themeName(theme), theme.id));
    }
    let saved;
    try { saved = localStorage.getItem('award_ceremony_theme'); } catch { /* Theme storage is optional. */ }
    const id = catalog.themes.some(theme => theme.id === saved) ? saved : catalog.defaultId;
    this.themeSelect.value = id;
    this.changeTheme(id, true);
  }

  async changeTheme(id, initial = false) {
    const revision = ++this.themeRevision;
    this.setPlaybackButtonsDisabled(true);
    this.themeStatus.textContent = this.t('themeLoading');
    try {
      const applied = await this.themeManager.select(id);
      if (!applied || revision !== this.themeRevision) return;
      this.themeSelect.value = this.themeManager.current.id;
      this.themeStatus.textContent = this.t('themeReady');
      try { localStorage.setItem('award_ceremony_theme', this.themeManager.current.id); } catch { /* Keep the selected theme for this session. */ }
    } catch (error) {
      if (revision !== this.themeRevision) return;
      if (initial && id !== window.AWARD_THEME_CATALOG.defaultId) {
        await this.changeTheme(window.AWARD_THEME_CATALOG.defaultId);
        return;
      }
      this.themeSelect.value = this.themeManager.current?.id || id;
      this.themeStatus.textContent = this.themeManager.current ? this.t('themeFailedKept') : this.t('themeFailedChoose');
      console.error(error);
    } finally {
      if (revision === this.themeRevision) this.setPlaybackButtonsDisabled(!this.themeManager.current);
    }
  }

  setPlaybackButtonsDisabled(disabled) {
    this.awardListEl.querySelectorAll('.play-award-btn, .test-award-btn').forEach(button => {
      button.disabled = disabled;
    });
  }

  loadState() {
    let savedAwards = null;
    let migratedLegacyDefaults = false;

    try {
      const saved = localStorage.getItem(AWARD_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        const isValid = Array.isArray(parsed) && parsed.every(award => (
          award
          && typeof award.id === 'string'
          && typeof award.category === 'string'
          && typeof award.team === 'string'
        ));
        if (isValid) {
          const isLegacyDefault = JSON.stringify(parsed) === JSON.stringify(LEGACY_DEFAULT_AWARDS);
          savedAwards = isLegacyDefault ? DEFAULT_AWARDS.map(award => ({ ...award })) : parsed;
          migratedLegacyDefaults = isLegacyDefault;
        }
      }
    } catch (error) {
      console.warn('Unable to restore the award list from local storage:', error);
    }

    this.awards = savedAwards ?? DEFAULT_AWARDS.map(award => ({ ...award }));
    if (migratedLegacyDefaults) this.saveState();
    this.renderList();
  }

  saveState() {
    try {
      localStorage.setItem(AWARD_STORAGE_KEY, JSON.stringify(this.awards));
    } catch (error) {
      console.warn('Unable to save the award list to local storage:', error);
    }
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
    if (confirm(this.t('clearConfirm'))) {
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
      emptyNotice.textContent = this.t('emptyList');
      this.awardListEl.appendChild(emptyNotice);
      return;
    }

    this.awards.forEach((award, index) => {
      const row = document.createElement('div');
      row.className = 'award-item';
      row.innerHTML = `
        <div class="item-index">#${index + 1}</div>
        <div class="input-group">
          <label>${this.t('categoryLabel')}</label>
          <input type="text" placeholder="${this.escapeHtml(this.t('categoryPlaceholder'))}" value="${this.escapeHtml(award.category)}">
        </div>
        <div class="input-group team-input-group">
          <label>${this.t('teamLabel')}</label>
          <input type="text" placeholder="${this.escapeHtml(this.t('teamPlaceholder'))}" value="${this.escapeHtml(award.team)}">
        </div>
        <div class="item-actions">
          <button class="btn btn-primary btn-compact play-award-btn" type="button" aria-label="${this.t('playOneAria', { number: index + 1 })}"><img class="guide-icon" src="assets/icons/presentation.png" alt="" aria-hidden="true">${this.t('playOne')}</button>
          <button class="btn btn-outline btn-compact test-award-btn" type="button" aria-label="${this.t('testOneAria', { number: index + 1 })}"><img class="guide-icon" src="assets/icons/preview.png" alt="" aria-hidden="true">${this.t('testOne')}</button>
          <button class="del-btn" type="button" title="${this.t('deleteTitle')}" aria-label="${this.t('deleteAria', { number: index + 1 })}"><img class="guide-icon" src="assets/icons/remove.png" alt="" aria-hidden="true"></button>
        </div>
      `;

      const inputs = row.querySelectorAll('input');
      const categoryInput = inputs[0];
      const teamInput = inputs[1];
      const playBtn = row.querySelector('.play-award-btn');
      const testBtn = row.querySelector('.test-award-btn');
      const delBtn = row.querySelector('.del-btn');

      playBtn.disabled = !this.themeManager?.current;
      testBtn.disabled = !this.themeManager?.current;

      categoryInput.addEventListener('input', (e) => {
        this.updateItem(award.id, 'category', e.target.value);
      });

      teamInput.addEventListener('input', (e) => {
        this.updateItem(award.id, 'team', e.target.value);
      });

      playBtn.addEventListener('click', () => {
        this.startSingleAward(award.id, playBtn);
      });

      testBtn.addEventListener('click', () => {
        this.testSingleAward(award.id, testBtn);
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
      alert(this.t('missingAwards'));
      return;
    }

    this.launchPresentation(validAwards);
  }

  startSingleAward(id, trigger = null) {
    this.startAward(id, true, trigger);
  }

  testSingleAward(id, trigger = null) {
    this.startAward(id, false, trigger);
  }

  startAward(id, requestBrowserFullscreen, trigger) {
    if (!this.themeManager.current) return;
    const award = this.awards.find(item => item.id === id);
    if (!award || (award.category.trim() === '' && award.team.trim() === '')) {
      alert(this.t('missingAward'));
      return;
    }

    this.launchPresentation([award], true, requestBrowserFullscreen, trigger);
  }

  launchPresentation(awards, closeAtEnd = false, requestBrowserFullscreen = true, trigger = null) {
    this.presentationAwards = awards.map(award => ({ ...award }));
    this.currentIndex = 0;
    this.closePresentationAtEnd = closeAtEnd;
    this.presentationTrigger = trigger;
    this.setupContainer.inert = true;
    this.stageOverlay.classList.remove('hidden');
    this.stageOverlay.focus({ preventScroll: true });
    this.themeManager.setVisible(true);

    this.renderCurrentSlide();

    // 正式播放可進入指定螢幕；測試只使用目前網頁內的覆蓋舞台。
    const elem = document.documentElement;
    if (requestBrowserFullscreen && elem.requestFullscreen) {
      const selectedScreen = this.getSelectedScreen();
      const options = selectedScreen ? { screen: selectedScreen } : undefined;
      elem.requestFullscreen(options).catch(err => {
        console.warn('Fullscreen request denied or not supported:', err);
      });
    }

  }

  renderCurrentSlide() {
    const current = this.presentationAwards[this.currentIndex];

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
    if (this.currentIndex < this.presentationAwards.length - 1) {
      this.currentIndex++;
      this.renderCurrentSlide();
    } else if (this.closePresentationAtEnd) {
      this.exitPresentation();
    } else {
      // 最後一組之後回到第一組
      this.currentIndex = 0;
      this.renderCurrentSlide();
    }
  }

  prevSlide() {
    // 單獨播放沒有上一組，避免重新觸發同一個獎項。
    if (this.closePresentationAtEnd && this.presentationAwards.length === 1) return;

    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.renderCurrentSlide();
    } else {
      this.currentIndex = this.presentationAwards.length - 1;
      this.renderCurrentSlide();
    }
  }

  exitPresentation() {
    const returnFocus = this.presentationTrigger;
    this.presentationTrigger = null;
    this.music.stop();
    this.themeManager.setVisible(false);
    this.stageOverlay.classList.add('hidden');
    this.setupContainer.inert = false;
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
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
