import {useEffect, useState} from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import SearchResults from './SearchResults';
import '../styles/player.css';

const Player = () => {
  const deviceId = useSelector(state => state.player.deviceId);
  const spotifyToken = useSelector(state => state.player.spotifyToken);

  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);

  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const query = params.get('q');
    if (query) {
      setLoading(true);
      authAPI.searchTracks(query)
        .then(resp => setTracks(resp.data.tracks.items))
        .catch(() => setTracks([]))
        .finally(() => setLoading(false));
    }
  }, [search]);

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
