import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { verifyEmailAccount } from "@/lib/auth-api";
import { paths } from "@/routes/paths";

import "./LoginPage.css";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const navigate = useNavigate();
  const { establishSession } = useAuth();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error"
  );
  const [message, setMessage] = useState(
    token
      ? "Verifying your email…"
      : "Verification link is invalid or has expired."
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    verifyEmailAccount(token)
      .then((response) => {
        if (cancelled) {
          return;
        }

        establishSession(response);
        setStatus("success");
        setMessage(
          `Welcome, ${response.displayName || response.username}. Your account is ready.`
        );
        window.setTimeout(() => {
          navigate(paths.home, { replace: true });
        }, 1000);
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }

        setStatus("error");
        setMessage(
          err instanceof Error ? err.message : "Could not verify email."
        );
      });

    return () => {
      cancelled = true;
    };
  }, [token, establishSession, navigate]);

  return (
    <div className="login-page">
      <div className="login-backdrop" aria-hidden="true" />
      <div className="login-panel">
        <h1 className="login-title">Verify email</h1>
        <p className="login-subtitle">
          Confirm your address to finish creating your account.
        </p>

        {status === "error" ? (
          <p className="login-error" role="alert">
            {message}
          </p>
        ) : (
          <p className={status === "success" ? "login-success" : "login-subtitle"}>
            {message}
          </p>
        )}

        <p className="login-footer-link">
          <Link to={paths.login}>
            {status === "success" ? "Go to home" : "Back to sign in"}
          </Link>
        </p>
      </div>
    </div>
  );
}
