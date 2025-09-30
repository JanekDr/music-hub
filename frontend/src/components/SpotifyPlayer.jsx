import { useEffect, useState } from "react";
import '../styles/spotifyPlayer.css'

const SpotifyPlayer = ({ accessToken }) => {
    const [, setPlayer] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    const [ready, setReady] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [trackName, setTrackName] = useState("");
    const [artistName, setArtistName] = useState("");
    const [albumName, setAlbumName] = useState("");

    useEffect(() => {
      if (!accessToken) return;

      if (window.Spotify) {
        initializePlayer();
      } else {
        window.onSpotifyWebPlaybackSDKReady = initializePlayer;
      }

      function initializePlayer() {
        const playerInstance = new window.Spotify.Player({
          name: 'My React Player',
          getOAuthToken: cb => cb(accessToken),
          volume: 0.05,
        });

        setPlayer(playerInstance);

        playerInstance.addListener('ready', ({ device_id }) => {
          setReady(true);
          setDeviceId(device_id);
          console.log('Ready with Device ID', device_id);
        });

        playerInstance.addListener('not_ready', ({ device_id }) => {
          setReady(false);
          console.log('Device ID has gone offline', device_id);
        });

        playerInstance.addListener('player_state_changed', (state) => {
          if (!state) return;
          setPlaying(!state.paused);
          setTrackName(state.track_window.current_track.name);
          setArtistName(state.track_window.current_track.artists.map(a => a.name).join(', '));
          setAlbumName(state.track_window.current_track.album.name);
        });

        playerInstance.connect();
      }
    }, [accessToken]);

    const playTrack = (spotifyUri) => {
        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            body: JSON.stringify({ uris: [spotifyUri] }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });
    };

    const pause = () => {
        fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        })
    }

    const resume = () => {
        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
        })
    }

    return (
        <div>
            <h2>Spotify Web Player SDK</h2>
            <div className="player-info">
              <p>{playing ? "Gra" : "Pauza"}: {trackName} – {artistName} ({albumName})</p>
            </div>
            {ready ? (
                <div className="player-controls">
                  <button aria-label="Play" onClick={() => playTrack("spotify:track:50Sbbkp2amC9mRZgGKObi2")}>
                    ►
                  </button>
                  {playing ? (
                    <button aria-label="Pause" onClick={pause}>
                      ❚❚
                    </button>
                  ) : (
                    <button aria-label="Resume" onClick={resume}>
                      ►
                    </button>
                  )}
                </div>
            ) : (
                <p>Player nie gotowy lub użytkownik nie ma Premium.</p>
            )}
        </div>
    );
};

export default SpotifyPlayer;
