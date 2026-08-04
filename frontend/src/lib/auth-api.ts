export type UserGender = "Male" | "Female" | "Other";

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

export async function requestPasswordReset(input: {
  username: string;
  email: string;
}): Promise<string> {
  const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Could not send reset email.")
    );
  }

  const payload = (await response.json()) as {
    message?: string;
    Message?: string;
  };

  return (
    payload.message ??
    payload.Message ??
    "If an account matches that username and email, we sent a password reset link."
  );
}

export async function resetPasswordWithToken(input: {
  token: string;
  newPassword: string;
}): Promise<string> {
  const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Could not reset password.")
    );
  }

  const payload = (await response.json()) as {
    message?: string;
    Message?: string;
  };

  return (
    payload.message ??
    payload.Message ??
    "Password updated. You can sign in with your new password."
  );
}

export async function verifyEmailAccount(token: string): Promise<{
  token: string;
  username: string;
  email: string;
  displayName: string;
  gender: string;
  role: string;
}> {
  const response = await fetch(`${API_BASE}/api/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Could not verify email."));
  }

  return response.json();
}
