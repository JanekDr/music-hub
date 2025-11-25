import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import SoundcloudLoginButton from './SoundcloudLoginButton.jsx';
import { FaSoundcloud } from 'react-icons/fa';
import { IoCheckmarkCircleOutline } from 'react-icons/io5';
import '../styles/playersConnectionStatus.css';

const SoundcloudStatus = () => {
  const [connected, setConnected] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await authAPI.getSoundcloudStatus();
        setConnected(response.data.connected);
        setExpiresAt(response.data.expires_at);
      } catch (error) {
        console.error(error);
      }
    };
    fetchStatus();
  }, []);

  const disconnectSoundcloud = async () => {
    setLoading(true);
    try {
      const response = await authAPI.soundcloudDisconnect();
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
    <div className={`player-connection-status soundcloud-status${connected ? ' connected' : ' not-connected'}`}>
      <div className="status-title-row">
        <span>Połączono z kontem SoundCloud</span>
        <IoCheckmarkCircleOutline color="#FF5500" size={20} style={{marginLeft: '7px'}} />
      </div>
      <div className="info-row">
        <FaSoundcloud color="#FF5500" size={28} />
        <span className="expires">
          Token ważny do: {expiresAt ? new Date(expiresAt).toLocaleString() : "brak"}
        </span>
      </div>
      {connected ? (
        <button className="auth-btn connected" onClick={disconnectSoundcloud} disabled={loading}>
          {loading ? 'Rozłączanie...' : 'Odłącz konto SoundCloud'}
        </button>
      ) : (
        <SoundcloudLoginButton />
      )}
    </div>
  );
};

export default SoundcloudStatus;
