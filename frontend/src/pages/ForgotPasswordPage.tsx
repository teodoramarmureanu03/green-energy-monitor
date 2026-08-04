import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { requestPasswordReset } from "@/lib/auth-api";
import { paths } from "@/routes/paths";

import "./LoginPage.css";

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
    <div className="login-page">
      <div className="login-backdrop" aria-hidden="true" />
      <div className="login-panel">
        <h1 className="login-title">Forgot password</h1>
        <p className="login-subtitle">
          Enter your username and email. We&apos;ll send a reset link if they
          match an account.
        </p>

        <form
          className="login-form"
          onSubmit={handleSubmit}
          autoComplete="off"
          noValidate
        >
          <label>
            Username
            <input
              type="text"
              name="eu-renewables-forgot-username"
              autoComplete="off"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              name="eu-renewables-forgot-email"
              autoComplete="off"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          {error && <p className="login-error">{error}</p>}
          {message && <p className="login-success">{message}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p className="login-footer-link">
          <Link to={paths.login}>Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
