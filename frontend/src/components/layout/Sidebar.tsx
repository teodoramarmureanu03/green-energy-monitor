// ============================================================================
// Sidebar — bara laterală, versiune îmbunătățită.
//  - iconițe reale (lucide-react) în loc de buline
//  - ceas live cu data și ora, actualizat din secundă în secundă
//  - design mai rafinat (gradient subtil pe logo, stări hover/active mai clare)
//  - atribuirea Energy-Charts păstrată jos
// ============================================================================
import { useEffect, useState } from "react";
import { LayoutDashboard, GitCompareArrows, Map, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

export type Screen = "dashboard" | "comparison" | "map";

// fiecare ecran cu eticheta și iconița lui
const ITEMS: { id: Screen; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Country Dashboard", icon: LayoutDashboard },
  { id: "comparison", label: "Country Comparison", icon: GitCompareArrows },
  { id: "map", label: "Europe Map", icon: Map },
];

// ---- mic hook pentru ceasul live ----
function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000); // tic-tac la 1s
    return () => clearInterval(id); // curățăm când dispare componenta
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

  // format frumos pentru dată și oră
  const timeStr = now.toLocaleTimeString("en-EN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateStr = now.toLocaleDateString("en-EN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <nav className="sticky top-0 flex h-screen w-[260px] flex-shrink-0 flex-col border-r border-zinc-200 bg-linear-to-b from-zinc-50 to-white px-3.5 py-5">
      {/* logo + nume */}
      <div className="mb-5 flex items-center gap-2.5 border-b border-zinc-200 px-1 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-green-500 to-emerald-600 text-white shadow-sm">
          <Leaf className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-bold text-zinc-800">EU Renewables</div>
          <div className="text-[11px] text-zinc-400">Monitor</div>
        </div>
      </div>

      {/* ceas live */}
      <div className="mb-5 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 shadow-sm">
        <div className="font-mono text-2xl font-semibold tabular-nums text-zinc-800">
          {timeStr}
        </div>
        <div className="mt-0.5 text-[11px] capitalize text-zinc-500">{dateStr}</div>
      </div>

      <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        Screens
      </div>

      {/* butoane de navigare cu iconițe */}
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-all",
              isActive
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            )}
          >
            <Icon
              className={cn(
                "h-[18px] w-[18px] flex-shrink-0",
                isActive ? "text-green-400" : "text-zinc-400"
              )}
            />
            {item.label}
          </button>
        );
      })}

      {/* atribuire obligatorie Energy-Charts (CC BY 4.0) */}
      <div className="mt-auto border-t border-zinc-200 px-2 pt-4 text-[10px] leading-relaxed text-zinc-400">
        Data:{" "}
        <a
          href="https://energy-charts.info"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-zinc-600"
        >
          Renewables.info
        </a>{" "}
      </div>
    </nav>
  );
}