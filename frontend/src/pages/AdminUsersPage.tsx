import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUser,
  type AdminUser,
} from "@/lib/admin-api";
import type { UserGender } from "@/lib/auth-api";
import { paths } from "@/routes/paths";

import "./AdminUsersPage.css";

const TOKEN_KEY = "eu-renewables-auth-token";

function emptyCreateForm() {
  return {
    username: "",
    email: "",
    displayName: "",
    gender: "Other" as UserGender,
    password: "",
  };
}

export function AdminUsersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    displayName: "",
    gender: "Other" as UserGender,
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      throw new Error("You are not signed in.");
    }

    setLoading(true);
    setError(null);
    try {
      const next = await fetchAdminUsers(token);
      setUsers(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.isAdmin) {
      return;
    }

    void loadUsers();
  }, [user?.isAdmin, loadUsers]);

  if (authLoading) {
    return <p className="admin-muted">Loading…</p>;
  }

  if (!user?.isAdmin) {
    return <Navigate to={paths.home} replace />;
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await createAdminUser(token, createForm);
      setCreateForm(emptyCreateForm());
      setMessage("User created.");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create user.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(item: AdminUser) {
    setEditingId(item.id);
    setEditForm({
      username: item.username,
      email: item.email,
      displayName: item.displayName,
      gender: (item.gender as UserGender) || "Other",
      password: "",
    });
    setMessage(null);
    setError(null);
  }

  async function handleUpdate(event: FormEvent) {
    event.preventDefault();
    if (editingId == null) {
      return;
    }

    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await updateAdminUser(token, editingId, {
        username: editForm.username,
        email: editForm.email,
        displayName: editForm.displayName,
        gender: editForm.gender,
        password: editForm.password || undefined,
      });
      setEditingId(null);
      setMessage("User updated.");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update user.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item: AdminUser) {
    if (item.isAdmin) {
      return;
    }

    if (!window.confirm(`Delete user ${item.username}?`)) {
      return;
    }

    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await deleteAdminUser(token, item.id);
      if (editingId === item.id) {
        setEditingId(null);
      }
      setMessage("User deleted.");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete user.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="admin-page">
      <header className="admin-header">
        <h1 className="admin-title">Manage users</h1>
        <p className="admin-muted">
          Only the admin account can view and change accounts here. Usernames
          must be unique; emails may be shared.
        </p>
      </header>

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      {message && <p className="admin-success">{message}</p>}

      <form className="admin-card" onSubmit={handleCreate}>
        <h2 className="admin-section-title">Add user</h2>
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Username</span>
            <input
              type="text"
              value={createForm.username}
              onChange={(event) =>
                setCreateForm((form) => ({
                  ...form,
                  username: event.target.value,
                }))
              }
              required
            />
          </label>
          <label className="admin-field">
            <span>Email</span>
            <input
              type="email"
              value={createForm.email}
              onChange={(event) =>
                setCreateForm((form) => ({
                  ...form,
                  email: event.target.value,
                }))
              }
              required
            />
          </label>
          <label className="admin-field">
            <span>Display name</span>
            <input
              type="text"
              value={createForm.displayName}
              onChange={(event) =>
                setCreateForm((form) => ({
                  ...form,
                  displayName: event.target.value,
                }))
              }
            />
          </label>
          <label className="admin-field">
            <span>Gender</span>
            <select
              value={createForm.gender}
              onChange={(event) =>
                setCreateForm((form) => ({
                  ...form,
                  gender: event.target.value as UserGender,
                }))
              }
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label className="admin-field">
            <span>Password</span>
            <input
              type="password"
              value={createForm.password}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              onChange={(event) =>
                setCreateForm((form) => ({
                  ...form,
                  password: event.target.value,
                }))
              }
            />
          </label>
        </div>
        <button
          type="submit"
          className="admin-btn-primary"
          disabled={submitting}
        >
          {submitting ? "Working…" : "Add user"}
        </button>
      </form>

      <div className="admin-card">
        <div className="admin-table-header">
          <h2 className="admin-section-title">All users</h2>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => void loadUsers()}
            disabled={loading || submitting}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="admin-muted">Loading users…</p>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Gender</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id}>
                    <td>{item.username}</td>
                    <td>{item.displayName || "—"}</td>
                    <td>{item.email}</td>
                    <td>{item.gender || "—"}</td>
                    <td>{item.isAdmin ? "Admin" : "User"}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          onClick={() => startEdit(item)}
                          disabled={submitting}
                        >
                          Edit
                        </button>
                        {!item.isAdmin && (
                          <button
                            type="button"
                            className="admin-btn-danger"
                            onClick={() => void handleDelete(item)}
                            disabled={submitting}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingId != null && (
        <form className="admin-card" onSubmit={handleUpdate}>
          <h2 className="admin-section-title">Edit user</h2>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Username</span>
              <input
                type="text"
                value={editForm.username}
                onChange={(event) =>
                  setEditForm((form) => ({
                    ...form,
                    username: event.target.value,
                  }))
                }
                required
                disabled={
                  users.find((item) => item.id === editingId)?.isAdmin === true
                }
              />
            </label>
            <label className="admin-field">
              <span>Email</span>
              <input
                type="email"
                value={editForm.email}
                onChange={(event) =>
                  setEditForm((form) => ({
                    ...form,
                    email: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label className="admin-field">
              <span>Display name</span>
              <input
                type="text"
                value={editForm.displayName}
                onChange={(event) =>
                  setEditForm((form) => ({
                    ...form,
                    displayName: event.target.value,
                  }))
                }
              />
            </label>
            <label className="admin-field">
              <span>Gender</span>
              <select
                value={editForm.gender}
                onChange={(event) =>
                  setEditForm((form) => ({
                    ...form,
                    gender: event.target.value as UserGender,
                  }))
                }
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label className="admin-field">
              <span>New password (optional)</span>
              <input
                type="password"
                value={editForm.password}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                onChange={(event) =>
                  setEditForm((form) => ({
                    ...form,
                    password: event.target.value,
                  }))
                }
                placeholder="Leave blank to keep current"
              />
            </label>
          </div>
          <div className="admin-row-actions">
            <button
              type="submit"
              className="admin-btn-primary"
              disabled={submitting}
            >
              Save changes
            </button>
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={() => setEditingId(null)}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
