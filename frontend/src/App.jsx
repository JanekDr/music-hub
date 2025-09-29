import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import SpotifyLoginButton from "./components/SpotifyLoginButton.jsx";
import './styles/reset.css';
import './styles/layout.css';
import './styles/forms.css';
import './styles/dashboard.css';
import './styles/spotify.css';
import Navbar from "./components/Navbar.jsx";


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

function App() {
  const handleSearch = (query) => {
    console.log('Szukam:', query);
    // Tutaj możesz np. przekierować do strony z wynikami lub wywołać zapytanie
  };
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar onSearch={handleSearch} />
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
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App;
