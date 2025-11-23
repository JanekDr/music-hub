import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import SoundcloudLoginButton from './SoundcloudLoginButton.jsx';
import { FaSoundcloud } from 'react-icons/fa';
import { IoCheckmarkCircleOutline } from 'react-icons/io5';
import '../styles/dashboard.css'

const SoundcloudStatus = () => {
  const [connected, setConnected] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await authAPI.getSoundcloudStatus();
      setConnected(response.data.connected);
      setExpiresAt(response.data.expires_at);
    } catch (error) {
      console.error(error);
    }
  };

  const disconnectSoundcloud = async () => {
    setLoading(true);
    try {
      const response = await authAPI.postSoundcloudDisconnect();
      if (response.data.message) {
        setConnected(false);
        setExpiresAt(null);
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (connected) {
    return (
      <div className="soundcloud-status connected" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
        <FaSoundcloud color="#FF5500" size={28} />
        <div>
          <p style={{margin: 0, fontWeight: 'bold'}}>
            Połączono z kontem SoundCloud
            <IoCheckmarkCircleOutline color="#FF5500" size={20} style={{marginLeft: '6px'}} />
          </p>
          <p className="expires" style={{fontSize: '0.9em', color: '#ccc'}}>
            Token ważny do: {new Date(expiresAt).toLocaleString()}
          </p>
          <button onClick={disconnectSoundcloud} disabled={loading}>
            {loading ? 'Rozłączanie...' : 'Odłącz konto SoundCloud'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="soundcloud-status not-connected">
      <p>Nie jesteś połączony ze SoundCloud.</p>
      <SoundcloudLoginButton />
    </div>
  );
};

export default SoundcloudStatus;
