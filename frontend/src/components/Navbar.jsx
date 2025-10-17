import { useState } from 'react';
import { useAuth } from "../context/AuthContext.jsx";
import { Link, useNavigate } from 'react-router-dom';
import '../styles/navbar.css';
import { FaPlus } from 'react-icons/fa';
import { MdOutlineLibraryMusic  } from "react-icons/md";

const Navbar = () => {
  const [search, setSearch] = useState('');
  const { isAuthenticated, logout } = useAuth();
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
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/dashboard" style={{ color: '#fff', textDecoration: 'none' }}>MusicHub</Link>
      </div>

      <div className="navbar-item">
        <form className="navbar-search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search songs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>

      <div className="navbar-center-buttons">
        <button
          className="navbar-button"
          onClick={() => navigate('/library')}
          title="Go to library"
        >
          <MdOutlineLibraryMusic  size={18} />
          <span>Library</span>
        </button>

        <button
          className="navbar-button"
          onClick={() => navigate('/create-playlist')}
          title="Create new playlist"
        >
          <FaPlus size={14} />
          <span>Create</span>
        </button>
      </div>

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
