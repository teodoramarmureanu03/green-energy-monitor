import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  ACCESS_TOKEN_KEY,
  AUTH_USER_KEY,
  fetchCurrentUser,
  getAccessToken,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  setAccessToken,
} from "@/lib/auth";
import { AuthContext, type AuthUser } from "@/lib/auth-context";

function saveSession(user: AuthUser, token: string) {
  window.sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  setAccessToken(token);
}

function clearSession() {
  window.sessionStorage.removeItem(AUTH_USER_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      let token = getAccessToken();
      const rawUser = window.sessionStorage.getItem(AUTH_USER_KEY);

      if (rawUser) {
        try {
          setUser(JSON.parse(rawUser) as AuthUser);
        } catch {
          // ignore invalid cache
        }
      }

      try {
        if (!token) {
          // Access missing/expired — try HttpOnly refresh cookie.
          const refreshed = await refreshAccessToken();
          token = refreshed.token;
          if (!cancelled) {
            const next = { email: refreshed.email, role: refreshed.role };
            saveSession(next, token);
            setUser(next);
          }
          return;
        }

        const current = await fetchCurrentUser(token);
        if (!cancelled) {
          const next = { email: current.email, role: current.role };
          saveSession(next, token);
          setUser(next);
        }
      } catch {
        try {
          const refreshed = await refreshAccessToken();
          if (!cancelled) {
            const next = { email: refreshed.email, role: refreshed.role };
            saveSession(next, refreshed.token);
            setUser(next);
          }
        } catch {
          clearSession();
          if (!cancelled) {
            setUser(null);
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginUser(email, password);
    const next = { email: response.email, role: response.role };
    saveSession(next, response.token);
    setUser(next);
  }, []);

  const register = useCallback(
    async (email: string, password: string, confirmPassword: string) => {
      const response = await registerUser(email, password, confirmPassword);
      const next = { email: response.email, role: response.role };
      saveSession(next, response.token);
      setUser(next);
    },
    []
  );

  const logout = useCallback(async () => {
    await logoutUser();
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
