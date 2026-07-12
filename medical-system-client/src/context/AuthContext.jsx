import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setUnauthorizedHandler } from '../services/api.js';

export const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  role: null,
  loading: true,
  login: async () => {},
  logout: async () => {}
});

const TOKEN_KEY = 'medical-system-token';

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(
    async ({ redirect = true } = {}) => {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);

      if (redirect) {
        navigate('/login', { replace: true });
      }
    },
    [navigate]
  );

  const login = useCallback(async (authToken, authUser) => {
    localStorage.setItem(TOKEN_KEY, authToken);
    setToken(authToken);
    setUser(authUser);
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  useEffect(() => {
    setUnauthorizedHandler(() => logout({ redirect: true }));

    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/profile');
        setUser(response.data.data);
      } catch (error) {
        await logout({ redirect: true });
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [logout, token]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      role: user?.rol || null,
      loading,
      login,
      logout
    }),
    [loading, login, logout, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
