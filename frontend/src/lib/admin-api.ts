import type { UserGender } from "@/lib/auth-api";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  displayName: string;
  gender: UserGender | string;
  isAdmin: boolean;
  createdAt: string;
}

export type AdminRoleFilter = "all" | "admin" | "user";
export type AdminGenderFilter = "all" | "Male" | "Female" | "Other";
export type AdminSortBy = "username" | "name" | "email" | "role";
export type AdminSortDir = "asc" | "desc";

export interface AdminUserListParams {
  search?: string;
  role?: AdminRoleFilter;
  gender?: AdminGenderFilter;
  sortBy?: AdminSortBy;
  sortDir?: AdminSortDir;
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

export async function fetchAdminUsers(
  token: string,
  params: AdminUserListParams = {}
): Promise<AdminUser[]> {
  const query = new URLSearchParams();
  const search = params.search?.trim();
  if (search) {
    query.set("search", search);
  }
  if (params.role && params.role !== "all") {
    query.set("role", params.role);
  }
  if (params.gender && params.gender !== "all") {
    query.set("gender", params.gender);
  }
  if (params.sortBy) {
    query.set("sortBy", params.sortBy);
  }
  if (params.sortDir) {
    query.set("sortDir", params.sortDir);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`${API_BASE}/api/admin/users${suffix}`, {
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
    username: string;
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
    username: string;
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

export async function deleteAdminUser(
  token: string,
  id: number
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/admin/users/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Could not delete user."));
  }
}
