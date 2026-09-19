// Classic scripts and local stylesheets also work when index.html is opened via file://.
window.AwardThemes = new Map();

class AwardThemeManager {
  constructor(root, catalog) {
    this.root = root;
    this.catalog = catalog;
    this.current = null;
    this.award = { category: '得獎組別', team: '獲獎隊伍' };
    this.visible = false;
    this.revealed = false;
    this.revision = 0;
    this.scripts = new Map();
  }

  assetUrl(path) {
    if (!this.catalog.assetVersion) return path;
    const url = new URL(path, document.baseURI);
    url.searchParams.set('v', this.catalog.assetVersion);
    return url.href;
  }

  loadScript(theme) {
    if (window.AwardThemes.has(theme.id)) return Promise.resolve();
    if (this.scripts.has(theme.id)) return this.scripts.get(theme.id);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = this.assetUrl(theme.script);
      script.onload = () => {
        script.remove();
        if (typeof window.AwardThemes.get(theme.id) === 'function') resolve();
        else reject(new Error(`皮膚未註冊：${theme.id}`));
      };
      script.onerror = () => {
        script.remove();
        reject(new Error(`無法載入皮膚：${theme.name}`));
      };
      document.head.append(script);
    }).catch(error => {
      this.scripts.delete(theme.id);
      throw error;
    });
    this.scripts.set(theme.id, promise);
    return promise;
  }

  async select(id) {
    const theme = this.catalog.themes.find(item => item.id === id);
    if (!theme) throw new Error(`找不到皮膚：${id}`);
    const revision = ++this.revision;
    if (this.current?.id === id) return true;

    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = this.assetUrl(theme.stylesheet);
    stylesheet.media = 'not all';
    stylesheet.dataset.awardThemeStyle = id;
    const styleReady = new Promise((resolve, reject) => {
      stylesheet.onload = resolve;
      stylesheet.onerror = () => reject(new Error(`無法載入皮膚樣式：${theme.name}`));
    });
    document.head.append(stylesheet);
    let instance;
    try {
      await Promise.all([styleReady, this.loadScript(theme)]);
      // A slower, earlier selection must not overwrite the user's latest choice.
      if (revision !== this.revision) {
        stylesheet.remove();
        return false;
      }
      const host = document.createElement('div');
      host.className = 'theme-surface';
      host.dataset.theme = id;
      stylesheet.media = 'all';
      instance = window.AwardThemes.get(id)(host);
      for (const method of ['update', 'setVisible', 'destroy']) {
        if (typeof instance?.[method] !== 'function') throw new Error(`皮膚缺少 ${method}：${id}`);
      }
      if (this.revealed || !instance.prepare) instance.update({ ...this.award });
      else instance.prepare({ ...this.award });
      instance.setVisible(this.visible);
      const previous = this.current;
      this.root.replaceChildren(host);
      this.current = { id, instance, stylesheet };
      if (previous) {
        try { previous.instance.destroy(); }
        catch (error) { console.error('皮膚清理失敗', error); }
        previous.stylesheet.remove();
      }
      return true;
    } catch (error) {
      try { instance?.destroy?.(); } finally { stylesheet.remove(); }
      if (revision !== this.revision) return false;
      throw error;
    }
  }

  update(award) {
    this.award = {
      category: award.category || '得獎獎項',
      team: award.team || '獲獎隊伍',
    };
    this.revealed = false;
    const instance = this.current?.instance;
    if (instance?.prepare) instance.prepare({ ...this.award });
    else instance?.update({ ...this.award });
  }

  reveal() {
    if (this.revealed || !this.visible || !this.current) return;
    this.revealed = true;
    this.current.instance.update({ ...this.award });
  }

  setVisible(visible) {
    this.visible = visible;
    this.current?.instance.setVisible(visible);
  }

  destroy() {
    this.revision++;
    try { this.current?.instance.destroy(); }
    finally {
      this.current?.stylesheet.remove();
      this.current = null;
      this.root.replaceChildren();
    }
  }
}
