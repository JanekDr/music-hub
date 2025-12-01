export class SoundcloudAdapter {
  constructor(getCurrentTrack, onStateChangeCb, onTrackEndCb) {
    this.getCurrentTrack = getCurrentTrack;   // zwraca queueTracks[currentTrackIndex]
    this.onStateChangeCb = onStateChangeCb;
    this.onTrackEndCb = onTrackEndCb;

    this.audio = null;
    this._currentUrl = null;
  }

  init() {
    if (this.audio) return;
    console.log("inicjalizowanie soundcloud adapter");
    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";

    audio.addEventListener("play", () => {
      this.onStateChangeCb && this.onStateChangeCb({ playing: true });
    });

    audio.addEventListener("pause", () => {
      this.onStateChangeCb && this.onStateChangeCb({ playing: false });
    });

    audio.addEventListener("timeupdate", () => {
      if (!this.onStateChangeCb) return;
      const duration = audio.duration || 0;
      const position = audio.currentTime * 1000;
      const progress = duration ? (audio.currentTime / duration) * 100 : 0;
      this.onStateChangeCb({ playing: !audio.paused, duration, position, progress });
    });

    audio.addEventListener("ended", () => {
      console.log("[SCAdapter] track ended");
      this.onTrackEndCb && this.onTrackEndCb();
    });

    this.audio = audio;
  }

async playCurrent() {
  if (!this.audio) this.init();

  const item = this.getCurrentTrack();
  const id = item?.track?.track_id;
  if (!id) return;

  const API_BASE_URL = 'http://localhost:8000/api';

  const url = `${API_BASE_URL}/soundcloud/stream/${id}/`;
  console.log('[SCAdapter] stream url', url);

  this.audio.src = url;
  await this.audio.play();
}


  async playUrl(url) {
    if (!this.audio) this.init();
    if (!url) return;

    this._currentUrl = url;
    this.audio.src = url;
    await this.audio.play();
  }

  pause() {
    if (!this.audio) return;
    this.audio.pause();
  }

  resume() {
    if (!this.audio) return;
    this.audio.play();
  }

  setVolume(volume01) {
    if (!this.audio) return;
    this.audio.volume = Math.max(0, Math.min(1, volume01));
  }
}
