import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { UserAvatar } from "@/components/layout/UserAvatar";
import { useAuth } from "@/hooks/useAuth";
import type { UserGender } from "@/lib/auth-api";
import { paths } from "@/routes/paths";

import "./AccountPage.css";

function isUserGender(value: string): value is UserGender {
  return value === "Male" || value === "Female" || value === "Other";
}

export function AccountPage() {
  const navigate = useNavigate();
  const {
    user,
    isLoading,
    updateProfile,
    changePassword,
    logout,
    deleteAccount,
  } = useAuth();

  const [profileUsername, setProfileUsername] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileGender, setProfileGender] = useState<UserGender | "">("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfileUsername(user.username);
    setProfileName(user.displayName);
    setProfileEmail(user.email);
    setProfileGender(isUserGender(user.gender) ? user.gender : "");
  }, [user]);

  async function handleProfileSave(event: FormEvent) {
    event.preventDefault();
    setSaveMessage(null);
    setProfileError(null);

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
      await updateProfile({
        username,
        email,
        displayName: profileName.trim(),
        gender: profileGender,
      });
      setSaveMessage("Profile saved.");
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Could not update profile."
      );
    } finally {
      setIsProfileSubmitting(false);
    }
  }

  async function handlePasswordChange(event: FormEvent) {
    event.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (!newPassword) {
      setPasswordError("New password is required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setIsPasswordSubmitting(true);

    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password updated.");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Could not change password."
      );
    } finally {
      setIsPasswordSubmitting(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteAccount();
      navigate(paths.login, { replace: true });
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Could not delete account."
      );
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function handleSignOut() {
    await logout();
    navigate(paths.login, { replace: true });
  }

  if (isLoading) {
    return (
      <section className="account-page">
        <p className="account-muted">Loading account…</p>
      </section>
    );
  }

  if (!user) {
    return <Navigate to={paths.login} replace />;
  }

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
            autoComplete="email"
          />
        </label>

        <label className="account-field">
          <span>Display name</span>
          <input
            type="text"
            value={profileName}
            onChange={(event) => setProfileName(event.target.value)}
            autoComplete="name"
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

        {profileError && (
          <p className="account-error" role="alert">
            {profileError}
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
            onClick={() => void handleSignOut()}
            disabled={isProfileSubmitting}
          >
            Sign out
          </button>
        </div>
      </form>

      <form
        className="account-card"
        onSubmit={handlePasswordChange}
        autoComplete="off"
      >
        <h2 className="account-section-title">Change password</h2>

        <label className="account-field">
          <span>Current password</span>
          <input
            type="text"
            name="eu-renewables-current-secret"
            className="masked-secret-input"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            data-bwignore="true"
          />
        </label>

        <label className="account-field">
          <span>New password</span>
          <input
            type="text"
            name="eu-renewables-new-secret"
            className="masked-secret-input"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            data-bwignore="true"
          />
        </label>

        <label className="account-field">
          <span>Confirm new password</span>
          <input
            type="text"
            name="eu-renewables-confirm-secret"
            className="masked-secret-input"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            data-bwignore="true"
          />
        </label>

        {passwordError && (
          <p className="account-error" role="alert">
            {passwordError}
          </p>
        )}
        {passwordMessage && (
          <p className="account-success">{passwordMessage}</p>
        )}

        <button
          type="submit"
          className="account-btn-primary"
          disabled={isPasswordSubmitting}
        >
          {isPasswordSubmitting ? "Updating…" : "Update password"}
        </button>
      </form>

      {user.role !== "Admin" && (
        <div className="account-card account-danger-zone">
          <h2 className="account-section-title">Delete account</h2>
          <p className="account-muted">
            This permanently removes your account from the database.
          </p>

          {deleteError && (
            <p className="account-error" role="alert">
              {deleteError}
            </p>
          )}

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
      )}
    </section>
  );
}
