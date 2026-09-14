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
    this.isPlaying = false;
    this.timer = null;
    this.slideDuration = 5000; // 每組播放 5 秒
    this.progressInterval = null;
    this.progressStartTime = null;

    this.cacheDom();
    this.bindEvents();
    this.loadState();
  }

  cacheDom() {
    // 後台 DOM
    this.awardListEl = document.getElementById('award-list');
    this.awardCountEl = document.getElementById('award-count');
    this.addItemBtn = document.getElementById('add-item-btn');
    this.loadSampleBtn = document.getElementById('load-sample-btn');
    this.clearAllBtn = document.getElementById('clear-all-btn');
    this.startBtn = document.getElementById('start-btn');

    // 舞台 / 全螢幕 DOM
    this.stageOverlay = document.getElementById('stage');
    this.categoryEl = document.getElementById('display-category');
    this.teamEl = document.getElementById('display-team');
    this.currentIndexLabel = document.getElementById('current-index-label');
    this.totalCountLabel = document.getElementById('total-count-label');
    this.progressBar = document.getElementById('slide-progress');

    // 控制按鈕
    this.prevBtn = document.getElementById('prev-btn');
    this.nextBtn = document.getElementById('next-btn');
    this.togglePlayBtn = document.getElementById('toggle-play-btn');
    this.exitFullscreenBtn = document.getElementById('exit-fullscreen-btn');
  }

  bindEvents() {
    this.addItemBtn.addEventListener('click', () => this.addAwardItem());
    this.loadSampleBtn.addEventListener('click', () => this.loadSampleData());
    this.clearAllBtn.addEventListener('click', () => this.clearAll());
    this.startBtn.addEventListener('click', () => this.startPresentation());

    // 舞台控制按鈕
    this.prevBtn.addEventListener('click', () => this.prevSlide());
    this.nextBtn.addEventListener('click', () => this.nextSlide());
    this.togglePlayBtn.addEventListener('click', () => this.togglePlayPause());
    this.exitFullscreenBtn.addEventListener('click', () => this.exitPresentation());

    // 鍵盤快捷鍵
    document.addEventListener('keydown', (e) => {
      if (this.stageOverlay.classList.contains('hidden')) return;

      if (e.key === 'ArrowRight') {
        this.nextSlide();
      } else if (e.key === 'ArrowLeft') {
        this.prevSlide();
      } else if (e.key === ' ') {
        e.preventDefault();
        this.togglePlayPause();
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
    const validAwards = this.getValidAwards();
    if (validAwards.length === 0) {
      alert('請至少填寫一組完整的得獎組別或隊伍名稱！');
      return;
    }

    this.currentIndex = 0;
    this.stageOverlay.classList.remove('hidden');

    // 嘗試調用瀏覽器全螢幕
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.warn('Fullscreen request denied or not supported:', err);
      });
    }

    this.isPlaying = true;
    this.renderCurrentSlide();
    this.startAutoPlayTimer();
  }

  renderCurrentSlide() {
    const validAwards = this.getValidAwards();
    const current = validAwards[this.currentIndex];

    this.currentIndexLabel.textContent = this.currentIndex + 1;
    this.totalCountLabel.textContent = validAwards.length;

    // 重新觸發 CSS 動畫
    this.categoryEl.style.animation = 'none';
    this.teamEl.style.animation = 'none';
    void this.categoryEl.offsetHeight; // force reflow
    void this.teamEl.offsetHeight;

    this.categoryEl.textContent = current.category || '得獎獎項';
    this.teamEl.textContent = current.team || '獲獎隊伍';

    this.categoryEl.style.animation = '';
    this.teamEl.style.animation = '';

    // 重置進度條
    this.resetProgressBar();
  }

  startAutoPlayTimer() {
    this.clearTimers();
    if (!this.isPlaying) return;

    this.progressStartTime = Date.now();
    this.progressInterval = setInterval(() => {
      const elapsed = Date.now() - this.progressStartTime;
      const pct = Math.min(100, (elapsed / this.slideDuration) * 100);
      this.progressBar.style.width = `${pct}%`;

      if (elapsed >= this.slideDuration) {
        this.nextSlide();
      }
    }, 50);
  }

  resetProgressBar() {
    this.progressBar.style.width = '0%';
    if (this.isPlaying) {
      this.startAutoPlayTimer();
    }
  }

  clearTimers() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  nextSlide() {
    const validAwards = this.getValidAwards();
    if (this.currentIndex < validAwards.length - 1) {
      this.currentIndex++;
      this.renderCurrentSlide();
    } else {
      // 輪播結束或回到第一組
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

  togglePlayPause() {
    this.isPlaying = !this.isPlaying;
    this.togglePlayBtn.textContent = this.isPlaying ? '⏸' : '▶';

    if (this.isPlaying) {
      this.startAutoPlayTimer();
    } else {
      this.clearTimers();
    }
  }

  exitPresentation() {
    this.clearTimers();
    this.stageOverlay.classList.add('hidden');
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
