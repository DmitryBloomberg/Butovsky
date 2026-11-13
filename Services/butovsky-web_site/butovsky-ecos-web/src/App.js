import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext } from 'react';
import Home from './components/home/home';
import Dashboard from './components/dashboard/dashboard';

// Создаём контекст авторизации
export const AuthContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Проверяем токен при загрузке сайта
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('vpn_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('http://localhost:3000/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        } else {
          localStorage.removeItem('vpn_token');
        }
      } catch (err) {
        localStorage.removeItem('vpn_token');
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('vpn_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('vpn_token');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        color: 'white',
        textAlign: 'center',
        marginTop: '50px',
        fontFamily: 'Manrope, sans-serif',
        fontSize: '18px'
      }}>
        Загрузка...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <Routes>
          {/* Если авторизован и заходит на главную → редирект в Dashboard */}
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Home />} />
          {/* Защищённый роут: если нет пользователя → редирект на главную */}
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;