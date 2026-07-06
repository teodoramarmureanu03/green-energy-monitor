import { useEffect, useState } from "react";
import { GitCompareArrows, Map, Leaf, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { colors, shadows } from "@/lib/tokens";

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
}: {
  active: Screen;
  onNavigate: (s: Screen) => void;
}) {
  const now = useNow();

  const timeStr = now.toLocaleTimeString("en-EN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const dateStr = now.toLocaleDateString("en-EN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <nav
      className="sticky top-0 flex h-screen w-[76px] flex-shrink-0 flex-col px-3 py-6 lg:w-[280px] lg:px-5"
      style={{ background: colors.charcoal, boxShadow: shadows.railEdge }}
    >
      {/* logo */}
      <div className="mb-8 flex items-center justify-center gap-3 lg:justify-start">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white"
          style={{ background: `linear-gradient(135deg, ${colors.forestMid}, ${colors.forest})`, boxShadow: "0 4px 14px rgba(28,107,42,0.45)" }}
        >
          <Leaf className="h-5 w-5" />
        </div>
        <div className="hidden leading-tight lg:block">
          <div className="text-[16px] font-bold tracking-tight text-white">EU Renewables</div>
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/60">Monitor</div>
        </div>
      </div>

      {/* live clock */}
      <div
        className="mb-8 hidden rounded-2xl border border-white/[0.06] px-4 py-4 lg:block"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        <div className="font-mono text-[26px] font-semibold leading-none tracking-tight tabular-nums" style={{ color: colors.sentryTeal }}>
          {timeStr}
        </div>
        <div className="mt-2 text-[11px] capitalize text-white/60">{dateStr}</div>
      </div>

      <div className="hidden px-2 pb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/60 lg:block">
        Navigation
      </div>

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
              className={cn("nav-item-dark justify-center px-3 py-3 lg:justify-start")}
            >
              <Icon className="nav-icon h-[18px] w-[18px] flex-shrink-0" />
              <span className="hidden lg:inline">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* hint */}
      <div
        className="mx-1 mt-4 hidden rounded-xl border px-4 py-3 text-[11px] leading-relaxed lg:block"
        style={{ background: "rgba(3,189,194,0.08)", borderColor: "rgba(3,189,194,0.2)", color: "#7fe6e9" }}
      >
        💡 Click any country on the map to open its investment dashboard.
      </div>

      {/* attribution */}
      <div className="mt-auto hidden border-t border-white/[0.06] px-2 pt-5 text-[10px] leading-relaxed text-white/60 lg:block">
        Data:{" "}
        <a href="https://energy-charts.info" target="_blank" rel="noreferrer" className="underline hover:text-white">
          Energy-Charts.info
        </a>
      </div>
    </nav>
  );
}
