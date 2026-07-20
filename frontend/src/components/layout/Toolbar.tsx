import { Sun, Moon } from "lucide-react";

import { useTheme } from "@/hooks/useTheme";

interface ToolbarProps {
  title: string;
  subtitle?: string;
}

export function Toolbar({ title, subtitle }: ToolbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="layout-toolbar">
      <div className="layout-toolbar-titles">
        <div className="layout-toolbar-title">{title}</div>
        {subtitle && (
          <div className="layout-toolbar-subtitle">{subtitle}</div>
        )}
      </div>

      <div className="layout-toolbar-actions">
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
