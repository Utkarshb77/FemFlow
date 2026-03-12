import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getMe } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('femflow_token');
    if (token) {
      getMe()
        .then((res) => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('femflow_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    localStorage.setItem('femflow_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password, dateOfBirth) => {
    const res = await registerUser({ name, email, password, dateOfBirth });
    localStorage.setItem('femflow_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('femflow_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
