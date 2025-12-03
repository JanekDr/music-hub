export class SpotifyAdapter {
  constructor(getToken, getDeviceId, setDeviceIdCb, onStateChangeCb, onTrackEndCb) {
    this.getToken = getToken;
    this.getDeviceId = getDeviceId;
    this.setDeviceIdCb = setDeviceIdCb;
    this.onStateChangeCb = onStateChangeCb;
    this.onTrackEndCb = onTrackEndCb;
    this.player = null;
    this._lastState = null;
  }
  transferPlayback(deviceId) {
    const token = this.getToken();
    if (!token || !deviceId) return;

    return fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        device_ids: [deviceId],
        play: false,
      }),
    });
  }
  init() {
    const initPlayer = () => {
      if (this.player) return;

      const token = this.getToken();

      if (!token) return;

      if (!window.Spotify || !window.Spotify.Player) {
        return;
      }

      const player = new window.Spotify.Player({
        name: "Music-Hub Player",
        getOAuthToken: cb => cb(token),
        volume: 0.05,
      });

      this.player = player;

      player.addListener('ready', async ({ device_id }) => {
        this.setDeviceIdCb(device_id);
      });

      player.addListener("player_state_changed", (state) => {
        if (!state) return;
        if (this.onStateChangeCb) this.onStateChangeCb(state);

        if (
          this._lastState &&
          !this._lastState.paused &&
          state.paused &&
          state.position === 0 &&
          state.track_window.previous_tracks
            .some(t => t.id === this._lastState.track_window.current_track.id)
        ) {
          if (this.onTrackEndCb) this.onTrackEndCb();
        }

        this._lastState = state;
      });

      player.connect();
    };

  window.onSpotifyWebPlaybackSDKReady = initPlayer;
  if (window.Spotify) initPlayer();
}

  setVolume(volume01) {
    if (!this.player) return;
    const v = Math.max(0, Math.min(1, volume01));
    this.player.setVolume(v);
  }

  playUris(uris) {
    const token = this.getToken();
    const deviceId = this.getDeviceId();
    console.log("[Adapter] playUris", { deviceId, uris });

    if (!token || !deviceId || !uris?.length) return;

    return fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      body: JSON.stringify({ uris }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).then(res => res.text().then(t => console.log("[Adapter] playUris response", res.status, t)));
  }

  pause() {
    const token = this.getToken();
    const deviceId = this.getDeviceId();
    if (!token || !deviceId) return;

    return fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  }

  resume() {
    const token = this.getToken();
    const deviceId = this.getDeviceId();
    if (!token || !deviceId) return;

    return fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  }
}
