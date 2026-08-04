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
  changePasswordUser,
  deleteAccountUser,
  fetchCurrentUser,
  getAccessToken,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  setAccessToken,
  updateProfileUser,
  type AuthResponse,
} from "@/lib/auth";
import { AuthContext, type AuthUser } from "@/lib/auth-context";

function toAuthUser(
  response: AuthResponse | Awaited<ReturnType<typeof fetchCurrentUser>>
): AuthUser {
  return {
    username: response.username,
    email: response.email,
    displayName: response.displayName,
    gender: response.gender,
    role: response.role,
  };
}

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

      // Tab/browser close clears sessionStorage. Do not silently log the user
      // back in with only the refresh cookie (that would outlive a closed tab).
      if (!token && !rawUser) {
        clearSession();
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      if (rawUser) {
        try {
          setUser(JSON.parse(rawUser) as AuthUser);
        } catch {
          // ignore invalid cache
        }
      }

      try {
        if (!token) {
          const refreshed = await refreshAccessToken();
          token = refreshed.token;
          if (!cancelled) {
            const next = toAuthUser(refreshed);
            saveSession(next, token);
            setUser(next);
          }
          return;
        }

        const current = await fetchCurrentUser(token);
        if (!cancelled) {
          const next = toAuthUser(current);
          saveSession(next, token);
          setUser(next);
        }
      } catch {
        try {
          const refreshed = await refreshAccessToken();
          if (!cancelled) {
            const next = toAuthUser(refreshed);
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

  const login = useCallback(async (username: string, password: string) => {
    const response = await loginUser(username, password);
    const next = toAuthUser(response);
    saveSession(next, response.token);
    setUser(next);
  }, []);

  const register = useCallback(
    async (input: {
      username: string;
      email: string;
      displayName: string;
      gender: string;
      password: string;
      confirmPassword: string;
    }) => {
      const response = await registerUser(input);
      if ("token" in response && response.token) {
        const next = toAuthUser(response);
        saveSession(next, response.token);
        setUser(next);
        return null;
      }

      return (
        ("message" in response && response.message) ||
        "Verification email sent. Open the link in that message to create your account."
      );
    },
    []
  );

  const establishSession = useCallback(
    (response: {
      token: string;
      username: string;
      email: string;
      displayName: string;
      gender: string;
      role: string;
    }) => {
      const next = toAuthUser(response);
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

  const updateProfile = useCallback(
    async (input: {
      username: string;
      email: string;
      displayName: string;
      gender: string;
    }) => {
      const token = getAccessToken();
      if (!token) {
        throw new Error("You are not signed in.");
      }

      const response = await updateProfileUser(token, input);
      const next = toAuthUser(response);
      saveSession(next, response.token);
      setUser(next);
    },
    []
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const token = getAccessToken();
      if (!token) {
        throw new Error("You are not signed in.");
      }

      await changePasswordUser(token, currentPassword, newPassword);
    },
    []
  );

  const deleteAccount = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      throw new Error("You are not signed in.");
    }

    await deleteAccountUser(token);
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      establishSession,
      logout,
      updateProfile,
      changePassword,
      deleteAccount,
    }),
    [
      user,
      isLoading,
      login,
      register,
      establishSession,
      logout,
      updateProfile,
      changePassword,
      deleteAccount,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
