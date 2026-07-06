import { useState } from "react";
import { DashboardScreen } from "@/components/dashboard/DashboardScreen";
import { ComparisonScreen } from "@/components/comparison/ComparisonScreen";
import { EuropeMap } from "@/components/map/EuropeMap";
import { Sidebar, type Screen } from "@/components/layout/Sidebar";
import { EuropeSummary } from "@/components/EuropeSummary";
import { HomeScreen } from "@/components/home/HomeScreen";
import { colors, fontFamily } from "@/lib/tokens";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedIso, setSelectedIso] = useState<string | null>(null);

  function openCountry(iso: string) {
    setSelectedIso(iso);
    setScreen("dashboard");
  }

  function goToMap() {
    setScreen("map");
  }

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: colors.mist, fontFamily,
    }}>
      <Sidebar active={screen} onNavigate={setScreen} />

      <main className="min-w-0 flex-1 overflow-x-auto px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>

          {/* Home page — no EuropeSummary banner */}
          {screen === "home" && <HomeScreen />}

          {/* All other screens show the Europe summary banner */}
          {screen !== "home" && <EuropeSummary />}

          {/* Dashboard — only reachable by clicking a country */}
          {screen === "dashboard" && selectedIso && (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <button onClick={goToMap} className="pill-btn" style={{ width: "fit-content" }}>
                ← Back to map
              </button>
              <DashboardScreen key={selectedIso} initialIso={selectedIso} />
            </div>
          )}

          {/* Comparison */}
          {screen === "comparison" && (
            <ComparisonScreen onOpenCountry={openCountry} />
          )}

          {/* Map */}
          {screen === "map" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <div>
                <h1 style={{ fontSize: 34, fontWeight: 700, color: colors.ink, letterSpacing: "-0.5px" }}>
                  Europe Map
                </h1>
                <p style={{ fontSize: 15, color: colors.muted, marginTop: 6 }}>
                  Click a country — or use the map's country list — to open its solar & wind investment dashboard
                </p>
              </div>
              <div className="card-elevated" style={{
                background: colors.surface, borderRadius: 24, padding: 36,
                border: `1px solid ${colors.borderSage}`,
                width: "100%", minHeight: 560,
              }}>
                <EuropeMap onSelectCountry={openCountry} />
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}