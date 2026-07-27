import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { UserAvatar } from "@/components/layout/UserAvatar";
import { requestPasswordReset } from "@/lib/auth-api";
import { paths } from "@/routes/paths";

import "./AccountPage.css";

export function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const result = await requestPasswordReset({ username, email });
      setMessage(result);
      setUsername("");
      setEmail("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send reset email."
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
          <h1 className="account-title">Forgot password?</h1>
          <p className="account-muted">
            Enter your username and email so we can reset the correct account,
            then send a link to that address.
          </p>
        </div>
      </header>

      <form className="account-card" onSubmit={handleSubmit} autoComplete="off">
        <label className="account-field">
          <span>Username</span>
          <input
            type="text"
            name="forgot-username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>

        <label className="account-field">
          <span>Email</span>
          <input
            type="email"
            name="forgot-email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        {error && (
          <p className="account-error" role="alert">
            {error}
          </p>
        )}

        {message && <p className="account-success">{message}</p>}

        <button
          type="submit"
          className="account-btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending…" : "Send reset link"}
        </button>

        <p className="account-muted account-link-row">
          <Link to={paths.account} className="account-text-link">
            Back to sign in
          </Link>
        </p>
      </form>
    </section>
  );
}
