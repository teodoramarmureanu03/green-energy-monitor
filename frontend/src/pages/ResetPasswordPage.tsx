import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { UserAvatar } from "@/components/layout/UserAvatar";
import { resetPasswordWithToken } from "@/lib/auth-api";
import { paths } from "@/routes/paths";

import "./AccountPage.css";

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
    <section className="account-page account-page-narrow">
      <header className="account-header">
        <UserAvatar size={64} />
        <div>
          <h1 className="account-title">Reset password</h1>
          <p className="account-muted">
            Choose a new password for your account.
          </p>
        </div>
      </header>

      {!token ? (
        <div className="account-card">
          <p className="account-error" role="alert">
            Reset link is invalid or has expired.
          </p>
          <p className="account-muted account-link-row">
            <Link to={paths.forgotPassword} className="account-text-link">
              Request a new reset link
            </Link>
          </p>
        </div>
      ) : (
        <form
          className="account-card"
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          <label className="account-field">
            <span>New password</span>
            <input
              type="password"
              name="reset-new-password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              minLength={6}
            />
          </label>

          <label className="account-field">
            <span>Confirm new password</span>
            <input
              type="password"
              name="reset-confirm-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={6}
            />
          </label>

          {error && (
            <p className="account-error" role="alert">
              {error}
            </p>
          )}

          {message && <p className="account-success">{message}</p>}

          {!message && (
            <button
              type="submit"
              className="account-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating…" : "Update password"}
            </button>
          )}

          <p className="account-muted account-link-row">
            <Link to={paths.account} className="account-text-link">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </section>
  );
}
