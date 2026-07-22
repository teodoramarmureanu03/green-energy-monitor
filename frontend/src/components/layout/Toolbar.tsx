import { Sun, Moon } from "lucide-react";

import { useTheme } from "@/hooks/useTheme";
import { useTimezone } from "@/hooks/useTimezone";
import { TIMEZONE_OPTIONS } from "@/lib/timezones";

interface ToolbarProps {
  title: string;
  subtitle?: string;
}

export function Toolbar({ title, subtitle }: ToolbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { countryIso, setCountryIso } = useTimezone();

  return (
    <div className="layout-toolbar">
      <div className="layout-toolbar-titles">
        <div className="layout-toolbar-title">{title}</div>
        {subtitle && (
          <div className="layout-toolbar-subtitle">{subtitle}</div>
        )}
      </div>

      <div className="layout-toolbar-actions">
        <label className="layout-toolbar-timezone">
          <span className="layout-toolbar-timezone-label">Timezone</span>
          <select
            className="layout-toolbar-timezone-select"
            value={countryIso}
            onChange={(event) => setCountryIso(event.target.value)}
            aria-label="Select country timezone for dates and charts"
            title="Dates, times, and chart days use this country's timezone"
          >
            {TIMEZONE_OPTIONS.map((option) => (
              <option key={option.isoCode} value={option.isoCode}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

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
