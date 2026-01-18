import { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom' // Added useLocation
import axios from 'axios'
import { Toaster } from 'react-hot-toast';
import './styles.css'


// Configure Axios
axios.defaults.baseURL = 'http://localhost:3000';
axios.defaults.withCredentials = true;

// Auth Context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const guestLogin = async () => {
    try {
      const res = await axios.post('/auth/guest');
      setUser(res.data.user);
    } catch (err) {
      console.error("Guest login failed", err);
    }
  };

  useEffect(() => {
    // Check session with backend
    axios.get('/auth/me')
      .then(res => {
        setUser(res.data.user);
        setLoading(false);
      })
      .catch(() => {
        // If checks fail, and we are NOT explicitly on auth pages, create guest session
        // actually, even on auth pages, being a guest in background is fine, 
        // as long as we don't auto-redirect away from login.
        // But to be safe, let's auto-login.
        if (location.pathname !== '/login' && location.pathname !== '/register' && !location.pathname.startsWith('/share')) {
          guestLogin().finally(() => setLoading(false));
        } else {
          setUser(null);
          setLoading(false);
        }
      });
  }, []);

  const login = async (email, password) => {
    const res = await axios.post('/auth/login', { email, password });
    setUser(res.data.user);
    return res.data;
  };

  const register = async (email, password) => {
    await axios.post('/auth/register', { email, password });
  };

  const logout = async () => {
    await axios.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, guestLogin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !user.isAdmin) return <Navigate to="/dashboard" />;
  return children;
};

// Pages (Placeholder imports, implement later)
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PublicShare from './pages/PublicShare';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <div className="app-container">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/share/:token" element={<PublicShare />} /> {/* Public Route */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute adminOnly={true}>
                <AdminPanel />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
