import { useState } from 'react';
import {useAuth} from "../context/AuthContext.jsx";
import { Link, useNavigate } from 'react-router-dom';
import '../styles/navbar.css'

const Navbar = () => {
  const [search, setSearch] = useState('');
  const {isAuthenticated, logout} = useAuth();
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
        navigate(`/player?q=${encodeURIComponent(search.trim())}`);
        setSearch('');
    }
  };

  const handleLogout = () => {
      logout();
      navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/dashboard" style={{ color: '#fff', textDecoration: 'none' }}>MusicHub</Link>
      </div>
      <form className="navbar-search-form" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          placeholder="Szukaj piosenek..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button type="submit">Szukaj</button>
      </form>
      <div className="navbar-actions">
        <Link to="/dashboard" className="navbar-link">Dashboard</Link>
        {isAuthenticated ? (
          <button onClick={handleLogout}>Logout</button>
        ) : (
          <Link to="/login" className="navbar-link">Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
