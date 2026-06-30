import { useState } from "react";
import { DashboardScreen } from "@/components/dashboard/DashboardScreen";
import { ComparisonScreen } from "@/components/comparison/ComparisonScreen";
import { EuropeMap } from "@/components/map/EuropeMap";
import { Sidebar, type Screen } from "@/components/layout/Sidebar";
import { EuropeSummary } from "@/components/EuropeSummary";

//type Screen = "dashboard" | "comparison" | "map";

//const SIDEBAR_BG = "#0d2b1d";
//const SIDEBAR_ACTIVE = "#1a4a30";
//const ACCENT_GREEN = "#22c55e";
const MAIN_BG = "#f0faf4";


export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [selectedIso, setSelectedIso] = useState("DE");

  // When a country is clicked (from map or comparison) → jump to dashboard
  function openCountry(iso: string) {
    setSelectedIso(iso);
    setScreen("dashboard");
  }

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: MAIN_BG, fontFamily: "Inter, system-ui, sans-serif",
    }}>
      <Sidebar active={screen} onNavigate={setScreen} />

      <main style={{ flex: 1, overflowX: "auto", padding: "36px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <EuropeSummary /> 
          {screen === "dashboard" && (
            // key forces remount when country changes (from map or comparison click)
            <DashboardScreen key={selectedIso} initialIso={selectedIso} />
          )}

          {screen === "comparison" && (
            <ComparisonScreen onOpenCountry={openCountry} />
          )}

          {screen === "map" && ( 
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px" }}>
                  Europe Map
                </h1>
                <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
                  Click a country to open its investment dashboard
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