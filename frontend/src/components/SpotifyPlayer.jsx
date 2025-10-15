import { useEffect, useState } from "react";
import '../styles/spotifyPlayer.css';
import { FaStepBackward, FaStepForward, FaPlay, FaPause } from 'react-icons/fa';

const SpotifyPlayer = ({ accessToken, providePlayFunction }) => {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [trackName, setTrackName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [albumName, setAlbumName] = useState("");
  const [progress, setProgress] = useState(0);


  useEffect(() => {
    if (!accessToken) return;

    if (window.Spotify) {
      initializePlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = initializePlayer;
    }

    function initializePlayer() {
      console.log("Initializing Spotify Player...");
      const playerInstance = new window.Spotify.Player({
        name: "React Music-Hub Player",
        getOAuthToken: cb => cb(accessToken),
        volume: 0.05,
      });

      setPlayer(playerInstance);

      playerInstance.addListener("ready", ({ device_id }) => {
        setReady(true);
        setDeviceId(device_id);
        console.log("Ready with Device ID", device_id);
      });

      playerInstance.addListener("not_ready", ({ device_id }) => {
        setReady(false);
        console.log("Device ID has gone offline", device_id);
      });
      playerInstance.addListener("initialization_error", e => console.error("Init error", e));
      playerInstance.addListener("authentication_error", e => console.error("Auth error", e));
      playerInstance.addListener("account_error", e => console.error("Account error", e));
      playerInstance.addListener("playback_error", e => console.error("Playback error", e));

      playerInstance.addListener("player_state_changed", (state) => {
        if (!state) return;
        setPlaying(!state.paused);
        setTrackName(state.track_window.current_track.name);
        setArtistName(state.track_window.current_track.artists.map(a => a.name).join(", "));
        setAlbumName(state.track_window.current_track.album.name);

        const duration_ms = state.duration;
        const position_ms = state.position;
        setProgress(position_ms / duration_ms * 100);
      });

      playerInstance.connect();
    }
  }, [accessToken]);

  // Funkcja odtwarzania udostępniana rodzicowi (callback)
  useEffect(() => {
    if (providePlayFunction && deviceId) {
      console.log("Providing play function");
      providePlayFunction(playTrack);
    }
  }, [deviceId]);

  const playTrack = (spotifyUri) => {
    if (!deviceId) {
      console.warn("Device ID not ready");
      return;
    }
    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      body: JSON.stringify({ uris: [spotifyUri] }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  };

  const pause = () => {
    fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  };

  const resume = () => {
    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  };

  return (
    <div className="spotify-player-bar">
      <div className="left-section">
        <div className="track-cover-placeholder">
        {/*  dodac obrazek */}
        </div>
        <div className="track-meta">
          <div className="track-name">{trackName || "Brak utworu"}</div>
          <div className="artist-name">{artistName || "Brak wykonawcy"}</div>
          <div className="album-name">{albumName || ""}</div>
        </div>
      </div>

      <div className="center-section">
        <div className="buttons-section">
          <button aria-label="Previous">
            <FaStepBackward />
          </button>
          <button onClick={() => playTrack("spotify:track:3piNWwmgQXO4YzamCZQcTh")}>
            <FaPlay />
            zagraj sentino
          </button>
          {playing ? (
            <button onClick={pause} aria-label="Pause">
              <FaPause />
            </button>
          ) : (
            <button onClick={resume} aria-label="Resume">
              <FaPlay />
            </button>
          )}
          <button aria-label="Next">
            <FaStepForward />
          </button>
        </div>
        <div className="progress-bar">
          <div className="progress-filled" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="right-section">
        {/* Volume, queue, lub inne kontrolki tutaj */}
      </div>
    </div>
  );
};

export default SpotifyPlayer;
