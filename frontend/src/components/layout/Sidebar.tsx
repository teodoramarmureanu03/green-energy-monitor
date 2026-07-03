import { useEffect, useState } from "react";
import { GitCompareArrows, Map, Leaf, Home } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <nav className="sticky top-0 flex h-screen w-[72px] flex-shrink-0 flex-col border-r border-zinc-200 bg-linear-to-b from-zinc-50 to-white px-2.5 py-5 lg:w-[260px] lg:px-3.5">
      {/* logo */}
      <div className="mb-5 flex items-center justify-center gap-2.5 border-b border-zinc-200 px-1 pb-4 lg:justify-start">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#12541d] to-[#1c6b2a] text-white shadow-sm">
          <Leaf className="h-5 w-5" />
        </div>
        <div className="hidden leading-tight lg:block">
          <div className="text-[15px] font-bold text-zinc-800">EU Renewables</div>
          <div className="text-[11px] text-zinc-400">Monitor</div>
        </div>
      </div>

      {/* live clock */}
      <div className="mb-5 hidden rounded-lg border border-zinc-200 bg-white px-3 py-2.5 shadow-sm lg:block">
        <div className="font-mono text-2xl font-semibold tabular-nums text-zinc-800">
          {timeStr}
        </div>
        <div className="mt-0.5 text-[11px] capitalize text-zinc-500">{dateStr}</div>
      </div>

      <div className="hidden px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 lg:block">
        Navigation
      </div>

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
              "mb-1 flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-all active:scale-[0.97] lg:justify-start",
              isActive
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            )}
          >
            <Icon className={cn("h-[18px] w-[18px] flex-shrink-0", isActive ? "text-[#03bdc2]" : "text-zinc-400")} />
            <span className="hidden lg:inline">{item.label}</span>
          </button>
        );
      })}

      {/* hint */}
      <div className="mx-2 mt-3 hidden rounded-lg border border-[#dde3de] bg-[#dde9df] px-3 py-2.5 text-[11px] leading-relaxed text-[#12541d] lg:block">
        💡 Click any country on the map to open its investment dashboard.
      </div>

      {/* attribution */}
      <div className="mt-auto hidden border-t border-zinc-200 px-2 pt-4 text-[10px] leading-relaxed text-zinc-400 lg:block">
        Data:{" "}
        <a href="https://energy-charts.info" target="_blank" rel="noreferrer" className="underline hover:text-zinc-600">
          Energy-Charts.info
        </a>
      </div>
    </nav>
  );
}