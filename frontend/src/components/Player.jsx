import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import SearchResults from './SearchResults';
import '../styles/player.css'

const Player = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);

  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const query = params.get('q');
    console.log(query);
    if(query) {
      setLoading(true);
      console.log("wysylam requesta",query);
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
    </div>
  );
}

export default Player;
