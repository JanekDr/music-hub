import soundcloudApi from "../services/soundcloudApi.js";

export class SoundcloudAdapter {
  constructor(
    getCurrentTrack,
    onStateChangeCb,
    onTrackInfoChangeCb,
    onTrackEndCb
  ) {
    this.getCurrentTrack = getCurrentTrack;
    this.onStateChangeCb = onStateChangeCb;
    this.onTrackInfoChangeCb = onTrackInfoChangeCb;
    this.onTrackEndCb = onTrackEndCb;

    this.audio = null;
    this._lastTrackId = null;
  }

  init() {
    if (this.audio) return;

    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";

    audio.addEventListener("play", () => {
      this.onStateChangeCb?.({ playing: true });
    });

    audio.addEventListener("pause", () => {
      this.onStateChangeCb?.({ playing: false });
    });

    audio.addEventListener("timeupdate", () => {
      if (!this.onStateChangeCb) return;

      const duration = audio.duration || 0;
      const position = audio.currentTime * 1000;
      const progress = duration ? (audio.currentTime / duration) * 100 : 0;

      this.onStateChangeCb({
        playing: !audio.paused,
        duration,
        position,
        progress
      });
    });

    audio.addEventListener("loadedmetadata", () => {
      this.updateTrackInfo();
    });

    audio.addEventListener("ended", () => {
      this.onTrackEndCb?.();
    });

    this.audio = audio;
  }

   async updateTrackInfo() {
    const item = this.getCurrentTrack();
    if (!item?.track) return;
    const track = await soundcloudApi.getTrackData(item.track.track_id);

    if (this.onTrackInfoChangeCb && item.track.track_id !== this._lastTrackId) {
      this.onTrackInfoChangeCb({
        trackName: track.data.title,
        artistName: track.data.user.username || "Unknown",
        albumName: track.data.playlist_title || "Single",
        trackImg: track.data.artwork_url || track.data.user.avatar_url,
      });
      this._lastTrackId = track.track_id;
    }
  }

  async playCurrent() {
    if (!this.audio) this.init();

    const item = this.getCurrentTrack();
    const id = item?.track?.track_id;
    if (!id) return;

    const API_BASE_URL = 'http://localhost:8000/api';
    const url = `${API_BASE_URL}/soundcloud/stream/${id}/`;

    this.updateTrackInfo();

    this.audio.src = url;
    await this.audio.play();
  }

  setVolume(volume01) {
    if (!this.audio) return;
    this.audio.volume = Math.max(0, Math.min(1, volume01));
  }

  async pause() {
    if (!this.audio) return;
    this.audio.pause();
  }

  async resume() {
    if (!this.audio) return;

    if (!this.audio.src){
      await this.playCurrent();
    }
    await this.audio.play();
  }

  stop() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.src = "";
  }
}
