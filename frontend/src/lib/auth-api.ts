export type UserGender = "Male" | "Female" | "Other";

export interface AuthUser {
  id: number;
  email: string;
  displayName: string;
  gender: UserGender | string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as {
      message?: string;
      Message?: string;
    };
    return payload.message ?? payload.Message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function registerAccount(input: {
  email: string;
  displayName: string;
  gender: UserGender;
  password: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Could not create account.")
    );
  }

  return response.json();
}

export async function loginAccount(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Could not sign in."));
  }

  return response.json();
}

export async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Session expired. Please sign in again.");
  }

  return response.json();
}

export async function deleteAccount(token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Could not delete account.")
    );
  }
}

export async function updateProfile(
  token: string,
  input: { displayName: string; gender: UserGender }
): Promise<AuthUser> {
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Could not update profile.")
    );
  }

  return response.json();
}

export async function changePassword(
  token: string,
  input: { currentPassword: string; newPassword: string }
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/auth/me/password`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Could not change password.")
    );
  }
}
