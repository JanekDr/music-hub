import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from "react-redux";

// Services & Store
import { authAPI } from "../services/api";
import { spotifyApi } from "../services/spotifyApi";
import { soundcloudApi } from "../services/soundcloudApi";
import { setCurrentTrackIndex, setQueue } from "../store/playerSlice";

// Icons & Styles
import { FaPlay, FaClock, FaArrowLeft, FaSpotify, FaSoundcloud, FaPlus, FaHeart, FaRegHeart } from "react-icons/fa";
import "../styles/playlist.css";

const Playlist = () => {
    const { platform, id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [playlist, setPlaylist] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isFollowing, setIsFollowing] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);

    const formatDuration = (ms) => {
        if (!ms) return "-";
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
    };

    const handleAddToQueue = async (e, track) => {
        e.stopPropagation();
        try {
            const trackPayload = {
                track_id: track.id.toString(),
                name: track.name,
                author: track.artist,
                url: platform === 'spotify' ? track.uri : (track.url || track.uri),
                platform: platform,
                track_duration: track.track_duration,
                image_url: track.image_url,
            };
            const newTrack = await authAPI.addTrack(trackPayload);
            await authAPI.addToQueue({ 'track_id': newTrack.data.id });
            const queueResponse = await authAPI.getQueue();
            dispatch(setQueue(queueResponse.data));

        } catch (err) {
            console.error("Error while adding queue:", err);
        }
    };

    const handlePlayAll = async () => {
        if (!tracks.length) return;
        try {
            const tracksPayload = tracks.map(track => ({
                track_id: track.id.toString(),
                name: track.name,
                author: track.artist,
                url: platform === 'spotify' ? track.uri : (track.url || track.uri),
                platform: platform,
                track_duration: track.track_duration,
                image_url: track.image_url
            }));
            await authAPI.replaceQueue(tracksPayload);
            const queueResponse = await authAPI.getQueue();
            dispatch(setQueue(queueResponse.data));
            dispatch(setCurrentTrackIndex(0))
        } catch (err) {
            console.error("Error while playing all tracks:", err);
        }
    };

    const handleFollowToggle = async () => {
        try {
            await authAPI.followPlaylist(playlist.slug);
            setIsFollowing(prev => !prev);
            setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
        } catch (err) {
            console.error("Błąd podczas followowania:", err);
        }
    };

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                let res;
                let fetchedTracks = [];
                let playlistData = {};

                if (platform === 'spotify') {
                    res = await spotifyApi.getPlaylistDetails(id);
                    const data = res.data;
                    playlistData = {
                        title: data.name,
                        image: data.images?.[0]?.url,
                        description: data.description,
                        owner: data.owner.display_name,
                        platformIcon: <FaSpotify />
                    };
                    fetchedTracks = data.tracks.items.map(item => ({
                        id: item.track.id,
                        name: item.track.name,
                        artist: item.track.artists.map(a => a.name).join(", "),
                        album: item.track.album.name,
                        track_duration: item.track.duration_ms,
                        image_url: item.track.album.images?.[2]?.url,
                        uri: item.track.uri
                    }));

                } else if (platform === 'soundcloud') {
                    res = await soundcloudApi.getPlaylistDetails(id);
                    const data = res.data;
                    playlistData = {
                        title: data.title,
                        image: data.artwork_url?.replace('large', 't500x500') || data.tracks[0].artwork_url.replace('large', 't500x500'),
                        description: data.description,
                        owner: data.user.username,
                        platformIcon: <FaSoundcloud />
                    };
                    fetchedTracks = data.tracks.map(track => ({
                        id: track.id,
                        name: track.title,
                        artist: track.user.username,
                        album: "-",
                        track_duration: track.duration,
                        image_url: track.artwork_url || track.user.avatar_url,
                        url: track.permalink_url
                    }));

                } else if (platform === 'hub') {
                    const [playlistRes, userRes] = await Promise.all([
                        authAPI.getUserPlaylist(id),
                        authAPI.getProfile()
                    ]);

                    const data = playlistRes.data;
                    const currentUser = userRes.data;

                    playlistData = {
                        title: data.name,
                        image: data.tracks[0]?.image_url,
                        description: "Hub mixed playlist",
                        owner: data.owner.email,
                        platformIcon: <span>HUB</span>,
                        slug: data.slug
                    };
                    fetchedTracks = data.tracks.map(track => ({
                        id: track.track_id,
                        name: track.name,
                        artist: track.author,
                        album: track.platform,
                        track_duration: track.track_duration,
                        image_url: track.image_url,
                        url: track.url,
                    }));

                    if (currentUser) {
                        const ownerId = data.owner.id || data.owner;
                        setIsOwner(String(ownerId) === String(currentUser.id));

                        const isUserFollowing = data.followers.some(f =>
                            (f.id || f) === currentUser.id
                        );
                        setIsFollowing(isUserFollowing);
                    }
                    setFollowersCount(data.followers.length);
                }

                setPlaylist(playlistData);
                setTracks(fetchedTracks);

            } catch (err) {
                console.error(err);
                setError("Nie udało się pobrać szczegółów playlisty.");
            } finally {
                setLoading(false);
            }
        };

        if (id && platform) {
            fetchDetails();
        }
    }, [id, platform]);

    if (loading) return <div className="loading-screen">Wczytywanie playlisty...</div>;
    if (error) return <div className="error-screen">{error}</div>;

    return (
        <div className="playlist-page">
            <div
                className="page-bg-gradient"
                style={{ backgroundImage: `url(${playlist?.image})` }}
            />

            <button className="back-btn" onClick={() => navigate(-1)}>
                <FaArrowLeft /> Wróć
            </button>
            <div className="hero-section">
                <div className="hero-image-container">
                    {playlist.image ? (
                        <img src={playlist.image} alt={playlist.title} className="hero-image" />
                    ) : (
                        <div className="hero-image-placeholder">🎵</div>
                    )}
                </div>
                <div className="hero-content">
                    <div className="platform-tag">
                        {playlist.platformIcon} {platform.toUpperCase()}
                    </div>
                    <h1 className="hero-title">{playlist.title}</h1>
                    <div className="hero-meta">
                        <span>By <strong>{playlist.owner}</strong></span>
                        <span className="dot">•</span>
                        <span>{tracks.length} tracks</span>
                        {platform === 'hub' && (
                            <>
                                <span className="dot">•</span>
                                <span>{followersCount} likes</span>
                            </>
                        )}
                    </div>

                    <div className="hero-buttons">
                        <button className="play-btn-white" onClick={handlePlayAll}>
                            <FaPlay /> Odtwórz wszystko
                        </button>

                        {/* NOWE: Przycisk Follow - tylko dla HUB i jeśli nie jesteś właścicielem */}
                        {platform === 'hub' && !isOwner && (
                            <button
                                className={`follow-btn ${isFollowing ? 'following' : ''}`}
                                onClick={handleFollowToggle}
                                title={isFollowing ? "Przestań obserwować" : "Obserwuj"}
                            >
                                {isFollowing ? <FaHeart /> : <FaRegHeart />}
                                {isFollowing ? ' Obserwujesz' : ' Obserwuj'}
                            </button>
                        )}

                        <button
                            className="edit-playlist"
                            onClick={() => navigate(`/playlist/edit/${id}`)}
                            style={{ display: (platform === 'hub' && isOwner) ? 'inline-block' : 'none' }}
                        >
                            <a>Edit playlist</a>
                        </button>
                    </div>
                </div>
            </div>

            <div className="tracks-container">
                <div className="tracks-header-row">
                    <span className="col-num">#</span>
                    <span className="col-title">Tytuł</span>
                    <span className="col-album">Album / Źródło</span>
                    <span className="col-actions"></span>
                    <span className="col-time"><FaClock /></span>
                </div>

                <div className="tracks-list">
                    {tracks.map((track, index) => (
                        <div className="track-card-glass" key={`${track.id}-${index}`}>
                            <span className="col-num">{index + 1}</span>

                            <div className="col-title track-meta">
                                <div className="track-img-wrapper">
                                    {track.image_url ? (
                                        <img src={track.image_url} alt="" className="track-thumb"/>
                                    ) : (
                                        <div className="track-thumb-placeholder">🎵</div>
                                    )}
                                </div>
                                <div className="track-text-info">
                                    <div className="track-name">{track.name}</div>
                                    <div className="track-artist">{track.artist}</div>
                                </div>
                            </div>

                            <span className="col-album">{track.album}</span>

                            <div className="col-actions">
                                <button
                                    className="add-queue-btn"
                                    onClick={(e) => handleAddToQueue(e, track)}
                                    title="Dodaj do kolejki"
                                >
                                    <FaPlus />
                                </button>
                            </div>

                            <span className="col-time">{formatDuration(track.track_duration)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Playlist;