import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import SearchResults from '../components/SearchResults.jsx';
import { authAPI } from '../services/api.js';
import { soundcloudApi } from '../services/soundcloudApi.js';
import { spotifyApi } from '../services/spotifyApi.js';
import '../styles/createPlaylist.css';

const visibilityOptions = [
    { value: 'public', label: 'Wszystkich (Publiczna)' },
    { value: 'private', label: 'Nikogo (Prywatna)' },
    { value: 'unlisted', label: 'Osób z linkiem (Niepubliczna)' }
];

const CreatePlaylist = () => {
  const navigate = useNavigate();

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
      cursor: 'pointer'
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

  const [visibility, setVisibility] = useState(visibilityOptions[1]);

  const [search, setSearch] = useState('');
  const [spotifyTracks, setSpotifyTracks] = useState([]);
  const [soundcloudTracks, setSoundcloudTracks] = useState([]);
  const [loading, setLoading] = useState(false);

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
          image_url: track.album.images[0].url || '',
          track_duration: track.duration_ms
        }
      : {
          id: track.id,
          url: track.uri || track.permalink_url,
          name: track.title,
          artists: track.user?.username || '',
          image_url: track.artwork_url || track.user.avatar_url || '',
          track_duration: track.duration
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
        track_duration: t.track_duration,
        image_url: t.image_url
      })),
      collaborators: selectedCollaborators.map(opt => opt.value),
      followers: [],
      visibility: visibility.value,
      is_public: visibility.value === 'public',
    };

    try {
      const response = await authAPI.createPlaylist(payload);

      let alertMessage = "Playlista utworzona pomyślnie!";

      if (visibility.value === 'unlisted') {
          const newPlaylistId = response.data.slug;

          if (newPlaylistId) {
              const link = `${window.location.origin}/playlist/hub/${newPlaylistId}`;
              try {
                  await navigator.clipboard.writeText(link);
                  alertMessage += "\nLink został automatycznie skopiowany do schowka!";
              } catch (clipErr) {
                  console.error("Błąd schowka:", clipErr);
                  alertMessage += "\nNie udało się automatycznie skopiować linku.";
              }
          }
      }

      alert(alertMessage);

      setPlaylistName('');
      setSelectedTracks([]);
      setSelectedCollaborators([]);
      setVisibility(visibilityOptions[1]);
      setSearch('');

      if (response.data.id) navigate(`/playlist/hub/${response.data.slug}`);

    } catch (error) {
        console.error("Create playlist error:", error);
        alert("Wystąpił błąd podczas tworzenia playlisty.");
    }
  };

  return (
    <div className="playlist-root-grid">
      <div className="playlist-left-panel">
        <div className="playlist-form-card">
          <h2>Utwórz playlistę</h2>
          <label className="input-label">Nazwa</label>
          <input
            type="text"
            value={playlistName}
            onChange={e => setPlaylistName(e.target.value)}
            maxLength={100}
          />

          <label className="input-label">Współtwórcy</label>
          <Select
            isMulti
            value={selectedCollaborators}
            onChange={setSelectedCollaborators}
            options={collaboratorsOptions}
            placeholder="Wybierz współtwórców..."
            className="collaborator-multiselect"
            styles={customSelectStyles}
          />

          <label className="input-label" style={{marginTop: '15px'}}>Udostępnij playlistę dla:</label>
          <Select
              value={visibility}
              onChange={setVisibility}
              options={visibilityOptions}
              styles={customSelectStyles}
              isSearchable={false}
          />

          {visibility.value === 'unlisted' && (
              <p style={{fontSize: '0.8rem', color: '#888', marginTop: '5px'}}>
                  Link zostanie skopiowany do schowka po utworzeniu playlisty.
              </p>
          )}

        </div>
        <div className="playlist-picked">
          <h3 className="selected-tracks">Wybrane utwory ({selectedTracks.length})</h3>
          <ul className="track-list">
            {selectedTracks.map(track => (
              <li key={track.url}>
                <img src={track.image_url} alt={track.name || "cover"} />
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
          disabled={!playlistName}
        >
          Zapisz playlistę
        </button>
      </div>
    </div>
  );
};

export default CreatePlaylist;