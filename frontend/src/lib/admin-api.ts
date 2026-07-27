import type { UserGender } from "@/lib/auth-api";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export interface AdminUser {
  id: number;
  email: string;
  displayName: string;
  gender: UserGender | string;
  isAdmin: boolean;
  createdAt: string;
}

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

function authHeaders(token: string, json = false): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

export async function fetchAdminUsers(token: string): Promise<AdminUser[]> {
  const response = await fetch(`${API_BASE}/api/admin/users`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Could not load users."));
  }

  return response.json();
}

export async function createAdminUser(
  token: string,
  input: {
    email: string;
    displayName: string;
    gender: UserGender;
    password: string;
  }
): Promise<AdminUser> {
  const response = await fetch(`${API_BASE}/api/admin/users`, {
    method: "POST",
    headers: authHeaders(token, true),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Could not create user."));
  }

  return response.json();
}

export async function updateAdminUser(
  token: string,
  id: number,
  input: {
    email: string;
    displayName: string;
    gender: UserGender;
    password?: string;
  }
): Promise<AdminUser> {
  const response = await fetch(`${API_BASE}/api/admin/users/${id}`, {
    method: "PUT",
    headers: authHeaders(token, true),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Could not update user."));
  }

  return response.json();
}

export async function deleteAdminUser(token: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/admin/users/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Could not delete user."));
  }
}
