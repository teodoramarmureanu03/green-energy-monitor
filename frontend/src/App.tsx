import { useState } from "react";
import { DashboardScreen } from "@/components/dashboard/DashboardScreen";
import { ComparisonScreen } from "@/components/comparison/ComparisonScreen";
import { EuropeMap } from "@/components/map/EuropeMap";
import { Sidebar, type Screen } from "@/components/layout/Sidebar";
import { EuropeSummary } from "@/components/EuropeSummary";
import { HomeScreen } from "@/components/home/HomeScreen";
import { colors, fontFamily, shadows } from "@/lib/tokens";

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

      <main className="min-w-0 flex-1 overflow-x-auto px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* Home page — no EuropeSummary banner */}
          {screen === "home" && <HomeScreen />}

          {/* All other screens show the Europe summary banner */}
          {screen !== "home" && <EuropeSummary />}

          {/* Dashboard — only reachable by clicking a country */}
          {screen === "dashboard" && selectedIso && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <button
                onClick={goToMap}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  fontSize: 13, fontWeight: 500, color: colors.forest,
                  background: colors.sageTint, border: `1px solid ${colors.borderSage}`,
                  borderRadius: 8, padding: "7px 14px", cursor: "pointer",
                  width: "fit-content",
                }}
              >
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
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.ink, letterSpacing: "-0.5px" }}>
                  Europe Map
                </h1>
                <p style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
                  Click a country to open its solar & wind investment dashboard
                </p>
              </div>
              <div style={{
                background: colors.surface, borderRadius: 16, padding: 24,
                border: `1px solid ${colors.borderSage}`, boxShadow: shadows.ambientCard,
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