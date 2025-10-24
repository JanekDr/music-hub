import { useEffect, useState } from 'react';
import { authAPI } from "../services/api.jsx";
import "../styles/Library.css";
import {FaSoundcloud, FaSpotify, FaPlay} from "react-icons/fa";


const HubLogo = () => (
    <svg width="30" height="30" viewBox="0 0 30 30"><circle cx="14" cy="14" r="14" fill="#1DB954"/><text x="14" y="19" fontSize="13" fontWeight="bold" fill="#fff" textAnchor="middle" fontFamily="Arial">HUB</text></svg>
);

const Library = () => {
    const [hubPlaylists, setHubPlaylists] = useState([]);
    const [spotifyPlaylists, setSpotifyPlaylists] = useState([]);
    const [soundcloudPlaylists, setSoundcloudPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            authAPI.getUserPlaylists(),
            authAPI.getSpotifyPlaylists(),
            // authAPI.getSoundcloudPlaylists() // SoundCloud ( ---||--- )
        ]).then(([hubRes,spotifyRes]) => {
            setHubPlaylists(hubRes.data || []);
            setSpotifyPlaylists(spotifyRes.data.items || []);
            // setSoundcloudPlaylists(soundcloudRes.data.items || []);
            setLoading(false);
        }).catch(() => {
            setHubPlaylists([]);
            setSpotifyPlaylists([]);
            setSoundcloudPlaylists([]);
            setLoading(false);
        });
    }, []);

    return (
        <div className="library-root">
            <h2 className="library-title">Twoje playlisty</h2>
            {loading ? (
                <div className="library-loading">Wczytywanie...</div>
            ) : (
                <div>
                    {/* Międzyplatformowe */}
                    <SectionWithLogo logo={<HubLogo />} label="Muzyczny hub (multi-platformowe)">
                        <PlaylistCards playlists={hubPlaylists} platform="hub" />
                    </SectionWithLogo>

                    {/* Spotify */}
                    <SectionWithLogo logo={<FaSpotify color="#1DB954" size={28} />} label="Spotify">
                        <PlaylistCards playlists={spotifyPlaylists} platform="spotify" />
                    </SectionWithLogo>

                    {/* SoundCloud */}
                    <SectionWithLogo logo={<FaSoundcloud color="#FF5419" size={28} />} label="SoundCloud">
                        <PlaylistCards playlists={soundcloudPlaylists} platform="soundcloud" />
                    </SectionWithLogo>
                </div>
            )}
        </div>
    );
};

const SectionWithLogo = ({ logo, label, children }) => (
    <div style={{ marginBottom: "38px" }}>
        <div style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 12
        }}>
            {logo}
            <span style={{
                fontSize: "1.18rem",
                fontWeight: 600,
                marginLeft: 12
            }}>{label}</span>
        </div>
        {children}
    </div>
);

const PlaylistCards = ({ playlists, platform }) => (
    <div className="library-list">
        {playlists.length ? playlists.map(pl => (
            <div className="library-card" key={pl.id}>
                <div className="library-card-title">
                    {pl.name}
                    <FaPlay color="#1DB954" size={28} />
                </div>
                {platform === "hub" && (
                    <div className="library-card-owner">Właściciel: {pl.owner?.email || '-'}</div>
                )}
                <div className="library-card-tracks">
                    {platform === "hub"
                        ? (pl.tracks?.length || 0)
                        : (pl.tracks?.total ?? 0)
                    } utworów
                </div>
                <div className="library-track-chips">
                    {platform === "hub" && pl.tracks?.slice?.(0, 3).map(track =>
                        <span className="library-track-chip" key={track.id}>
                            {track.name} - {track.author}
                        </span>
                    )}
                    {/* Dla Spotify, SoundCloud można dodać podgląd tracks w przyszłości */}
                </div>
                {platform === "hub" && (
                    <div className={`library-card-status ${pl.is_public ? 'library-card-status-public' : 'library-card-status-private'}`}>
                        {pl.is_public ? 'Publiczna' : 'Prywatna'}
                    </div>
                )}
            </div>
        )) : (
            <div className="library-list-empty">
                Brak playlist do wyświetlenia.
            </div>
        )}
    </div>
);

export default Library;
