import { createContext } from "react";
import type { AuthUser, UserGender } from "@/lib/auth-api";

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    displayName: string,
    password: string,
    gender: UserGender
  ) => Promise<void>;
  updateProfile: (displayName: string, gender: UserGender) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
