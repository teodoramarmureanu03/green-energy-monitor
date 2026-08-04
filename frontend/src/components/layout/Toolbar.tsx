import { Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { UserAvatar } from "@/components/layout/UserAvatar";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useTimezone } from "@/hooks/useTimezone";
import { ALL_TIMEZONES } from "@/lib/timezones";
import { paths } from "@/routes/paths";

interface ToolbarProps {
  title: string;
  subtitle?: string;
}

export function Toolbar({ title, subtitle }: ToolbarProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { timeZone, setTimeZone } = useTimezone();
  const { user } = useAuth();

  return (
    <div className="layout-toolbar">
      <div className="layout-toolbar-titles">
        <div className="layout-toolbar-title">{title}</div>
        {subtitle && <div className="layout-toolbar-subtitle">{subtitle}</div>}
      </div>

      <div className="layout-toolbar-actions">
        <div className="layout-toolbar-timezone-wrap">
          <label className="layout-toolbar-timezone">
            <span className="layout-toolbar-timezone-label">Timezone</span>
            <select
              className="layout-toolbar-timezone-select"
              value={timeZone}
              onChange={(event) => setTimeZone(event.target.value)}
              aria-label="Select timezone for dates and charts"
              title="Dates, times, and chart days use this timezone"
            >
              {ALL_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </label>
        </div>

        {user && (
          <button
            type="button"
            onClick={() => navigate(paths.account)}
            aria-label="Open your profile"
            title={user.displayName || user.username}
            className="layout-toolbar-avatar-btn is-authenticated"
          >
            <UserAvatar gender={user.gender} size={32} />
          </button>
        )}

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={
            theme === "light" ? "Switch to dark mode" : "Switch to light mode"
          }
          title={
            theme === "light" ? "Switch to dark mode" : "Switch to light mode"
          }
          className="layout-toolbar-theme-btn"
        >
          {theme === "light" ? (
            <Moon className="h-4.25 w-4.25" />
          ) : (
            <Sun className="h-4.25 w-4.25" />
          )}
        </button>
      </div>
    </div>
  );
}
