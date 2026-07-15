import { Sun, Moon } from "lucide-react";
import { colors } from "@/lib/tokens";
import { useTheme } from "@/hooks/useTheme";

export function Toolbar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { theme, toggleTheme } = useTheme();

  const iconBtn: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 36, height: 36, borderRadius: 9,
    border: `1px solid ${colors.borderAccent}`,
    background: colors.surface, color: colors.slate, cursor: "pointer",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        paddingBottom: 16,
        borderBottom: `1px solid ${colors.borderAccent}`,
        marginBottom: 28,
      }}
    >
      {/* Left — page title */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 500, color: colors.ink, letterSpacing: "-0.01em" }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{subtitle}</div>
        )}
      </div>

      {/* Right — actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          style={iconBtn}
        >
          {theme === "light" ? <Moon className="h-4.25 w-4.25" /> : <Sun className="h-4.25 w-4.25" />}
        </button>

      </div>
    </div>
  );
}