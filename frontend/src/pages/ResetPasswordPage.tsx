import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { resetPasswordWithToken } from "@/lib/auth-api";
import { paths } from "@/routes/paths";

import "./LoginPage.css";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError("Reset link is invalid or has expired.");
      return;
    }

    if (!newPassword) {
      setError("New password is required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await resetPasswordWithToken({ token, newPassword });
      setMessage(result);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not reset password."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-backdrop" aria-hidden="true" />
      <div className="login-panel">
        <h1 className="login-title">Reset password</h1>
        <p className="login-subtitle">
          Choose a new password for your account.
        </p>

        {!token ? (
          <>
            <p className="login-error" role="alert">
              Reset link is invalid or has expired.
            </p>
            <p className="login-footer-link">
              <Link to={paths.forgotPassword}>Request a new reset link</Link>
            </p>
          </>
        ) : (
          <form
            className="login-form"
            onSubmit={handleSubmit}
            autoComplete="off"
            noValidate
          >
            <label>
              New password
              <input
                type="text"
                name="eu-renewables-reset-secret"
                className="masked-secret-input"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
                data-bwignore="true"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
            </label>

            <label>
              Confirm new password
              <input
                type="text"
                name="eu-renewables-reset-secret-confirm"
                className="masked-secret-input"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
                data-bwignore="true"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </label>

            {error && <p className="login-error">{error}</p>}
            {message && <p className="login-success">{message}</p>}

            {!message && (
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating…" : "Update password"}
              </button>
            )}
          </form>
        )}

        <p className="login-footer-link">
          <Link to={paths.login}>Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
