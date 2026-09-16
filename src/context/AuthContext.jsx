import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { enablePushNotifications } from '../lib/push';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bhoomi_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem('bhoomi_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('bhoomi_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api.post('/auth/register', payload);
    localStorage.setItem('bhoomi_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bhoomi_token');
    setUser(null);
  }, []);

  // Authenticate the socket connection so the server can push notifications
  // to this specific user's private room, not just broadcast to everyone.
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    const authenticate = () => {
      const token = localStorage.getItem('bhoomi_token');
      if (token) socket.emit('auth', token);
    };
    authenticate();
    socket.on('connect', authenticate);
    return () => socket.off('connect', authenticate);
  }, [user]);

  // Best-effort: ask for native push permission once logged in. If the
  // browser doesn't support it, the user declines, or the server has no
  // VAPID keys configured, this silently does nothing - in-app
  // notifications keep working regardless.
  useEffect(() => {
    if (!user) return;
    enablePushNotifications();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
