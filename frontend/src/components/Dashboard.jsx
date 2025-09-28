import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import SpotifyLoginButton from './SpotifyLoginButton.jsx';

// Komponent wyświetlający profile użytkownika
const UserProfile = ({ user }) => (
  <div className="user-info">
    <p><strong>Email:</strong> {user.email}</p>
    <p><strong>Username:</strong> {user.username}</p>
    {user.spotify_id && <p><strong>Spotify ID:</strong> {user.spotify_id}</p>}
    {user.soundcloud_id && <p><strong>SoundCloud ID:</strong> {user.soundcloud_id}</p>}
  </div>
);

// Komponent obsługujący status połączenia ze Spotify
const SpotifyStatus = () => {
  const [connected, setConnected] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await authAPI.getSpotifyStatus();
        setConnected(response.data.connected);
        setExpiresAt(response.data.expires_at);
      } catch (error) {
        console.error('Error fetching Spotify connection status:', error);
      }
    };

    fetchStatus();
  }, []);

  if (connected) {
    return <p>Połączono ze Spotify. Token ważny do: {new Date(expiresAt).toLocaleString()}</p>;
  }
  return <SpotifyLoginButton />;
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
      <nav className="navbar">
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </nav>

      <div className="dashboard-content">
        <h2>Welcome, {user.username}!</h2>
        <UserProfile user={user} />
        <SpotifyStatus />
      </div>
    </div>
  );
};

export default Dashboard;
