import { useState } from "react";
import { Eye, EyeOff, Leaf } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { paths } from "@/routes/paths";

import "./LoginPage.css";

type Mode = "login" | "register";
type Gender = "Male" | "Female" | "Other";

const PREVIEW_NAV = ["Home", "Europe Map", "Comparison"] as const;

export function LoginPage() {
  const navigate = useNavigate();
  const { user, isLoading, login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<Gender>("Other");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isLoading && user) {
    return <Navigate to={paths.home} replace />;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await login(username, password);
        navigate(paths.home, { replace: true });
        return;
      }

      const verifyMessage = await register({
        username,
        email,
        displayName,
        gender,
        password,
        confirmPassword,
      });

      if (verifyMessage) {
        setMessage(verifyMessage);
        setPassword("");
        setConfirmPassword("");
        return;
      }

      navigate(paths.home, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Soft preview of the real app chrome behind the glass panel */}
      <div className="login-app-preview" aria-hidden="true">
        <aside className="login-preview-sidebar">
          <div className="login-preview-brand">
            <span className="login-preview-logo">
              <Leaf size={18} />
            </span>
            <div>
              <div className="login-preview-brand-title">EU Renewables</div>
              <div className="login-preview-brand-sub">Monitor</div>
            </div>
          </div>
          <div className="login-preview-live">
            <span className="login-preview-live-dot" />
            Live data · ENTSO-E
          </div>
          <ul className="login-preview-nav">
            {PREVIEW_NAV.map((label, index) => (
              <li
                key={label}
                className={index === 0 ? "is-active" : undefined}
              >
                {label}
              </li>
            ))}
          </ul>
        </aside>

        <div className="login-preview-main">
          <section className="login-preview-hero">
            <span className="login-preview-badge">
              Renewable Investment Advisor
            </span>
            <h2>The future of energy is renewable</h2>
            <p>
              Explore generation across Europe — map, dashboards, and country
              comparison.
            </p>
          </section>
          <div className="login-preview-mosaic">
            <div className="login-preview-tile login-preview-tile-solar" />
            <div className="login-preview-tile login-preview-tile-wind" />
            <div className="login-preview-tile login-preview-tile-hydro" />
            <div className="login-preview-tile login-preview-tile-geo" />
          </div>
        </div>
      </div>

      <div className="login-scrim" aria-hidden="true" />

      <div className="login-panel">
        <div className="login-panel-brand">
          <span className="login-panel-logo">
            <Leaf size={20} />
          </span>
          <div>
            <h1 className="login-title">EU Renewables</h1>
            <p className="login-kicker">Monitor</p>
          </div>
        </div>

        <p className="login-subtitle">
          {mode === "login"
            ? "Sign in with your username and password"
            : "Create an account to continue"}
        </p>

        <div className="login-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={mode === "login" ? "is-active" : undefined}
            aria-selected={mode === "login"}
            onClick={() => {
              setMode("login");
              setError(null);
              setMessage(null);
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            className={mode === "register" ? "is-active" : undefined}
            aria-selected={mode === "register"}
            onClick={() => {
              setMode("register");
              setError(null);
              setMessage(null);
            }}
          >
            Register
          </button>
        </div>

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
              name="eu-renewables-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="off"
              required
            />
          </label>

          {mode === "register" && (
            <>
              <label>
                Email
                <input
                  type="email"
                  name="eu-renewables-email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="off"
                  required
                />
              </label>
              <label>
                Display name
                <input
                  type="text"
                  name="eu-renewables-display-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  autoComplete="off"
                  required
                />
              </label>
              <fieldset className="login-gender">
                <legend>Gender</legend>
                {(
                  [
                    ["Male", "Male"],
                    ["Female", "Female"],
                    ["Other", "Other"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="login-gender-option">
                    <input
                      type="radio"
                      name="gender"
                      value={value}
                      checked={gender === value}
                      onChange={() => setGender(value)}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
            </>
          )}

          <label>
            Password
            <div className="login-password-field">
              <input
                type="text"
                name="eu-renewables-secret"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={
                  showPassword
                    ? "masked-secret-input is-revealed"
                    : "masked-secret-input"
                }
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
                data-bwignore="true"
                required
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {mode === "register" && (
            <label>
              Confirm password
              <div className="login-password-field">
                <input
                  type="text"
                  name="eu-renewables-secret-confirm"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={
                    showConfirmPassword
                      ? "masked-secret-input is-revealed"
                      : "masked-secret-input"
                  }
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  data-bwignore="true"
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>
          )}

          {mode === "login" && (
            <p className="login-forgot-row">
              <Link to={paths.forgotPassword} className="login-forgot-link">
                Forgot password?
              </Link>
            </p>
          )}

          {error && <p className="login-error">{error}</p>}
          {message && <p className="login-success">{message}</p>}
          <button type="submit" disabled={loading}>
            {loading
              ? mode === "login"
                ? "Signing in…"
                : "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
