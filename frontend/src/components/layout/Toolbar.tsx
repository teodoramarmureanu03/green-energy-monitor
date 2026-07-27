import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
} from "react";
import { Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AuthRequiredTip } from "@/components/layout/AuthRequiredTip";
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
  const [showTimezoneTip, setShowTimezoneTip] = useState(false);
  const timezoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTimezoneTip) {
      return;
    }

    const timeoutId = window.setTimeout(() => setShowTimezoneTip(false), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [showTimezoneTip]);

  function handleTimezoneChange(nextZone: string) {
    if (!user) {
      setShowTimezoneTip(true);
      return;
    }

    setTimeZone(nextZone);
  }

  function handleTimezoneInteract(
    event: MouseEvent<HTMLSelectElement> | FocusEvent<HTMLSelectElement>
  ) {
    if (!user) {
      event.preventDefault();
      event.currentTarget.blur();
      setShowTimezoneTip(true);
    }
  }

  return (
    <div className="layout-toolbar">
      <div className="layout-toolbar-titles">
        <div className="layout-toolbar-title">{title}</div>
        {subtitle && <div className="layout-toolbar-subtitle">{subtitle}</div>}
      </div>

      <div className="layout-toolbar-actions">
        <div ref={timezoneRef} className="layout-toolbar-timezone-wrap">
          <label className="layout-toolbar-timezone">
            <span className="layout-toolbar-timezone-label">Timezone</span>
            <select
              className="layout-toolbar-timezone-select"
              value={timeZone}
              onChange={(event) => handleTimezoneChange(event.target.value)}
              onMouseDown={handleTimezoneInteract}
              onFocus={handleTimezoneInteract}
              aria-label="Select timezone for dates and charts"
              title={
                user
                  ? "Dates, times, and chart days use this timezone"
                  : "Sign in to change timezone"
              }
            >
              {ALL_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </label>
          <AuthRequiredTip
            visible={showTimezoneTip}
            anchorRef={timezoneRef}
            placement="below"
          />
        </div>

        <button
          type="button"
          onClick={() => navigate(paths.account)}
          aria-label={user ? "Open your profile" : "Sign in or register"}
          title={user ? user.displayName : "Sign in or register"}
          className={
            user
              ? "layout-toolbar-avatar-btn is-authenticated"
              : "layout-toolbar-avatar-btn"
          }
        >
          <UserAvatar gender={user?.gender} size={user ? 32 : 22} />
        </button>

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
