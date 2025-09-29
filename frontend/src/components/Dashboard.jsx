import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import SpotifyLoginButton from './SpotifyLoginButton.jsx';
import { FaSpotify } from 'react-icons/fa';
import { IoCheckmarkCircleOutline } from 'react-icons/io5';


const UserProfile = ({ user }) => (
  <div className="user-info">
    <p><strong>Email:</strong> {user.email}</p>
    <p><strong>Username:</strong> {user.username}</p>
    {user.spotify_id && <p><strong>Spotify ID:</strong> {user.spotify_id}</p>}
    {user.soundcloud_id && <p><strong>SoundCloud ID:</strong> {user.soundcloud_id}</p>}
  </div>
);

const SpotifyStatus = () => {
  const [connected, setConnected] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await authAPI.getSpotifyStatus();
      setConnected(response.data.connected);
      setExpiresAt(response.data.expires_at);
    } catch (error) {
      console.error(error);
    }
  };

  const disconnectSpotify = async () => {
    setLoading(true);
    try {
      const response = await authAPI.postSpotifyDisconnect();
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
      <div className="spotify-status connected" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
        <FaSpotify color="#1DB954" size={28} />
        <div>
          <p style={{margin: 0, fontWeight: 'bold'}}>
            Połączono z kontem Spotify
            <IoCheckmarkCircleOutline color="#1DB954" size={20} style={{marginLeft: '6px'}} />
          </p>
          <p className="expires" style={{fontSize: '0.9em', color: '#ccc'}}>
            Token ważny do: {new Date(expiresAt).toLocaleString()}
          </p>
          <button className="spotify-login-btn" onClick={disconnectSpotify} disabled={loading}>
            {loading ? 'Rozłączanie...' : 'Odłącz konto Spotify'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="spotify-status not-connected">
      <p>Nie jesteś połączony ze Spotify.</p>
      <SpotifyLoginButton />
    </div>
  );
};

const Dashboard = () => {
  const { logout } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authAPI.getProfile();
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    logout();
  };

  if (loading) return <div>Ładowanie profilu...</div>;

  return (
    <div className="dashboard">
      <h1 className="dashboard-text">Dashboard</h1>
      <div className="dashboard-content">
        <h2>Welcome, {user.username}!</h2>
        <UserProfile user={user} />
        <SpotifyStatus />
        <button onClick={handleLogout} className="logout-btn" style={{marginTop: '20px'}}>Logout</button>
      </div>
    </div>
  );
};

export default Dashboard;
