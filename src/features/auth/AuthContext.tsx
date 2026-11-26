import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi } from '@/features/auth/authApi';
import { registerAuthBridge, setAccessToken } from '@/lib/apiClient';
import type { AuthTokenResponse, AuthUser } from '@/types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setSession: (session: AuthTokenResponse) => void;
  clearSession: () => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setTokenState] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const setSession = useCallback((session: AuthTokenResponse) => {
    setAccessToken(session.accessToken);
    setTokenState(session.accessToken);
    setUser(session.user);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setTokenState(null);
    setUser(null);
  }, []);

  useEffect(() => {
    registerAuthBridge({
      onRefreshed: setSession,
      onExpired: clearSession,
    });
  }, [setSession, clearSession]);

  useEffect(() => {
    let active = true;

    async function bootstrapSession() {
      try {
        // Ensure CSRF cookie exists if a refresh cookie is already present from an earlier session
        if (!document.cookie.includes('XSRF-TOKEN=')) {
          await authApi.initCsrf();
        }
        const session = await authApi.refresh();
        if (active) {
          setSession(session);
        }
      } catch {
        if (active) {
          clearSession();
        }
      } finally {
        if (active) {
          setIsInitializing(false);
        }
      }
    }

    void bootstrapSession();
    return () => {
      active = false;
    };
  }, [setSession, clearSession]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAll();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: Boolean(user && accessToken),
        isInitializing,
        setSession,
        clearSession,
        logout,
        logoutAll,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
