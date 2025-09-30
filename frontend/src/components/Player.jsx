import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import SearchResults from './SearchResults';
import '../styles/player.css'
import SpotifyPlayer from "./SpotifyPlayer.jsx";

const Player = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [spotifyToken, setSpotifyToken] = useState(null);

  useEffect(() => {
    authAPI.getSpotifyToken()
      .then(res => setSpotifyToken(res.data.access_token))
      .catch(err => {
        console.log("Error fetching Spotify token", err);
        setSpotifyToken(null);
      });
    console.log("token do spotify: ",spotifyToken);
  }, []);

  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const query = params.get('q');
    if(query) {
      setLoading(true);
      authAPI.searchTracks(query)
        .then(resp => setTracks(resp.data.tracks.items))
        .catch(() => setTracks([]))
        .finally(() => setLoading(false));
    }
  }, [search]);

  return (
    <div className="player">
      {loading && <p>Szukam...</p>}
      <SearchResults tracks={tracks} />
      <br />
      <SpotifyPlayer accessToken={spotifyToken} />
    </div>
  );
}

export default Player;
