import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { UserAvatar } from "@/components/layout/UserAvatar";
import { useAuth } from "@/hooks/useAuth";
import type { UserGender } from "@/lib/auth-api";
import { paths } from "@/routes/paths";

import "./AccountPage.css";

type AuthTab = "login" | "register";

function isUserGender(value: string): value is UserGender {
  return value === "Male" || value === "Female" || value === "Other";
}

function emptyAuthFields() {
  return {
    username: "",
    email: "",
    displayName: "",
    gender: "" as UserGender | "",
    password: "",
  };
}

export function AccountPage() {
  const {
    user,
    isLoading,
    error,
    login,
    register,
    updateProfile,
    changePassword,
    logout,
    deleteAccount,
    clearError,
  } = useAuth();

  const [tab, setTab] = useState<AuthTab>("login");
  const [authFields, setAuthFields] = useState(emptyAuthFields);
  const [profileUsername, setProfileUsername] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileGender, setProfileGender] = useState<UserGender | "">("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    clearError();
    setSaveMessage(null);
    setProfileError(null);
    setPasswordMessage(null);
    setConfirmDelete(false);
  }, [tab, clearError]);

  // Keep signed-out forms empty (no leftover register/login values).
  useEffect(() => {
    if (user) {
      return;
    }

    setAuthFields(emptyAuthFields());
    setTab("login");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setConfirmDelete(false);
    setSaveMessage(null);
    setPasswordMessage(null);
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfileUsername(user.username);
    setProfileName(user.displayName);
    setProfileEmail(user.email);
    setProfileGender(isUserGender(user.gender) ? user.gender : "");
  }, [user]);

  function switchTab(next: AuthTab) {
    setTab(next);
    setAuthFields(emptyAuthFields());
    clearError();
  }

  async function handleAuthSubmit(event: FormEvent) {
    event.preventDefault();
    setIsAuthSubmitting(true);
    clearError();

    try {
      if (tab === "login") {
        await login(authFields.username, authFields.password);
      } else {
        if (!isUserGender(authFields.gender)) {
          return;
        }
        await register(
          authFields.username,
          authFields.email,
          authFields.displayName,
          authFields.password,
          authFields.gender
        );
      }
      setAuthFields(emptyAuthFields());
    } catch {
      // Shown via auth context error.
    } finally {
      setIsAuthSubmitting(false);
    }
  }

  async function handleProfileSave(event: FormEvent) {
    event.preventDefault();
    setSaveMessage(null);
    setProfileError(null);
    clearError();

    const username = profileUsername.trim();
    const email = profileEmail.trim();
    if (!username) {
      setProfileError("Username is required.");
      return;
    }

    if (!email || !email.includes("@")) {
      setProfileError("Enter a valid email address.");
      return;
    }

    if (!isUserGender(profileGender)) {
      setProfileError("Select male, female, or other.");
      return;
    }

    setIsProfileSubmitting(true);

    try {
      await updateProfile(username, profileName, profileGender, email);
      setProfileUsername(username);
      setProfileName(profileName);
      setProfileEmail(email);
      setSaveMessage("Profile saved.");
    } catch {
      // Shown via auth context error.
    } finally {
      setIsProfileSubmitting(false);
    }
  }

  async function handlePasswordChange(event: FormEvent) {
    event.preventDefault();
    setPasswordMessage(null);
    clearError();

    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }

    setIsPasswordSubmitting(true);

    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password updated.");
    } catch {
      // Shown via auth context error.
    } finally {
      setIsPasswordSubmitting(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);

    try {
      await deleteAccount();
      setAuthFields(emptyAuthFields());
    } catch {
      // Shown via auth context error.
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (isLoading) {
    return (
      <section className="account-page">
        <p className="account-muted">Loading account…</p>
      </section>
    );
  }

  if (user) {
    return (
      <section className="account-page">
        <header className="account-header">
          <UserAvatar gender={user.gender} size={48} />
          <div>
            <h1 className="account-title">{user.displayName}</h1>
            <p className="account-muted">
              Update your details, password, or delete your account.
            </p>
          </div>
        </header>

        <form className="account-card" onSubmit={handleProfileSave}>
          <h2 className="account-section-title">Profile details</h2>

          <label className="account-field">
            <span>Username</span>
            <input
              type="text"
              value={profileUsername}
              onChange={(event) => setProfileUsername(event.target.value)}
              required
              autoComplete="username"
            />
          </label>

          <label className="account-field">
            <span>Email</span>
            <input
              type="email"
              value={profileEmail}
              onChange={(event) => setProfileEmail(event.target.value)}
              required
              autoComplete="off"
            />
          </label>

          <label className="account-field">
            <span>Display name</span>
            <input
              type="text"
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
              autoComplete="off"
            />
          </label>

          <fieldset className="account-gender">
            <legend>Gender</legend>
            <label className="account-gender-option">
              <input
                type="radio"
                name="profile-gender"
                checked={profileGender === "Male"}
                onChange={() => setProfileGender("Male")}
                required
              />
              <span>Male</span>
            </label>
            <label className="account-gender-option">
              <input
                type="radio"
                name="profile-gender"
                checked={profileGender === "Female"}
                onChange={() => setProfileGender("Female")}
                required
              />
              <span>Female</span>
            </label>
            <label className="account-gender-option">
              <input
                type="radio"
                name="profile-gender"
                checked={profileGender === "Other"}
                onChange={() => setProfileGender("Other")}
                required
              />
              <span>Other</span>
            </label>
          </fieldset>

          {(profileError || (error && !passwordMessage)) && (
            <p className="account-error" role="alert">
              {profileError ?? error}
            </p>
          )}
          {saveMessage && <p className="account-success">{saveMessage}</p>}

          <div className="account-actions">
            <button
              type="submit"
              className="account-btn-primary"
              disabled={isProfileSubmitting}
            >
              {isProfileSubmitting ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              className="account-btn-secondary"
              onClick={() => {
                logout();
                setAuthFields(emptyAuthFields());
              }}
              disabled={isProfileSubmitting}
            >
              Sign out
            </button>
          </div>
        </form>

        <form className="account-card" onSubmit={handlePasswordChange}>
          <h2 className="account-section-title">Change password</h2>

          <label className="account-field">
            <span>Current password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
            />
          </label>

          <label className="account-field">
            <span>New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
            />
          </label>

          <label className="account-field">
            <span>Confirm new password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
            />
          </label>

          {error && (
            <p className="account-error" role="alert">
              {error}
            </p>
          )}
          {passwordMessage &&
            (passwordMessage === "Password updated." ? (
              <p className="account-success">{passwordMessage}</p>
            ) : (
              <p className="account-error" role="alert">
                {passwordMessage}
              </p>
            ))}

          <button
            type="submit"
            className="account-btn-primary"
            disabled={isPasswordSubmitting}
          >
            {isPasswordSubmitting ? "Updating…" : "Update password"}
          </button>
        </form>

        <div className="account-card account-danger-zone">
          <h2 className="account-section-title">Delete account</h2>
          <p className="account-muted">
            This permanently removes your account from the database.
          </p>

          {confirmDelete ? (
            <div className="account-delete-confirm">
              <p className="account-error">This cannot be undone.</p>
              <div className="account-actions">
                <button
                  type="button"
                  className="account-btn-secondary"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="account-btn-danger"
                  onClick={() => void handleDeleteAccount()}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting…" : "Delete account"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="account-btn-danger"
              onClick={() => setConfirmDelete(true)}
            >
              Delete account
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="account-page account-page-narrow">
      <header className="account-header">
        <UserAvatar size={64} />
        <div>
          <h1 className="account-title">
            {tab === "login" ? "Sign in" : "Create account"}
          </h1>
          <p className="account-muted">
            {tab === "login"
              ? "Sign in with your username and password."
              : "Choose a unique username. Email can be shared with other accounts."}
          </p>
        </div>
      </header>

      <div className="account-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "login"}
          className={tab === "login" ? "account-tab is-active" : "account-tab"}
          onClick={() => switchTab("login")}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "register"}
          className={
            tab === "register" ? "account-tab is-active" : "account-tab"
          }
          onClick={() => switchTab("register")}
        >
          Register
        </button>
      </div>

      <form
        className="account-card"
        onSubmit={handleAuthSubmit}
        autoComplete="off"
      >
        <label className="account-field">
          <span>Username</span>
          <input
            type="text"
            name="auth-username"
            autoComplete="username"
            value={authFields.username}
            onChange={(event) =>
              setAuthFields((fields) => ({
                ...fields,
                username: event.target.value,
              }))
            }
            required
          />
        </label>

        {tab === "register" && (
          <>
            <label className="account-field">
              <span>Email</span>
              <input
                type="email"
                name="register-email"
                autoComplete="off"
                value={authFields.email}
                onChange={(event) =>
                  setAuthFields((fields) => ({
                    ...fields,
                    email: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label className="account-field">
              <span>Display name</span>
              <input
                type="text"
                name="register-display-name"
                autoComplete="off"
                value={authFields.displayName}
                onChange={(event) =>
                  setAuthFields((fields) => ({
                    ...fields,
                    displayName: event.target.value,
                  }))
                }
              />
            </label>

            <fieldset className="account-gender">
              <legend>Gender</legend>
              <label className="account-gender-option">
                <input
                  type="radio"
                  name="register-gender"
                  checked={authFields.gender === "Male"}
                  onChange={() =>
                    setAuthFields((fields) => ({ ...fields, gender: "Male" }))
                  }
                  required
                />
                <span>Male</span>
              </label>
              <label className="account-gender-option">
                <input
                  type="radio"
                  name="register-gender"
                  checked={authFields.gender === "Female"}
                  onChange={() =>
                    setAuthFields((fields) => ({
                      ...fields,
                      gender: "Female",
                    }))
                  }
                  required
                />
                <span>Female</span>
              </label>
              <label className="account-gender-option">
                <input
                  type="radio"
                  name="register-gender"
                  checked={authFields.gender === "Other"}
                  onChange={() =>
                    setAuthFields((fields) => ({
                      ...fields,
                      gender: "Other",
                    }))
                  }
                  required
                />
                <span>Other</span>
              </label>
            </fieldset>
          </>
        )}

        <label className="account-field">
          <span>Password</span>
          <input
            type="password"
            name="auth-password"
            autoComplete={tab === "login" ? "one-time-code" : "off"}
            data-1p-ignore
            data-lpignore="true"
            value={authFields.password}
            onChange={(event) =>
              setAuthFields((fields) => ({
                ...fields,
                password: event.target.value,
              }))
            }
          />
        </label>

        {tab === "login" && (
          <p className="account-muted account-link-row">
            <Link to={paths.forgotPassword} className="account-text-link">
              Forgot password?
            </Link>
          </p>
        )}

        {error && (
          <p className="account-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="account-btn-primary"
          disabled={isAuthSubmitting}
        >
          {isAuthSubmitting
            ? "Please wait…"
            : tab === "login"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>
    </section>
  );
}
