import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import SpotifyLoginButton from "./components/SpotifyLoginButton.jsx";
import './styles/reset.css';
import './styles/layout.css';
import Navbar from "./components/Navbar.jsx";
import Player from "./components/Player.jsx";
import CreatePlaylist from "./components/CreatePlaylist.jsx";
import Library from "./components/Library.jsx";
import SoundcloudCallback from "./components/SoundcloudCallback.jsx";
import UniversalPlayer from "./components/UniversalPlayer.jsx";


const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
}

function AppLayout() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }/>
            <Route
              path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/spotify" element={
                <ProtectedRoute>
                  <SpotifyLoginButton />
                </ProtectedRoute>
              }
            />
            <Route
              path="/player" element={
              <ProtectedRoute>
                <Player />
              </ProtectedRoute>
            }
            />
            <Route
              path="/create-playlist" element={
              <ProtectedRoute>
                <CreatePlaylist />
              </ProtectedRoute>
            }
            />
            <Route
              path="/library" element={
              <ProtectedRoute>
                <Library />
              </ProtectedRoute>
            }
            />
            <Route
              path="/soundcloud/callback" element={
              <ProtectedRoute>
                <SoundcloudCallback />
              </ProtectedRoute>
            }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
      {isAuthenticated && <UniversalPlayer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
