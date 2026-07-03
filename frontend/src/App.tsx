import { useState } from "react";
import { DashboardScreen } from "@/components/dashboard/DashboardScreen";
import { ComparisonScreen } from "@/components/comparison/ComparisonScreen";
import { EuropeMap } from "@/components/map/EuropeMap";
import { Sidebar, type Screen } from "@/components/layout/Sidebar";
import { EuropeSummary } from "@/components/EuropeSummary";
import { HomeScreen } from "@/components/home/HomeScreen";

const MAIN_BG = "#f0faf4";

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
      background: MAIN_BG, fontFamily: "Inter, system-ui, sans-serif",
    }}>
      <Sidebar active={screen} onNavigate={setScreen} />

      <main style={{ flex: 1, overflowX: "auto", padding: "36px 40px" }}>
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
                  fontSize: 13, fontWeight: 500, color: "#15803d",
                  background: "#dcfce7", border: "1px solid #bbf7d0",
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
                <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px" }}>
                  Europe Map
                </h1>
                <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
                  Click a country to open its solar & wind investment dashboard
                </p>
              </div>
              <div style={{
                background: "#ffffff", borderRadius: 16, padding: 24,
                border: "1px solid #d1fae5", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
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