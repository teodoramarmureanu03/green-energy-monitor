import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { UserAvatar } from "@/components/layout/UserAvatar";
import { useAuth } from "@/hooks/useAuth";
import { verifyEmailAccount } from "@/lib/auth-api";
import { paths } from "@/routes/paths";

import "./AccountPage.css";

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
          `Welcome, ${response.user.displayName || response.user.username}. Your account is ready.`
        );
        window.setTimeout(() => {
          navigate(paths.account, { replace: true });
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
    <section className="account-page account-page-narrow">
      <header className="account-header">
        <UserAvatar size={64} />
        <div>
          <h1 className="account-title">Verify email</h1>
          <p className="account-muted">
            Confirm your address to finish creating your account.
          </p>
        </div>
      </header>

      <div className="account-card">
        {status === "error" ? (
          <p className="account-error" role="alert">
            {message}
          </p>
        ) : (
          <p
            className={
              status === "success" ? "account-success" : "account-muted"
            }
          >
            {message}
          </p>
        )}

        <p className="account-muted account-link-row">
          <Link to={paths.account} className="account-text-link">
            {status === "success" ? "Go to account" : "Back to sign in"}
          </Link>
        </p>
      </div>
    </section>
  );
}
