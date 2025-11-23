import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import SpotifyStatus from "./SpotifyStatus.jsx";
import '../styles/dashboard.css'
import '../styles/spotify.css'
import SoundcloudStatus from "./SoundcloudStatus.jsx";


const UserProfile = ({ user }) => (
  <div className="user-info">
    <p><strong>Email:</strong> {user.email}</p>
    <p><strong>Username:</strong> {user.username}</p>
  </div>
);

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
      <div className="dashboard-content">
        <h2>Welcome, {user.username}!</h2>
        <UserProfile user={user} />
        <SpotifyStatus />
        <SoundcloudStatus />
        <button onClick={handleLogout} className="logout-btn" style={{marginTop: '20px'}}>Logout</button>
      </div>
    </div>
  );
};

export default Dashboard;
