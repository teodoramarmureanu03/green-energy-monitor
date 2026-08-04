import { createContext } from "react";

export interface AuthUser {
  username: string;
  email: string;
  displayName: string;
  gender: string;
  role: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (input: {
    username: string;
    email: string;
    displayName: string;
    gender: string;
    password: string;
    confirmPassword: string;
  }) => Promise<string | null>;
  /** Apply a verified-email / login-style AuthResponse into the session. */
  establishSession: (response: {
    token: string;
    username: string;
    email: string;
    displayName: string;
    gender: string;
    role: string;
  }) => void;
  logout: () => Promise<void>;
  updateProfile: (input: {
    username: string;
    email: string;
    displayName: string;
    gender: string;
  }) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
