import '../styles/searchResults.css';
import { FaPlus, FaList } from 'react-icons/fa';
import {useDispatch} from "react-redux";
import {authAPI} from "../services/api.jsx";
import {setQueue} from "../store/playerSlice.js";

const SearchResults = ({ tracks, onAddToPlaylist, onPlayTrack }) => {
  const dispatch = useDispatch();

  const mapTrackForApi = (track) => ({
    url: track.uri,
    name: track.name,
    author: track.artists ? track.artists.map(a => a.name).join(', ') : track.author
  });

  const handleAddToQueue = async (track) => {
    try {
      const newTrackData = mapTrackForApi(track);
      const response = await authAPI.addTrack(newTrackData);
      const trackId = response.data.id;
      console.log('addToQueue', trackId);
      const updatedQueue = await authAPI.addToQueue({'track_id': trackId});
      dispatch(setQueue(updatedQueue.data));
      console.log(response.data);
    } catch (e) {
      console.error("Error while adding queue", e);
    }
  }

  return (
    <ul className="search-results">
      {tracks.map(track => (
        <li key={track.id} className="track-item" onDoubleClick={() => onPlayTrack(track)}>
          <img
            src={track.album.images?.[0]?.url}
            alt={track.title}
            className="track-image"
          />
          <div className="track-info">
            <b className="track-name">{track.name}</b>
            <span className="track-artists">
              {track.artists.map(a => a.name).join(', ')}
            </span>
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
        </li>
      ))}
    </ul>
  );
};

export default SearchResults;
