import { Link } from "react-router-dom";

import { AUTH_REQUIRED_MESSAGE } from "@/lib/auth-gate";
import { paths } from "@/routes/paths";

/** Shown when a signed-out visitor opens a login-only route. */
export function AuthRequiredPanel() {
  return (
    <section className="auth-required-panel" role="status">
      <p className="auth-required-panel-message">{AUTH_REQUIRED_MESSAGE}</p>
      <Link to={paths.account} className="auth-required-panel-link">
        Sign in or register
      </Link>
    </section>
  );
}
