const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export const ACCESS_TOKEN_KEY = "eu-renewables-auth-token";
export const AUTH_USER_KEY = "eu-renewables-auth-user";

export interface AuthResponse {
  token: string;
  email: string;
  role: string;
  expiresInSeconds?: number;
}

async function readError(response: Response, fallback: string): Promise<string> {
  const data = (await response.json().catch(() => ({}))) as { message?: string };
  return data.message || fallback;
}

export function getAccessToken(): string | null {
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(await readError(response, "Authentication failed."));
  }

  return response.json();
}

export async function registerUser(
  email: string,
  password: string,
  confirmPassword: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, confirmPassword }),
  });

  if (!response.ok) {
    throw new Error(await readError(response, "Registration failed."));
  }

  return response.json();
}

/** Uses HttpOnly refresh_token cookie to get a new access JWT. */
export async function refreshAccessToken(): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await readError(response, "Session expired."));
  }

  const data = (await response.json()) as AuthResponse;
  setAccessToken(data.token);
  return data;
}

export async function fetchCurrentUser(token: string): Promise<{
  email: string;
  role: string;
}> {
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Session expired.");
  }

  return response.json();
}

export async function logoutUser(): Promise<void> {
  await fetch(`${API_BASE}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => {
    // Local session clear still happens on the client.
  });
}
