import {useEffect, useState} from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { FaSpotify, FaSoundcloud } from "react-icons/fa";
import SearchResults from '../components/SearchResults.jsx';
import '../styles/player.css';
import { spotifyApi } from "../services/spotifyApi.js";
import { soundcloudApi } from "../services/soundcloudApi.js";

const Player = () => {
  const deviceId = useSelector(state => state.player.deviceId);
  const spotifyToken = useSelector(state => state.player.spotifyToken);

  const [spotifyTracks, setSpotifyTracks] = useState([]);
  const [soundcloudTracks, setSoundcloudTracks] = useState([]);
  const [loading, setLoading] = useState(false);

  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const query = params.get('q');
    if (!query) return;

    setLoading(true);
    Promise.all([
      spotifyApi.searchSpotifyTracks(query)
        .then(resp => setSpotifyTracks(resp.data.tracks.items))
        .catch(() => setSpotifyTracks([])),
      soundcloudApi.searchSoundcloudTracks(query)
        .then(resp => setSoundcloudTracks(resp.data || []))
        .catch(() => setSoundcloudTracks([]))
    ]).finally(() => setLoading(false));
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

      <div className="results-section">
        <h3 className="results-header">
          <FaSpotify style={{color: "#1db954", marginRight:6, fontSize:"1.4em"}} /> Spotify
        </h3>
        <SearchResults
            tracks={spotifyTracks}
            onPlayTrack={handlePlayTrack}
            platform="spotify"
        />
      </div>
      <div className="results-section">
        <h3 className="results-header">
          <FaSoundcloud style={{color: "#FF5500", marginRight:6, fontSize:"1.3em"}} /> SoundCloud
        </h3>
        <SearchResults
            tracks={soundcloudTracks}
            onPlayTrack={handlePlayTrack}
            platform="soundcloud"
        />
      </div>
    </div>
  );
};

export default Player;
