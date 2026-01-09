import {useEffect, useState} from 'react';
import { useLocation } from 'react-router-dom';
import { FaSpotify, FaSoundcloud, FaListAlt, FaMusic } from "react-icons/fa";
import SearchResults from '../components/SearchResults.jsx';
import PlaylistSearchResults from '../components/PlaylistSearchResults.jsx';
import AddToPlaylistModal from '../components/AddToPlaylistModal.jsx';
import '../styles/player.css';
import { spotifyApi } from "../services/spotifyApi.js";
import { soundcloudApi } from "../services/soundcloudApi.js";
import { authAPI } from "../services/api.js";

const Player = () => {
  const [searchMode, setSearchMode] = useState('songs');
  const [spotifyTracks, setSpotifyTracks] = useState([]);
  const [soundcloudTracks, setSoundcloudTracks] = useState([]);
  const [customPlaylists, setCustomPlaylists] = useState([]);

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trackToAdd, setTrackToAdd] = useState(null);

  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const query = params.get('q');
    if (!query) return;

    setLoading(true);

    if (searchMode === 'songs') {
      Promise.all([
        spotifyApi.searchSpotifyTracks(query)
          .then(resp => setSpotifyTracks(resp.data.tracks.items))
          .catch(() => setSpotifyTracks([])),
        soundcloudApi.searchSoundcloudTracks(query)
          .then(resp => setSoundcloudTracks(resp.data || []))
          .catch(() => setSoundcloudTracks([]))
      ]).finally(() => setLoading(false));

    } else {
      authAPI.getPlaylists(query)
        .then(resp => {
            setCustomPlaylists(resp.data);
        })
        .catch(err => {
            console.error("Błąd szukania playlist", err);
            setCustomPlaylists([]);
        })
        .finally(() => setLoading(false));
    }

  }, [search, searchMode]);

  const handleOpenModal = (track) => {
    setIsModalOpen(true);
    setTrackToAdd(track);
  }

  const handleFollowPlaylist = async (slug) => {
    try {
        const response = await authAPI.followPlaylist(slug);
        alert(`Playlist ${response.data.status} successfully!`);
    } catch (error) {
        alert("Follow playlist failed - you already follow this playlist or you are owner.");
    }
  }

  return (
    <div className="player">
      <div className="search-tabs">
        <button
            className={`tab-btn ${searchMode === 'songs' ? 'active' : ''}`}
            onClick={() => setSearchMode('songs')}
        >
            <FaMusic style={{ marginRight: 8 }}/> Utwory
        </button>
        <button
            className={`tab-btn ${searchMode === 'playlists' ? 'active' : ''}`}
            onClick={() => setSearchMode('playlists')}
        >
            <FaListAlt style={{ marginRight: 8 }}/> Playlisty
        </button>
      </div>

      <div className="results-container">

          {loading && <p style={{width: '100%', textAlign: 'center'}}>Szukam...</p>}

          {searchMode === 'songs' && (
            <>
                <div className="results-section">
                    <h3 className="results-header">
                    <FaSpotify style={{color: "#1db954", marginRight:6, fontSize:"1.4em"}} /> Spotify
                    </h3>
                    <SearchResults
                        tracks={spotifyTracks}
                        onAddToPlaylist={(track) => handleOpenModal(track)}
                        platform="spotify"
                    />
                </div>
                <div className="results-section">
                    <h3 className="results-header">
                    <FaSoundcloud style={{color: "#FF5500", marginRight:6, fontSize:"1.3em"}} /> SoundCloud
                    </h3>
                    <SearchResults
                        tracks={soundcloudTracks}
                        onAddToPlaylist={(track) => handleOpenModal(track)}
                        platform="soundcloud"
                    />
                </div>
            </>
          )}

          {searchMode === 'playlists' && (
            <div className="results-section">
                <h3 className="results-header">
                    <FaListAlt style={{color: "#fff", marginRight:6, fontSize:"1.3em"}} /> Znalezione Playlisty
                </h3>
                <PlaylistSearchResults
                    playlists={customPlaylists}
                    onFollow={handleFollowPlaylist}
                />
            </div>
          )}
      </div>

      <AddToPlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        track={trackToAdd}
      />
    </div>
  );
};

export default Player;