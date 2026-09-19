// One shared audio element: restart on each slide, continue across theme changes.
class AwardMusicController {
  constructor(audio, toggle, volume, status, translate = key => key) {
    this.audio = audio;
    this.toggle = toggle;
    this.volume = volume;
    this.status = status;
    this.translate = translate;
    this.active = false;
    this.failed = false;
    this.revision = 0;

    let saved;
    try { saved = JSON.parse(localStorage.getItem('award_ceremony_audio')); } catch { /* Optional preference. */ }
    audio.volume = typeof saved?.volume === 'number' && Number.isFinite(saved.volume)
      ? Math.max(0, Math.min(1, saved.volume)) : 0.35;
    audio.muted = saved?.muted === true;

    toggle.addEventListener('click', () => this.toggleSound());
    volume.addEventListener('input', () => {
      audio.volume = Number(volume.value) / 100;
      audio.muted = audio.volume === 0;
      this.savePreferences();
      this.syncControls();
    });
    audio.addEventListener('volumechange', () => this.syncControls());
    audio.addEventListener('error', () => {
      if (this.active) this.showFailure();
    });
    this.syncControls();
  }

  start() {
    this.active = true;
    this.audio.currentTime = 0;
    this.play();
  }

  play() {
    const revision = ++this.revision;
    this.failed = false;
    this.status.textContent = '';
    if (this.audio.error) this.audio.load();
    // Called directly inside the user's click, before requesting fullscreen.
    this.audio.play().then(() => {
      if (revision !== this.revision) return;
      if (!this.active) this.audio.pause();
      this.syncControls();
    }).catch(() => {
      if (revision === this.revision && this.active) this.showFailure();
    });
    this.syncControls();
  }

  stop() {
    this.active = false;
    this.revision++;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.failed = false;
    this.status.textContent = '';
    this.syncControls();
  }

  toggleSound() {
    if (!this.active) {
      this.audio.muted = !(this.audio.muted || this.audio.volume === 0);
      if (!this.audio.muted && this.audio.volume === 0) this.audio.volume = 0.35;
      this.savePreferences();
      this.syncControls();
      return;
    }
    if (this.failed || this.audio.paused) {
      this.audio.muted = false;
      if (this.audio.volume === 0) this.audio.volume = 0.35;
      this.play();
    } else if (this.audio.muted || this.audio.volume === 0) {
      this.audio.muted = false;
      if (this.audio.volume === 0) this.audio.volume = 0.35;
    } else {
      this.audio.muted = true;
    }
    this.savePreferences();
    this.syncControls();
  }

  showFailure() {
    this.failed = true;
    this.status.textContent = this.audio.error
      ? this.translate('musicLoadFailed')
      : this.translate('musicStartFailed');
    this.syncControls();
  }

  syncControls() {
    const silent = this.audio.muted || this.audio.volume === 0;
    const label = this.failed ? this.translate('musicRetry') : silent ? this.translate('musicUnmute') : this.translate('musicMute');
    this.toggle.classList.toggle('is-muted', silent);
    this.toggle.classList.toggle('is-failed', this.failed);
    this.toggle.title = label;
    this.toggle.setAttribute('aria-label', label);
    this.toggle.setAttribute('aria-pressed', String(silent));
    this.volume.value = Math.round(this.audio.volume * 100);
    this.volume.setAttribute('aria-valuetext', `${this.volume.value}%`);
  }

  savePreferences() {
    try {
      localStorage.setItem('award_ceremony_audio', JSON.stringify({
        volume: this.audio.volume,
        muted: this.audio.muted,
      }));
    } catch { /* Playback works even when preference storage is unavailable. */ }
  }
}
