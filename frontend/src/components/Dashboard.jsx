import { authAPI } from '../services/api';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
 
const Dashboard = () => {
  const {logout} = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const fetchUserProfile = async () => {
        try {
            const response = await authAPI.getProfile();
            setUser(response.data);
        } catch (error) {
            console.error('Error while fetching user profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    logout();
  };

  if (loading) return <div>Ładowanie profilu...</div>;

  return (
    <div className="dashboard">
      <nav className="navbar">
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </nav>
      
      <div className="dashboard-content">
        <h2>Welcome, {user?.username}!</h2>
        <div className="user-info">
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Username:</strong> {user?.username}</p>
          {user?.spotify_id && <p><strong>Spotify ID:</strong> {user.spotify_id}</p>}
          {user?.soundcloud_id && <p><strong>SoundCloud ID:</strong> {user.soundcloud_id}</p>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
