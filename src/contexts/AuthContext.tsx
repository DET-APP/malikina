import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '@/lib/apiUrl';

export type AdminRole = 'SuperAdmin' | 'Admin' | 'GerantAudio' | 'GerantXassida' | 'Moderateur';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
}

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (action: Permission) => boolean;
}

export type Permission =
  | 'manage_users'
  | 'manage_xassidas'
  | 'delete_xassidas'
  | 'toggle_visibility'
  | 'manage_audio'
  | 'delete_audio'
  | 'manage_authors'
  | 'manage_verses'
  | 'view_stats'
  | 'view_integrity'
  | 'import_translations';

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SuperAdmin: [
    'manage_users', 'manage_xassidas', 'delete_xassidas', 'toggle_visibility',
    'manage_audio', 'delete_audio', 'manage_authors', 'manage_verses',
    'view_stats', 'view_integrity', 'import_translations',
  ],
  Admin: [
    'manage_xassidas', 'delete_xassidas', 'toggle_visibility',
    'manage_audio', 'delete_audio', 'manage_authors', 'manage_verses',
    'view_stats', 'view_integrity', 'import_translations',
  ],
  GerantXassida: [
    'manage_xassidas', 'manage_audio', 'manage_authors', 'manage_verses',
    'view_stats', 'import_translations',
  ],
  GerantAudio: [
    'manage_audio', 'delete_audio', 'view_stats',
  ],
  Moderateur: [
    'view_stats', 'view_integrity',
  ],
};

const TOKEN_KEY = 'malikina_admin_token';
// Inactivity timeout: 30 minutes
const INACTIVITY_MS = 30 * 60 * 1000;
// Refresh token 5 minutes before the 30min JWT expires
const REFRESH_INTERVAL_MS = 25 * 60 * 1000;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, token: null, isLoading: true });
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRef = useRef<string | null>(null);

  const clearTimers = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
  }, []);

  const doLogout = useCallback(() => {
    clearTimers();
    localStorage.removeItem(TOKEN_KEY);
    tokenRef.current = null;
    setState({ user: null, token: null, isLoading: false });
  }, [clearTimers]);

  // Refresh token silently before it expires
  const scheduleRefresh = useCallback((currentToken: string) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
        if (!res.ok) { doLogout(); return; }
        // Re-login not possible without password — just verify token is still valid.
        // If /me returns 401, token expired → logout.
      } catch {
        doLogout();
      }
    }, REFRESH_INTERVAL_MS);
  }, [doLogout]);

  // Reset inactivity timer on any user activity
  const resetInactivity = useCallback(() => {
    if (!tokenRef.current) return;
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      doLogout();
    }, INACTIVITY_MS);
  }, [doLogout]);

  // Attach activity listeners
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const handler = () => resetInactivity();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    return () => events.forEach(e => window.removeEventListener(e, handler));
  }, [resetInactivity]);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setState({ user: null, token: null, isLoading: false }); return; }
    fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) {
          tokenRef.current = token;
          setState({ user: data.user, token, isLoading: false });
          resetInactivity();
          scheduleRefresh(token);
        } else {
          doLogout();
        }
      })
      .catch(() => doLogout());
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur de connexion');
    }
    const { token, user } = await res.json();
    localStorage.setItem(TOKEN_KEY, token);
    tokenRef.current = token;
    setState({ user, token, isLoading: false });
    resetInactivity();
    scheduleRefresh(token);
  }, [resetInactivity, scheduleRefresh]);

  const logout = useCallback(() => {
    doLogout();
  }, [doLogout]);

  const can = useCallback((action: Permission): boolean => {
    if (!state.user) return false;
    return ROLE_PERMISSIONS[state.user.role]?.includes(action) ?? false;
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function useAuthToken(): string | null {
  return useContext(AuthContext)?.token ?? null;
}
