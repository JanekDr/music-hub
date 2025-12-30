import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import SearchResults from '../components/SearchResults.jsx';

import { authAPI } from '../services/api.js';
import { soundcloudApi } from '../services/soundcloudApi.js';
import { spotifyApi } from '../services/spotifyApi.js';

import { FaArrowLeft, FaSave, FaTrash } from 'react-icons/fa';
import '../styles/createPlaylist.css';

const EditPlaylist = () => {
    const { id } = useParams(); // ID playlisty z URL
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

    // State playlisty
    const [playlistName, setPlaylistName] = useState('');
    const [currentTracks, setCurrentTracks] = useState([]);
    const [isPublic, setIsPublic] = useState(false);

    // State kolaboratorów
    const [allUsers, setAllUsers] = useState([]);
    const [selectedCollaborators, setSelectedCollaborators] = useState([]);

    // State wyszukiwania
    const [search, setSearch] = useState('');
    const [spotifyResults, setSpotifyResults] = useState([]);
    const [soundcloudResults, setSoundcloudResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    // 1. Pobieranie danych playlisty i listy użytkowników przy starcie
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Pobierz playlistę i użytkowników równolegle
                const [playlistRes, usersRes] = await Promise.all([
                    authAPI.getUserPlaylist(id), // Zakładam, że to endpoint zwracający szczegóły (jak w Playlist.js dla 'hub')
                    authAPI.users()
                ]);

                const playlist = playlistRes.data;
                const users = usersRes.data;

                setPlaylistName(playlist.name);
                setIsPublic(playlist.is_public);

                // Mapowanie istniejących utworów do formatu używanego w edytorze
                // UWAGA: Sprawdź czy Twoje API zwraca 'track_id' czy 'id' wewnątrz obiektu tracks
                const mappedTracks = playlist.tracks.map(t => ({
                    id: t.id,
                    track_id: t.track_id,
                    name: t.name,
                    artists: t.author,
                    url: t.url,
                    image_url: t.image_url,
                    track_duration: t.track_duration,
                    platform: t.platform
                }));
                setCurrentTracks(mappedTracks);

                setAllUsers(users);

                if (playlist.collaborators && playlist.collaborators.length > 0) {
                    const existingCollabIDs = playlist.collaborators.map(c => c.id || c); // Może być obiekt lub samo ID
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

    const handleAddToPlaylist = (track, platform) => {
        const unified = platform === 'spotify'
            ? {
                id: track.id,
                url: track.uri,
                name: track.name,
                artists: track.artists.map(a => a.name).join(', '),
                image_url: track.album.images?.[0]?.url || '',
                track_duration: track.duration_ms,
                platform: 'spotify'
            }
            : {
                id: track.id,
                url: track.uri || track.permalink_url,
                name: track.title,
                artists: track.user?.username || '',
                image_url: track.artwork_url || track.user.avatar_url || '',
                track_duration: track.duration,
                platform: 'soundcloud'
            };

        if (!currentTracks.find(t => String(t.id) === String(unified.id))) {
            setCurrentTracks(prev => [...prev, unified]);
        }
    };

    const handleRemoveTrack = (trackId) => {
        setCurrentTracks(prev => prev.filter(t => String(t.id) !== String(trackId)));
    };

    const handleSaveChanges = async () => {
        if (!playlistName.trim()) {
            alert("Nazwa playlisty nie może być pusta!");
            return;
        }

        const payload = {
            name: playlistName,
            tracks: currentTracks.map(t => ({
                track_id: t.id.toString(),
                url: t.url,
                name: t.name,
                author: t.artists,
                track_duration: t.track_duration,
                image_url: t.image_url,
                platform: t.platform
            })),
            collaborators: selectedCollaborators.map(opt => opt.value),
            is_public: isPublic,
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

    if (loadingData) return <div className="loading-screen">Ładowanie edytora...</div>;

    return (
        <div className="playlist-root-grid">
            <div className="playlist-left-panel">
                <button className="back-btn-simple" onClick={() => navigate(-1)}>
                    <FaArrowLeft /> Anuluj
                </button>

                <div className="playlist-form-card">
                    <h2>
                        Edytuj Playlistę
                    </h2>

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

                    <label className="public-check">
                        <input
                            type="checkbox"
                            checked={isPublic}
                            onChange={e => setIsPublic(e.target.checked)}
                        /> Publiczna playlista
                    </label>
                </div>

                <div className="playlist-picked">
                    <h3 className="selected-tracks">
                        Utwory w playliście ({currentTracks.length})
                    </h3>
                    <ul className="track-list">
                        {currentTracks.map((track, index) => (
                            <li key={`${track.id}-${index}`}>
                                <img
                                    src={track.image_url || 'default_cover.png'}
                                    alt="cover"
                                    className="track-cover-small"
                                />
                                <div className="track-info-simple">
                                    <b>{track.name}</b>
                                    <span>{track.artists}</span>
                                </div>
                                <button
                                    className="track-remove"
                                    onClick={() => handleRemoveTrack(track.id)}
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
            </div>

            <div className="playlist-right-panel">
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