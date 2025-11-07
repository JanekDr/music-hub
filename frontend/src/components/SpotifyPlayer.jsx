import { useEffect, useState } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { setSpotifyToken, setDeviceId, setQueue, setCurrentTrackIndex } from '../store/playerSlice';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaStepBackward, FaStepForward, FaPlay, FaPause, FaMinus, FaWindowMinimize } from 'react-icons/fa';
import '../styles/spotifyPlayer.css';
import {PiQueueBold} from "react-icons/pi";

const SpotifyPlayer = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const spotifyToken = useSelector(state => state.player.spotifyToken);
  const deviceId = useSelector(state => state.player.deviceId);
  const queue = useSelector(state => state.player.queue);
  const currentTrackIndex = useSelector(state => state.player.currentTrackIndex || 0);
  const queueTracks = (queue[0]?.queue_tracks) || [];

  const [, setPlayer] = useState(null);
  const [, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [trackName, setTrackName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [albumName, setAlbumName] = useState("");
  const [progress, setProgress] = useState(0);
  const [trackImg, setTrackImg] = useState("");
  const [showQueue, setShowQueue] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !spotifyToken) {
      authAPI.getSpotifyToken()
        .then(res => dispatch(setSpotifyToken(res.data.access_token)))
        .catch(() => dispatch(setSpotifyToken(null)));
      authAPI.getQueue()
        .then(res => dispatch(setQueue(res.data)))
        .catch(() => dispatch(setQueue([])));
    }
  }, [isAuthenticated, spotifyToken, dispatch]);

  useEffect(() => {
    if (!spotifyToken) return;

    window.onSpotifyWebPlaybackSDKReady = () => {
      initializePlayer();
    };

    if (window.Spotify) {
      initializePlayer();
    }

    function initializePlayer() {
      const playerInstance = new window.Spotify.Player({
        name: "Music-Hub Player",
        getOAuthToken: cb => cb(spotifyToken),
        volume: 0.05,
      });

      setPlayer(playerInstance);

      playerInstance.addListener("ready", ({ device_id }) => {
        setReady(true);
        dispatch(setDeviceId(device_id));
      });

      playerInstance.addListener("not_ready", ({ device_id }) => {
        setReady(false);
        console.log("Device ID has gone offline", device_id);
      });

      playerInstance.addListener("player_state_changed", (state) => {
        if (!state) return;
        setPlaying(!state.paused);
        setTrackName(state.track_window.current_track.name);
        setArtistName(state.track_window.current_track.artists.map(a => a.name).join(", "));
        setAlbumName(state.track_window.current_track.album.name);
        setTrackImg(state.track_window.current_track.album.images?.[0]?.url)
        setProgress(state.duration ? state.position / state.duration * 100 : 0);
      });

      playerInstance.connect();
    }
  }, [spotifyToken, dispatch]);

  const playQueue = () => {
    const queueTracks = (queue[0]?.queue_tracks) || [];
    if (
      queueTracks.length > 0 &&
      deviceId &&
      spotifyToken
    ) {
      const trackUri = queueTracks[0].track.url;
      fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        body: JSON.stringify({ uris: [trackUri] }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${spotifyToken}`,
        },
      })
      .then(res => res.text().then(text => console.log("playQueue response", res.status, text)));
    } else {
      console.warn("Brak danych do odtworzenia kolejki lub niegotowy player!", { queue, deviceId, spotifyToken });
    }
  };


  const pause = () => {
    if (!deviceId) return;
    fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${spotifyToken}` },
    });
  };

  const resume = () => {
    if (!deviceId) return;

    if (playing) {
      fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${spotifyToken}` }
      });
    } else {
      fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${spotifyToken}`,
        },
      });
    }
  };

  const next = () => {
    if (
      queueTracks.length > 0 &&
      currentTrackIndex + 1 < queueTracks.length &&
      deviceId &&
      spotifyToken
    ) {
      const nextIndex = currentTrackIndex + 1;
      dispatch(setCurrentTrackIndex(nextIndex));
      const nextUri = queueTracks[nextIndex].track.url;
      fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        body: JSON.stringify({ uris: [nextUri] }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${spotifyToken}`,
        },
      });
    }
  };

  const previous = () => {
    if (
      queueTracks.length > 0 &&
      currentTrackIndex > 0 &&
      deviceId &&
      spotifyToken
    ) {
      const prevIndex = currentTrackIndex - 1;
      dispatch(setCurrentTrackIndex(prevIndex));
      const prevUri = queueTracks[prevIndex].track.url;
      fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        body: JSON.stringify({ uris: [prevUri] }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${spotifyToken}`,
        },
      });
    }
  };

  const handleRemove = async (id) => {
    const updatedQueue = queueTracks.filter(track => track.id !== id);
    try {
      await authAPI.removeFromQueue({ data: { queue_track_id: id } })
      dispatch(setQueue([{...queue[0], queue_tracks: updatedQueue}]));
    } catch (e) {
      console.log(e.details);
    }
  }

  if (!spotifyToken && isAuthenticated) return null;

  return (
      <div style={{position: 'relative'}}>
        <div className="spotify-player-bar">
          <div className="left-section">
            <div className="track-cover-placeholder">
              <img
                src={trackImg}
                alt={trackName}
                className="track-image"
              />
            </div>
            <div className="track-meta">
              <div className="track-name">{trackName || "Brak utworu"}</div>
              <div className="artist-name">{artistName || "Brak wykonawcy"}</div>
              <div className="album-name">{albumName || ""}</div>
            </div>
          </div>
          <div className="center-section">
            <div className="buttons-section">
              <button onClick={previous} aria-label="Previous"><FaStepBackward /></button>
              {playing ? (
                <button onClick={pause} aria-label="Pause"><FaPause /></button>
              ) : (
                <button onClick={resume} aria-label="Resume"><FaPlay /></button>
              )}
              <button onClick={next} aria-label="Next"><FaStepForward /></button>
              <button onClick={playQueue} aria-label="Play queue">Play queue</button>
            </div>
            <div className="progress-bar">
              <div className="progress-filled" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          <div className="right-section">
              <button onClick={()=>{setShowQueue(!showQueue)}} aria-label=""><PiQueueBold /></button>
          </div>
        </div>
        {showQueue && (
          <div className="queue-sidebar">
            <div className="queue-header">
              <span>Kolejka</span>
              <button onClick={() => setShowQueue(false)}><FaWindowMinimize /></button>
            </div>
            <ul className="queue-list">
              {queueTracks.length === 0
                ? <li>Brak utworów w kolejce</li>
                : queueTracks.map((q, idx) => (
                    <li key={q.id} className={idx === currentTrackIndex ? "active-track" : ""}>
                      {/*<img src={q.track.image} alt={q.track.name} style={{ width: 40, height: 40 }} />*/}
                      <div>
                        <div>{q.track.name}</div>
                        <div>{q.track.author}</div>
                      </div>
                      <button
                        onClick={() => handleRemove(q.id)}
                        aria-label="Usuń utwór"
                        className="remove-btn"
                      >&minus;
                      </button>
                    </li>
                ))
              }
            </ul>
          </div>
        )}
      </div>
  );
};

export default SpotifyPlayer;

//problem jest taki ze jak sie dodaje na biezaco do kolejki nowe utwory to kolejka sie nie aktualizuje od razu i trzeba odswiezac przegladarke
//propozycja rozwiazania: przechowywac kolejke lokalnie-na froncie i pozniej przesylac ją do backendu