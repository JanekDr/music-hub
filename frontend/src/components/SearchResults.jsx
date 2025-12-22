import '../styles/searchResults.css';
import { FaPlus, FaList } from 'react-icons/fa';
import {useDispatch} from "react-redux";
import {authAPI} from "../services/api.js";
import {setQueue} from "../store/playerSlice.js";

const SearchResults = ({ tracks, platform, onAddToPlaylist, onPlayTrack }) => {
  const dispatch = useDispatch();

  const mapTrackForApi = (track) => {
    if (platform === 'spotify') {
      return {
        track_id: track.id,
        url: track.uri,
        name: track.name,
        author: track.artists.map(a => a.name).join(', '),
        track_duration: track.duration_ms,
        image_url: track.album.images[0].url
      };
    }
    // SoundCloud
    return {
      track_id: track.id,
      url: track.uri,
      name: track.title,
      author: track.user?.username || '',
      track_duration: track.duration,
      image_url: track.artwork_url || track.user.avatar_url || ''
    };
  };

  const renderTrackItem = (track) => {
    let img = '';
    let name = '';
    let artists = '';
    if (platform === 'spotify') {
      img = track.album.images[0].url || '';
      name = track.name;
      artists = track.artists.map(a => a.name).join(', ');
    } else {
      img = track.artwork_url || track.user.avatar_url || '';
      name = track.title;
      artists = track.user.username || '';
    }

    return (
      <div className="search-result-list">
        <ul key={track.id || track.uri || track.permalink_url} className="track-item" onDoubleClick={() => onPlayTrack(track)}>
          <img
            src={img}
            alt={name}
            className="track-image"
          />
          <div className="track-info">
            <b className="track-name">{name}</b>
            <span className="track-artists">{artists}</span>
          </div>
          <div className="track-actions">
            <button
              className="icon-btn playlist-btn"
              onClick={() => onAddToPlaylist(track)}
              title="Dodaj do playlisty"
            >
              <FaPlus />
            </button>
            <button
              className="icon-btn queue-btn"
              onClick={()=>handleAddToQueue(track)}
              title="Dodaj do kolejki"
            >
              <FaList />
            </button>
          </div>
        </ul>
      </div>
    );
  };

  const handleAddToQueue = async (track) => {
    try {
      const newTrackData = mapTrackForApi(track);
      const newTrack = await authAPI.addTrack(newTrackData);
      await authAPI.addToQueue({'track_id': newTrack.data.id});
      const queueResponse = await authAPI.getQueue();
      dispatch(setQueue(queueResponse.data));
    } catch (e) {
      console.error("Error while adding queue", e);
    }
  };

  return (
    <ul className="search-results">
      {tracks.map(renderTrackItem)}
    </ul>
  );
};

export default SearchResults;
