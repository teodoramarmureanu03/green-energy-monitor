import { useEffect, useState } from "react";
import { GitCompareArrows, Map, Leaf, Home, PanelLeftClose, PanelLeftOpen, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { colors, gradients } from "@/lib/tokens";
import { useTheme } from "@/hooks/useTheme";

export type Screen = "home" | "dashboard" | "comparison" | "map";

const ITEMS: { id: Screen; label: string; icon: React.ElementType }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "map", label: "Europe Map", icon: Map },
  { id: "comparison", label: "Country Comparison", icon: GitCompareArrows },
];

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function Sidebar({
  active,
  onNavigate,
  collapsed,
  onToggleCollapse,
}: {
  active: Screen;
  onNavigate: (s: Screen) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const now = useNow();
  const { theme, toggleTheme } = useTheme();

  const timeStr = now.toLocaleTimeString("en-EN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const dateStr = now.toLocaleDateString("en-EN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // când e strâns: mereu îngust (76px). când nu: îngust pe mobil, lat pe desktop.
  const widthClass = collapsed ? "w-[76px]" : "w-[76px] lg:w-[280px]";
  // ce se arată doar în modul lat (nu strâns): folosim "expanded" ca prescurtare
  const showText = !collapsed;

  return (
    <nav
      className={cn(
        "sticky top-0 flex h-screen flex-shrink-0 flex-col px-3 py-6 transition-all duration-300",
        widthClass,
        !collapsed && "lg:px-5"
      )}
      style={{ background: gradients.sidebar, transition: "background 200ms var(--ease-out-expo)" }}
    >
      {/* buton collapse — sus, colț dreapta */}
      <button
        onClick={onToggleCollapse}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="mb-4 flex h-9 w-9 items-center justify-center self-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:self-end"
      >
        {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
      </button>

      {/* logo */}
      <div className="mb-8 flex items-center justify-center gap-3 lg:justify-start">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white"
          style={{ background: `linear-gradient(135deg, ${colors.forestMid}, ${colors.forest})`, boxShadow: "0 4px 14px rgba(28,107,42,0.45)" }}
        >
          <Leaf className="h-5 w-5" />
        </div>
        {showText && (
          <div className="hidden leading-tight lg:block">
            <div className="text-[16px] font-bold tracking-tight text-white">EU Renewables</div>
            <div className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: colors.sidebarText1 }}>Monitor</div>
          </div>
        )}
      </div>

      {/* live status + clock — doar în modul lat */}
      {showText && (
        <div
          className="mb-8 hidden rounded-2xl border px-4 py-4 lg:block"
          style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span
              className="inline-block h-[7px] w-[7px] rounded-full"
              style={{ background: colors.sidebarLiveDot, boxShadow: "0 0 0 3px rgba(34,197,94,0.2)" }}
            />
            <span className="text-[11px]" style={{ color: colors.sidebarText2 }}>Live data · ENTSO-E</span>
          </div>
          <div className="font-mono text-[26px] font-semibold leading-none tracking-tight tabular-nums" style={{ color: colors.sentryTeal }}>
            {timeStr}
          </div>
          <div className="mt-2 text-[11px] capitalize" style={{ color: colors.sidebarText1 }}>{dateStr}</div>
        </div>
      )}

      {showText && (
        <div className="hidden px-2 pb-3 text-[11px] font-semibold uppercase tracking-[0.1em] lg:block" style={{ color: colors.sidebarText3 }}>
          Navigation
        </div>
      )}

      <div className="flex flex-col gap-1">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id || (item.id === "map" && active === "dashboard");
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-[9px] px-3 py-3 text-[14px] transition-colors",
                collapsed ? "justify-center" : "justify-center lg:justify-start",
                isActive ? "font-medium" : "hover:bg-white/5"
              )}
              style={
                isActive
                  ? { background: colors.sentryTeal, color: colors.sidebarActiveText }
                  : { color: colors.sidebarText4 }
              }
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" />
              {showText && <span className="hidden lg:inline">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* hint — doar în modul lat */}
      {showText && (
        <div
          className="mx-1 mt-4 hidden rounded-xl border px-4 py-3 text-[11px] leading-relaxed lg:block"
          style={{ background: "rgba(3,189,194,0.1)", borderColor: "rgba(3,189,194,0.25)", color: colors.sidebarHintText }}
        >
          💡 Click any country on the map to open its investment dashboard.
        </div>
      )}

      {/* footer — pinned to bottom, theme toggle stays reachable even when collapsed */}
      <div className="mt-auto flex flex-col gap-3 pt-5">
        <button
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          className={cn(
            "flex items-center gap-2.5 rounded-[9px] border px-3 py-2.5 text-[13px] font-medium transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white",
            collapsed ? "justify-center" : "justify-center lg:justify-start"
          )}
          style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: colors.sidebarText4 }}
        >
          {theme === "light" ? <Moon className="h-4 w-4 flex-shrink-0" /> : <Sun className="h-4 w-4 flex-shrink-0" />}
          {showText && (
            <span className="hidden lg:inline">{theme === "light" ? "Dark mode" : "Light mode"}</span>
          )}
        </button>

        {/* attribution — doar în modul lat */}
        {showText && (
          <div className="hidden border-t px-2 pt-4 text-[10px] leading-relaxed lg:block" style={{ borderColor: "rgba(255,255,255,0.1)", color: colors.sidebarText1 }}>
            Data:{" "}
            <a href="https://energy-charts.info" target="_blank" rel="noreferrer" className="underline hover:text-white">
              Energy-Charts.info
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}