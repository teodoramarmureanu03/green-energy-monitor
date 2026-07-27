import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  fetchCurrentUser,
  loginAccount,
  registerAccount,
  updateProfile as updateProfileRequest,
  changePassword as changePasswordRequest,
  deleteAccount as deleteAccountRequest,
  type AuthResponse,
  type AuthUser,
  type UserGender,
} from "@/lib/auth-api";
import { AuthContext, type AuthContextValue } from "@/lib/auth-context";

const TOKEN_KEY = "eu-renewables-auth-token";

function normalizeUser(user: AuthUser): AuthUser {
  const gender = (user.gender ?? "").trim().toLowerCase();
  return {
    ...user,
    username: user.username ?? "",
    isAdmin: Boolean(user.isAdmin),
    gender:
      gender === "female"
        ? "Female"
        : gender === "male"
          ? "Male"
          : gender === "other"
            ? "Other"
            : user.gender,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    fetchCurrentUser(token)
      .then((currentUser) => {
        if (!cancelled) {
          setUser(normalizeUser(currentUser));
        }
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_KEY);
        if (!cancelled) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    const response = await loginAccount({ username, password });
    window.localStorage.setItem(TOKEN_KEY, response.token);
    setUser(normalizeUser(response.user));
  }, []);

  const establishSession = useCallback((response: AuthResponse) => {
    setError(null);
    window.localStorage.setItem(TOKEN_KEY, response.token);
    setUser(normalizeUser(response.user));
  }, []);

  const register = useCallback(
    async (
      username: string,
      email: string,
      displayName: string,
      password: string,
      gender: UserGender
    ) => {
      setError(null);
      return registerAccount({
        username,
        email,
        displayName,
        password,
        gender,
      });
    },
    []
  );

  const updateProfile = useCallback(
    async (
      username: string,
      displayName: string,
      gender: UserGender,
      email: string
    ) => {
      const token = window.localStorage.getItem(TOKEN_KEY);
      if (!token) {
        throw new Error("You are not signed in.");
      }

      setError(null);
      const response = await updateProfileRequest(token, {
        username,
        displayName,
        gender,
        email,
      });
      window.localStorage.setItem(TOKEN_KEY, response.token);
      setUser(normalizeUser(response.user));
    },
    []
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const token = window.localStorage.getItem(TOKEN_KEY);
      if (!token) {
        throw new Error("You are not signed in.");
      }

      setError(null);
      await changePasswordRequest(token, { currentPassword, newPassword });
    },
    []
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setError(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      throw new Error("You are not signed in.");
    }

    setError(null);
    await deleteAccountRequest(token);
    window.localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      error,
      login: async (username, password) => {
        try {
          await login(username, password);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not sign in.");
          throw err;
        }
      },
      establishSession,
      register: async (username, email, displayName, password, gender) => {
        try {
          return await register(username, email, displayName, password, gender);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not send verification email."
          );
          throw err;
        }
      },
      updateProfile: async (username, displayName, gender, email) => {
        try {
          await updateProfile(username, displayName, gender, email);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Could not update profile."
          );
          throw err;
        }
      },
      changePassword: async (currentPassword, newPassword) => {
        try {
          await changePassword(currentPassword, newPassword);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Could not change password."
          );
          throw err;
        }
      },
      logout,
      deleteAccount: async () => {
        try {
          await deleteAccount();
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Could not delete account."
          );
          throw err;
        }
      },
      clearError,
    }),
    [
      user,
      isLoading,
      error,
      login,
      establishSession,
      register,
      updateProfile,
      changePassword,
      logout,
      deleteAccount,
      clearError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
