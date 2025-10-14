import '../styles/searchResults.css';
import { FaPlus, FaList } from 'react-icons/fa';

const SearchResults = ({ tracks, onAddToPlaylist, onAddToQueue }) => {
  return (
    <ul className="search-results">
      {tracks.map(track => (
        <li key={track.id} className="track-item">
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
              onClick={() => onAddToQueue(track)}
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
