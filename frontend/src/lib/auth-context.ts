import { createContext } from "react";
import type { AuthResponse, AuthUser, UserGender } from "@/lib/auth-api";

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  establishSession: (response: AuthResponse) => void;
  register: (
    username: string,
    email: string,
    displayName: string,
    password: string,
    gender: UserGender
  ) => Promise<string>;
  updateProfile: (
    username: string,
    displayName: string,
    gender: UserGender,
    email: string
  ) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
