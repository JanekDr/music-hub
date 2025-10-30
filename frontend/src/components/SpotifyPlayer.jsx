import { useEffect, useState } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { setSpotifyToken, setDeviceId } from '../store/playerSlice';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaStepBackward, FaStepForward, FaPlay, FaPause } from 'react-icons/fa';
import '../styles/spotifyPlayer.css';

const SpotifyPlayer = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const spotifyToken = useSelector(state => state.player.spotifyToken);
  const deviceId = useSelector(state => state.player.deviceId);

  const [, setPlayer] = useState(null);
  const [, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [trackName, setTrackName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [albumName, setAlbumName] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isAuthenticated && !spotifyToken) {
      authAPI.getSpotifyToken()
        .then(res => dispatch(setSpotifyToken(res.data.access_token)))
        .catch(() => dispatch(setSpotifyToken(null)));
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
        setProgress(state.duration ? state.position / state.duration * 100 : 0);
      });

      playerInstance.connect();
    }
  }, [spotifyToken, dispatch]);

  const pause = () => {
    if (!deviceId) return;
    fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${spotifyToken}` },
    });
  };

  const resume = () => {
    if (!deviceId) return;
    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${spotifyToken}` },
    });
  };

  if (!spotifyToken) return null;

  return (
    <div className="spotify-player-bar">
      <div className="left-section">
        <div className="track-cover-placeholder"></div>
        <div className="track-meta">
          <div className="track-name">{trackName || "Brak utworu"}</div>
          <div className="artist-name">{artistName || "Brak wykonawcy"}</div>
          <div className="album-name">{albumName || ""}</div>
        </div>
      </div>
      <div className="center-section">
        <div className="buttons-section">
          <button aria-label="Previous"><FaStepBackward /></button>
          {playing ? (
            <button onClick={pause} aria-label="Pause"><FaPause /></button>
          ) : (
            <button onClick={resume} aria-label="Resume"><FaPlay /></button>
          )}
          <button aria-label="Next"><FaStepForward /></button>
        </div>
        <div className="progress-bar">
          <div className="progress-filled" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
      <div className="right-section"></div>
    </div>
  );
};

export default SpotifyPlayer;
