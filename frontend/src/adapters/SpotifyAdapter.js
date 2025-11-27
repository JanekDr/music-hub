export class SpotifyAdapter {
  constructor(getToken, getDeviceId, setDeviceIdCb, onStateChangeCb) {
    this.getToken = getToken;
    this.getDeviceId = getDeviceId;
    this.setDeviceIdCb = setDeviceIdCb;
    this.onStateChangeCb = onStateChangeCb;
    this.player = null;
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
      getOAuthToken: cb => cb(token),
      volume: 0.05,
    });

    this.player = player;

    player.addListener("ready", ({ device_id }) => {
      this.setDeviceIdCb(device_id);
    });

    player.addListener("player_state_changed", (state) => {
      if (!state) return;
      if (this.onStateChangeCb) this.onStateChangeCb(state);
    });

    player.connect();
  };

  window.onSpotifyWebPlaybackSDKReady = initPlayer;
  if (window.Spotify) initPlayer();
}


  playUris(uris) {
    const token = this.getToken();
    const deviceId = this.getDeviceId();
    if (!token || !deviceId || !uris?.length) return;

    return fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      body: JSON.stringify({ uris }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
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
