import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import SearchResults from './SearchResults';
import { setQueue, setLoading } from '../store/playerSlice';
import '../styles/player.css';

const Player = () => {
  const dispatch = useDispatch();
  const tracks = useSelector(state => state.player.queue);
  const loading = useSelector(state => state.player.loading);
  const deviceId = useSelector(state => state.player.deviceId);
  const spotifyToken = useSelector(state => state.player.spotifyToken);

  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const query = params.get('q');
    if (query) {
      dispatch(setLoading(true));
      authAPI.searchTracks(query)
        .then(resp => dispatch(setQueue(resp.data.tracks.items)))
        .catch(() => dispatch(setQueue([])))
        .finally(() => dispatch(setLoading(false)));
    }
  }, [search, dispatch]);

  function handlePlayTrack(track) {
    if (!deviceId || !spotifyToken) {
      console.warn("Device ID or Spotify token not ready");
      return;
    }

    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      body: JSON.stringify({ uris: [track.uri] }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${spotifyToken}`,
      },
    }).catch(err => console.error("Error playing track:", err));
  }

  return (
    <div className="player">
      {loading && <p>Szukam...</p>}
      <SearchResults tracks={tracks} onPlayTrack={handlePlayTrack} />
    </div>
  );
};

export default Player;
