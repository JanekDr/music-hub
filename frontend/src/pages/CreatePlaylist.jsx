import { useState, useEffect } from 'react';
import Select from 'react-select';
import SearchResults from '../components/SearchResults.jsx';
import { authAPI } from '../services/api.js';
import { soundcloudApi } from '../services/soundcloudApi.js';
import { spotifyApi } from '../services/spotifyApi.js';
import '../styles/createPlaylist.css';

const CreatePlaylist = () => {
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      background: '#181818',
      color: '#fafafa',
      borderColor: state.isFocused ? '#1db954' : '#232',
      borderRadius: 8,
      fontSize: '1.08rem',
      minHeight: '40px',
      boxShadow: state.isFocused ? '0 0 0 1.5px #1db954' : 'none',
      transition: 'border-color 0.17s, box-shadow 0.17s'
    }),
    menu: (provided) => ({
      ...provided,
      background: '#212922',
      color: '#fafafa',
    }),
    option: (provided, state) => ({
      ...provided,
      background: state.isFocused ? '#272' : '#1c1f1c',
      color: state.isSelected ? '#ffffff' : '#fafafa',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#f4ffe0',
      fontWeight: 550,
    }),
    multiValue: (provided) => ({
      ...provided,
      background: '#21d661',
      color: '#141818',
      borderRadius: 7,
      fontWeight: 'bold',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#1a1a1a',
      fontWeight: 700,
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      backgroundColor: 'transparent',
      color: '#fff',
      ':hover': {
        backgroundColor: '#a1001f',
        color: 'white',
      },
    }),
    input: (provided) => ({
      ...provided,
      color: '#fafafa',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: '#1db954',
    }),
  };


  const [playlistName, setPlaylistName] = useState('');
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [selectedCollaborators, setSelectedCollaborators] = useState([]);
  const [isPublic, setIsPublic] = useState(false);

  const [search, setSearch] = useState('');
  const [spotifyTracks, setSpotifyTracks] = useState([]);
  const [soundcloudTracks, setSoundcloudTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [, setTracks] = useState([]);

  useEffect(() => {
    authAPI.users()
      .then(res => setCollaborators(res.data))
      .catch(() => setCollaborators([]));
  }, []);

  const collaboratorsOptions = collaborators.map(u => ({
    value: u.id,
    label: u.username || u.email
  }));

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    Promise.all([
      spotifyApi.searchSpotifyTracks(search)
        .then(resp => setSpotifyTracks(resp.data.tracks.items))
        .catch(() => setSpotifyTracks([])),
      soundcloudApi.searchSoundcloudTracks(search)
        .then(resp => setSoundcloudTracks(resp.data || []))
        .catch(() => setSoundcloudTracks([]))
    ]).finally(() => setLoading(false));
  };

  const handleAddToPlaylist = (track, platform) => {
    const unified = platform === 'spotify'
      ? {
          id: track.id,
          url: track.uri,
          name: track.name,
          artists: track.artists.map(a => a.name).join(', '),
          image: track.album?.images?.[0]?.url || ''
        }
      : {
          id: track.id,
          url: track.uri || track.permalink_url,
          name: track.title,
          artists: track.user?.username || track.user?.full_name || '',
          image: track.artwork_url || track.user?.avatar_url || ''
        };

    if (!selectedTracks.find(t => t.id === unified.id)) {
      setSelectedTracks(prev => [...prev, unified]);
    }
  };


  const handleRemoveTrack = (id) => {
    setSelectedTracks(selectedTracks.filter(t => t.id !== id));
  };

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      alert("Podaj nazwę playlisty!");
      return;
    }
    const payload = {
      name: playlistName,
      tracks: selectedTracks.map(t => ({
        track_id: t.id,
        url: t.url,
        name: t.name,
        author: t.artists,
      })),
      collaborators: selectedCollaborators.map(opt => opt.value),
      followers: [],
      is_public: isPublic,
    };
    try {
      await authAPI.createPlaylist(payload);
      alert("Playlista utworzona!");
      setPlaylistName('');
      setSelectedTracks([]);
      setSelectedCollaborators([]);
      setIsPublic(false);
      setSearch('');
      setTracks([]);
    } catch {
        alert("An error occurred.");
    }
  };

  return (
    <div className="playlist-root-grid">
      <div className="playlist-left-panel">
        <div className="playlist-form-card">
          <h2>Utwórz playlistę</h2>
          <input
            type="text"
            value={playlistName}
            onChange={e => setPlaylistName(e.target.value)}
            placeholder="Nazwa playlisty"
            maxLength={100}
          />
          <Select
            isMulti
            value={selectedCollaborators}
            onChange={setSelectedCollaborators}
            options={collaboratorsOptions}
            placeholder="Wybierz współtwórców"
            className="collaborator-multiselect"
            styles={customSelectStyles}
          />
          <label className="public-check">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={e => setIsPublic(e.target.checked)}
            /> Publiczna playlista
          </label>
        </div>
        <div className="playlist-picked">
          <h3 className="selected-tracks">Wybrane utwory ({selectedTracks.length})</h3>
          <ul className="track-list">
            {selectedTracks.map(track => (
              <li key={track.url}>
                <img src={track.image} alt={track.name || "cover"} />
                <div>
                  <b>{track.name} </b>
                  <span>{track.artists}</span>
                </div>
                <button
                  className="track-remove"
                  onClick={() => handleRemoveTrack(track.id)}
                >
                  Usuń
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="playlist-right-panel">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Wyszukaj utwór lub wykonawcę"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Szukam...' : 'Szukaj'}
          </button>
        </form>

        <div className="playlist-results-wrapper">
          <div className="results-section">
            <h3 className="results-header">Spotify</h3>
            <SearchResults
              tracks={spotifyTracks}
              onAddToPlaylist={(track) => handleAddToPlaylist(track, 'spotify')}
              platform="spotify"
            />
          </div>

          <div className="results-section">
            <h3 className="results-header">SoundCloud</h3>
            <SearchResults
              tracks={soundcloudTracks}
              onAddToPlaylist={(track) => handleAddToPlaylist(track, 'soundcloud')}
              platform="soundcloud"
            />
          </div>
        </div>

        <button
          className="create-btn fixed-bottom-btn"
          onClick={handleCreatePlaylist}
          disabled={!playlistName || selectedTracks.length === 0}
        >
          Zapisz playlistę
        </button>
      </div>
    </div>
  );
};

export default CreatePlaylist;
