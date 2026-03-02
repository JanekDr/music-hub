import { useQueries } from '@tanstack/react-query';
import { authAPI } from "../services/api.js";
import { spotifyApi } from "../services/spotifyApi.js";
import { soundcloudApi } from "../services/soundcloudApi.js";
import { FaSoundcloud, FaSpotify, FaPlay } from "react-icons/fa";
import { Link } from "react-router-dom";
import "../styles/library.css";

const HubLogo = () => (
    <svg width="30" height="30" viewBox="0 0 30 30"><circle cx="14" cy="14" r="14" fill="#1DB954"/><text x="14" y="19" fontSize="13" fontWeight="bold" fill="#fff" textAnchor="middle" fontFamily="Arial">HUB</text></svg>
);

const VISIBILITY_LABELS = {
  public: 'Public',
  private: 'Private',
  unlisted: 'Only with link'
};

const Library = () => {
    const results = useQueries({
        queries: [
            {
                queryKey: ['playlists', 'hub'],
                queryFn: () => authAPI.getUserPlaylists().then(res => res.data || []),
                staleTime: 1000 * 60 * 5 // Dane są "świeże" przez 5 minut
            },
            {
                queryKey: ['playlists', 'spotify'],
                queryFn: () => spotifyApi.getSpotifyPlaylists().then(res => res.data.items || []),
                staleTime: 1000 * 60 * 10
            },
            {
                queryKey: ['playlists', 'soundcloud'],
                queryFn: () => soundcloudApi.getUserPlaylists().then(res => res.data || []),
                staleTime: 1000 * 60 * 5
            }
        ]
    });

    const isLoading = results.some(query => query.isLoading);

    const hubPlaylists = results[0].data || [];
    const spotifyPlaylists = results[1].data || [];
    const soundcloudPlaylists = results[2].data || [];

    return (
        <div className="library-root">
            <h2 className="library-title">Twoje playlisty</h2>
            {isLoading ? (
                <div className="library-loading">Loading ...</div>
            ) : (
                <div>
                    {/* multiplatform */}
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
        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            {logo}
            <span style={{ fontSize: "1.18rem", fontWeight: 600, marginLeft: 12 }}>{label}</span>
        </div>
        {children}
    </div>
);

const PlaylistCards = ({ playlists, platform }) => (
  <div className="library-list">
    {playlists.length ? playlists.map(pl => {
      const id = platform === "hub" ? pl.slug : pl.id;

      const title =
        platform === "spotify" ? pl.name :
        platform === "soundcloud" ? pl.title :
        pl.name;

      const tracksCount =
        platform === "hub" ? (pl.tracks?.length || 0) :
        platform === "spotify" ? (pl.tracks?.total ?? 0) :
        platform === "soundcloud" ? (pl.track_count ?? pl.tracks?.length ?? 0) :
        0;

      const ownerName =
        platform === "hub" ? (pl.owner?.username || "-") :
        platform === "soundcloud" ? (pl.user?.username || "-") :
        null;

      return (
        <div className="library-card" key={id}>
          <div className="library-card-title">
              <Link to={`/playlist/${platform}/${id}`}>{title}</Link>
            <FaPlay color="#1DB954" size={28} style={{cursor: 'pointer'}} />
          </div>

          {(platform === "hub" || platform === "soundcloud") && (
            <div className="library-card-owner">Owner: {ownerName}</div>
          )}

          <div className="library-card-tracks">{tracksCount} utworów</div>

          <div className="library-track-chips">
            {platform === "hub" && pl.tracks?.slice?.(0, 3).map(track =>
              <span className="library-track-chip" key={track.id}>{track.name} - {track.author}</span>
            )}
            {platform === "soundcloud" && pl.tracks?.slice?.(0, 3).map(track =>
              <span className="library-track-chip" key={track.id}>{track.title} - {track.user?.username || ""}</span>
            )}
          </div>

          {platform === "hub" && (
            <div className={`library-card-status library-card-status-${pl.visibility}`}>
              {VISIBILITY_LABELS[pl.visibility] || pl.visibility}
            </div>
          )}
        </div>
      );
    }) : (
      <div className="library-list-empty">No playlists to display.</div>
    )}
  </div>
);

export default Library;