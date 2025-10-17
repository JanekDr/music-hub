import { useState, useEffect } from 'react';
import Select from 'react-select';
import SearchResults from './SearchResults';
import { authAPI } from '../services/api.jsx';
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
  const [tracks, setTracks] = useState([]);
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
    try {
      const resp = await authAPI.searchTracks(search.trim());
      setTracks(resp.data.tracks.items);
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = (track) => {
    if (!selectedTracks.find(t => t.id === track.id)) {
      setSelectedTracks([...selectedTracks, track]);
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
        url: t.uri,
        name: t.name,
        author: t.artists?.[0]?.name,
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
            placeholder="Wybierz kolaboratorów"
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
                <img src={track.album?.images?.[0]?.url} alt={track.name || "cover"} />
                <div>
                  <b>{track.name} </b>
                  <span>{track.artists?.map(a => a.name).join(', ')}</span>
                </div>
                <button className="track-remove" onClick={() => handleRemoveTrack(track.id)}>
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
        <SearchResults
          tracks={tracks}
          onAddToPlaylist={handleAddToPlaylist}
        />
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
