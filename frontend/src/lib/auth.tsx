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
  type AuthUser,
  type UserGender,
} from "@/lib/auth-api";
import { AuthContext, type AuthContextValue } from "@/lib/auth-context";

const TOKEN_KEY = "eu-renewables-auth-token";

function normalizeUser(user: AuthUser): AuthUser {
  const gender = (user.gender ?? "").trim().toLowerCase();
  return {
    ...user,
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

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const response = await loginAccount({ email, password });
    window.localStorage.setItem(TOKEN_KEY, response.token);
    setUser(normalizeUser(response.user));
  }, []);

  const register = useCallback(
    async (
      email: string,
      displayName: string,
      password: string,
      gender: UserGender
    ) => {
      setError(null);
      const response = await registerAccount({
        email,
        displayName,
        password,
        gender,
      });
      window.localStorage.setItem(TOKEN_KEY, response.token);
      setUser(normalizeUser(response.user));
    },
    []
  );

  const updateProfile = useCallback(
    async (displayName: string, gender: UserGender) => {
      const token = window.localStorage.getItem(TOKEN_KEY);
      if (!token) {
        throw new Error("You are not signed in.");
      }

      setError(null);
      const updated = await updateProfileRequest(token, {
        displayName,
        gender,
      });
      setUser(normalizeUser(updated));
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
      login: async (email, password) => {
        try {
          await login(email, password);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not sign in.");
          throw err;
        }
      },
      register: async (email, displayName, password, gender) => {
        try {
          await register(email, displayName, password, gender);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Could not create account."
          );
          throw err;
        }
      },
      updateProfile: async (displayName, gender) => {
        try {
          await updateProfile(displayName, gender);
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
      clearError: () => setError(null),
    }),
    [
      user,
      isLoading,
      error,
      login,
      register,
      updateProfile,
      changePassword,
      logout,
      deleteAccount,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
