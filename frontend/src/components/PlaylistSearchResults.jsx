import React from 'react';
import { FaEye, FaHeart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../styles/searchResults.css';

const PlaylistSearchResults = ({ playlists, onFollow }) => {
  const navigate = useNavigate();

  if (!playlists || playlists.length === 0) {
    return <div style={{ padding: 20, color: '#aaa' }}>Brak playlist pasujących do wyszukiwania.</div>;
  }

  return (
    <div className="search-result-list">
      {playlists.map((playlist) => (
        <ul key={playlist.slug || playlist.id} className="track-item">
            <div
                style={{
                    width: 40, height: 40, background: '#333', borderRadius: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginRight: 15, fontSize: 20
                }}
            >
                🎵
            </div>

          <div className="track-info">
            <b className="track-name">{playlist.name}</b>
            <span className="track-artists">
                Autor: {playlist.owner?.username || "Nieznany"} • {playlist.tracks?.length || 0} utworów
            </span>
          </div>

          <div className="track-actions">
            <button
              className="icon-btn queue-btn"
              onClick={() => navigate(`/playlist/hub/${playlist.slug}`)}
              title="Pokaż playlistę"
            >
              <FaEye />
            </button>
            <button
              className="icon-btn playlist-btn"
              onClick={() => onFollow(playlist.slug)}
              title="Obserwuj"
            >
              <FaHeart />
            </button>
          </div>
        </ul>
      ))}
    </div>
  );
};

export default PlaylistSearchResults;