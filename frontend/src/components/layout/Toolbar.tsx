import { RefreshCw, Sun, Moon, ChevronDown } from "lucide-react";
import { colors } from "@/lib/tokens";
import { useTheme } from "@/hooks/useTheme";

export function Toolbar({
  title,
  subtitle,
  onRefresh,
}: {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
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

        {/* Refresh */}
        <button onClick={onRefresh} aria-label="Refresh data" title="Refresh data" style={iconBtn}>
          <RefreshCw className="h-[17px] w-[17px]" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          style={iconBtn}
        >
          {theme === "light" ? <Moon className="h-[17px] w-[17px]" /> : <Sun className="h-[17px] w-[17px]" />}
        </button>

        {/* Separator */}
        <div style={{ width: 1, height: 24, background: colors.borderAccent, margin: "0 4px" }} />

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: colors.indigoDeep, color: "#ffffff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 500,
            }}
          >
            TM
          </div>
          <span className="hidden sm:inline" style={{ fontSize: 13, fontWeight: 500, color: colors.ink }}>
            Teodora M.
          </span>
          <ChevronDown className="h-[15px] w-[15px] hidden sm:block" style={{ color: colors.muted }} />
        </div>

      </div>
    </div>
  );
}