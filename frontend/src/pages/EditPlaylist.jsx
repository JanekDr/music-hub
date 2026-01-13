import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import SearchResults from '../components/SearchResults.jsx';

import { authAPI } from '../services/api.js';
import { soundcloudApi } from '../services/soundcloudApi.js';
import { spotifyApi } from '../services/spotifyApi.js';

import { FaArrowLeft, FaSave, FaTrash, FaCopy, FaCheck } from 'react-icons/fa';
import '../styles/createPlaylist.css';
import { mapTrackToApiPayload } from "../services/mapTrackToApiPayload.js";

const visibilityOptions = [
    { value: 'public', label: 'Wszystkich (Publiczna)' },
    { value: 'private', label: 'Nikogo (Prywatna)' },
    { value: 'unlisted', label: 'Osób z linkiem (Niepubliczna)' }
];

const EditPlaylist = () => {
    const { id } = useParams();
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
            ...provided, color: '#f4ffe0', fontWeight: 550,
        }),
        multiValue: (provided) => ({
            ...provided, background: '#21d661', color: '#141818', borderRadius: 7, fontWeight: 'bold',
        }),
        multiValueLabel: (provided) => ({
            ...provided, color: '#1a1a1a', fontWeight: 700,
        }),
        multiValueRemove: (provided) => ({
            ...provided, backgroundColor: 'transparent', color: '#fff', ':hover': { backgroundColor: '#a1001f', color: 'white', },
        }),
        input: (provided) => ({ ...provided, color: '#fafafa' }),
        dropdownIndicator: (provided) => ({ ...provided, color: '#1db954' }),
    };

    const [playlistName, setPlaylistName] = useState('');
    const [currentTracks, setCurrentTracks] = useState([]);
    const [visibility, setVisibility] = useState(visibilityOptions[1]); // Domyślnie prywatna
    const [copied, setCopied] = useState(false); // Stan dla potwierdzenia skopiowania

    const [allUsers, setAllUsers] = useState([]);
    const [selectedCollaborators, setSelectedCollaborators] = useState([]);

    const [search, setSearch] = useState('');
    const [spotifyResults, setSpotifyResults] = useState([]);
    const [soundcloudResults, setSoundcloudResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [playlistRes, usersRes] = await Promise.all([
                    authAPI.getUserPlaylist(id),
                    authAPI.users()
                ]);

                const playlist = playlistRes.data;
                const users = usersRes.data;

                setPlaylistName(playlist.name);
                setCurrentTracks(playlist.tracks);
                setAllUsers(users);

                if (playlist.visibility) {
                    const foundOption = visibilityOptions.find(opt => opt.value === playlist.visibility);
                    if (foundOption) setVisibility(foundOption);
                } else {
                    setVisibility(playlist.is_public ? visibilityOptions[0] : visibilityOptions[1]);
                }

                if (playlist.collaborators && playlist.collaborators.length > 0) {
                    const existingCollabIDs = playlist.collaborators.map(c => c.id || c);
                    const formattedCollabs = users
                        .filter(u => existingCollabIDs.includes(u.id))
                        .map(u => ({ value: u.id, label: u.username || u.email }));
                    setSelectedCollaborators(formattedCollabs);
                }

            } catch (error) {
                console.error("Błąd pobierania danych:", error);
                alert("Nie udało się pobrać danych playlisty.");
                navigate(-1);
            } finally {
                setLoadingData(false);
            }
        };

        if (id) fetchData();
    }, [id, navigate]);

    const collaboratorsOptions = allUsers.map(u => ({
        value: u.id,
        label: u.username || u.email
    }));

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!search.trim()) return;
        setLoadingSearch(true);
        Promise.all([
            spotifyApi.searchSpotifyTracks(search)
                .then(resp => setSpotifyResults(resp.data.tracks.items))
                .catch(() => setSpotifyResults([])),
            soundcloudApi.searchSoundcloudTracks(search)
                .then(resp => setSoundcloudResults(resp.data || []))
                .catch(() => setSoundcloudResults([]))
        ]).finally(() => setLoadingSearch(false));
    };

    const handleAddToPlaylist = (track) => {
        const unified = mapTrackToApiPayload(track)
        if (!currentTracks.find(t => String(t.track_id) === String(unified.track_id))) {
            setCurrentTracks(prev => [...prev, unified]);
        }
    };

    const handleRemoveTrack = (trackId) => {
        setCurrentTracks(prev => prev.filter(t => String(t.track_id) !== String(trackId)));
    };

    const handleCopyLink = () => {
        const link = `${window.location.origin}/playlist/hub/${id}`;

        navigator.clipboard.writeText(link).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset po 2 sekundach
        }).catch(err => {
            console.error('Nie udało się skopiować: ', err);
            alert("Nie udało się skopiować linku automatycznie.");
        });
    };

    const handleSaveChanges = async () => {
        if (!playlistName.trim()) {
            alert("Nazwa playlisty nie może być pusta!");
            return;
        }

        const payload = {
            name: playlistName,
            tracks: currentTracks.map(t => mapTrackToApiPayload(t)),
            collaborators: selectedCollaborators.map(opt => opt.value),
            visibility: visibility.value,
            is_public: visibility.value === 'public'
        };

        try {
            await authAPI.editPlaylist(id, payload);
            alert("Zmiany zostały zapisane!");
            navigate(`/playlist/hub/${id}`);
        } catch (error) {
            console.error("Błąd zapisu:", error);
            alert("Wystąpił błąd podczas zapisywania zmian.");
        }
    };

    const handleDeletePlaylist = async () => {
        if (!window.confirm("Are you sure you want to delete this playlist?")) {
            return;
        }

        try {
            await authAPI.deletePlaylist(id);
            navigate('/library')
        } catch (error) {
            console.log("Error while deleting playlist", error);
            alert("An Error occured while deleting playlist");
        }
    }

    if (loadingData) return <div className="loading-screen">Ładowanie edytora...</div>;

    return (
        <div className="playlist-root-grid">
            <div className="playlist-left-panel">
                <button className="back-btn-simple" onClick={() => navigate(-1)}>
                    <FaArrowLeft /> Anuluj
                </button>

                <div className="playlist-form-card">
                    <h2>Edytuj Playlistę</h2>

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
                        placeholder="Dodaj / Usuń osoby..."
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
                        <div style={{ marginTop: '12px' }}>
                            <button
                                type="button"
                                onClick={handleCopyLink}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: copied ? '#21d661' : '#333',
                                    color: copied ? '#000' : '#fff',
                                    border: '1px solid #444',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s ease',
                                    width: '100%',
                                    justifyContent: 'center'
                                }}
                            >
                                {copied ? <FaCheck /> : <FaCopy />}
                                {copied ? 'Skopiowano do schowka!' : 'Kopiuj link do udostępnienia'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="playlist-picked">
                    <h3 className="selected-tracks">
                        Utwory w playliście ({currentTracks.length})
                    </h3>
                    <ul className="track-list">
                        {currentTracks.map((track, index) => (
                            <li key={`${track.track_id}-${index}`}>
                                <img
                                    src={track.image_url || 'default_cover.png'}
                                    alt="cover"
                                    className="track-cover-small"
                                />
                                <div className="track-info-simple">
                                    <b>{track.name}</b>
                                    <span>{track.author}</span>
                                </div>
                                <button
                                    className="track-remove"
                                    onClick={() => handleRemoveTrack(track.track_id)}
                                    title="Usuń z playlisty"
                                >
                                    <FaTrash />
                                </button>
                            </li>
                        ))}
                        {currentTracks.length === 0 && (
                            <p style={{color: '#888', fontStyle: 'italic'}}>Playlista jest pusta.</p>
                        )}
                    </ul>
                </div>
                <div className="playlist-delete">
                    <button className="playlist-delete-button" type="submit" onClick={handleDeletePlaylist}>
                        Delete playlist
                    </button>
                </div>
            </div>

            <div className="playlist-right-panel">
                {/* Prawa strona bez zmian */}
                <form className="search-form" onSubmit={handleSearch}>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Szukaj nowych utworów..."
                    />
                    <button type="submit" disabled={loadingSearch}>
                        {loadingSearch ? '...' : 'Szukaj'}
                    </button>
                </form>

                <div className="playlist-results-wrapper">
                    {spotifyResults.length > 0 && (
                        <div className="results-section">
                            <h3 className="results-header"><span style={{color: '#1db954'}}>Spotify</span></h3>
                            <SearchResults
                                tracks={spotifyResults}
                                onAddToPlaylist={(track) => handleAddToPlaylist(track, 'spotify')}
                                platform="spotify"
                            />
                        </div>
                    )}

                    {soundcloudResults.length > 0 && (
                        <div className="results-section">
                            <h3 className="results-header"><span style={{color: '#ff5500'}}>SoundCloud</span></h3>
                            <SearchResults
                                tracks={soundcloudResults}
                                onAddToPlaylist={(track) => handleAddToPlaylist(track, 'soundcloud')}
                                platform="soundcloud"
                            />
                        </div>
                    )}

                    {spotifyResults.length === 0 && soundcloudResults.length === 0 && !loadingSearch && (
                        <div className="empty-search-placeholder">
                            Wpisz frazę, aby dodać nowe utwory do playlisty.
                        </div>
                    )}
                </div>

                <button
                    className="create-btn fixed-bottom-btn"
                    onClick={handleSaveChanges}
                    disabled={!playlistName}
                >
                    <FaSave style={{marginRight: '8px'}}/> Zapisz Zmiany
                </button>
            </div>
        </div>
    );
};

export default EditPlaylist;