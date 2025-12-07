import { useState, useEffect } from 'react';
import SpotifyLoginButton from './SpotifyLoginButton.jsx';
import { FaSpotify } from 'react-icons/fa';
import { IoCheckmarkCircleOutline } from 'react-icons/io5';
import '../styles/playersConnectionStatus.css';
import spotifyApi from "../services/spotifyApi.js";

const SpotifyStatus = () => {
  const [connected, setConnected] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await spotifyApi.getSpotifyStatus();
        setConnected(response.data.connected);
        setExpiresAt(response.data.expires_at);
      } catch (error) {
        console.error(error);
      }
    };
    fetchStatus();
  }, []);

  const disconnectSpotify = async () => {
    setLoading(true);
    try {
      const response = await spotifyApi.disconnectSpotify();
      if (response.data.message) {
        setConnected(false);
        setExpiresAt(null);
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
    setLoading(false);
  };

  return (
    <div className={`player-connection-status spotify-status${connected ? ' connected' : ' not-connected'}`}>
      <div className="status-title-row">
        <span>Połączono z kontem Spotify</span>
        <IoCheckmarkCircleOutline color="#1DB954" size={20} style={{marginLeft: '7px'}} />
      </div>
      <div className="info-row">
        <FaSpotify color="#1DB954" size={28} />
        <span className="expires">
          Token ważny do: {expiresAt ? new Date(expiresAt).toLocaleString() : "brak"}
        </span>
      </div>
      {connected ? (
        <button className="auth-btn connected" onClick={disconnectSpotify} disabled={loading}>
          {loading ? 'Rozłączanie...' : 'Odłącz konto Spotify'}
        </button>
      ) : (
        <SpotifyLoginButton />
      )}
    </div>
  );
};

export default SpotifyStatus;
