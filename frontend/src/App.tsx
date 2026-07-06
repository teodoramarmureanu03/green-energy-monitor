import { useState } from "react";
import { DashboardScreen } from "@/components/dashboard/DashboardScreen";
import { ComparisonScreen } from "@/components/comparison/ComparisonScreen";
import { EuropeMap } from "@/components/map/EuropeMap";
import { Sidebar, type Screen } from "@/components/layout/Sidebar";
import { EuropeSummary } from "@/components/EuropeSummary";
import { HomeScreen } from "@/components/home/HomeScreen";
import { colors, fontFamily } from "@/lib/tokens";

// Soft green — visible, renewable-themed, cards stand out clearly on top
const PAGE_BG = "#c8ddc8";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  function openCountry(iso: string) {
    setSelectedIso(iso);
    setScreen("dashboard");
  }

  function goToMap() {
    setScreen("map");
  }

  return (
<<<<<<< HEAD
    <div style={{ display: "flex", minHeight: "100vh", background: PAGE_BG, fontFamily }}>
      <Sidebar active={screen} onNavigate={setScreen} />
=======
    <div style={{
      display: "flex", minHeight: "100vh",
      background: colors.mist, fontFamily,
    }}>
      <Sidebar
        active={screen}
        onNavigate={setScreen}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
>>>>>>> bb9c839ee2f8e69a7427287d51c5c14272a9d14b

      <main className="min-w-0 flex-1 overflow-x-auto px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>

          {screen === "home" && <HomeScreen />}
          {screen !== "home" && <EuropeSummary />}

          {screen === "dashboard" && selectedIso && (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <button onClick={goToMap} className="pill-btn" style={{ width: "fit-content" }}>
                ← Back to map
              </button>
              <DashboardScreen key={selectedIso} initialIso={selectedIso} />
            </div>
          )}

          {screen === "comparison" && (
            <ComparisonScreen onOpenCountry={openCountry} />
          )}

          {screen === "map" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <div>
                <h1 style={{ fontSize: 34, fontWeight: 700, color: colors.ink, letterSpacing: "-0.5px" }}>
                  Europe Map
                </h1>
                <p style={{ fontSize: 15, color: colors.muted, marginTop: 6 }}>
                  Click a country to open its solar & wind investment dashboard
                </p>
              </div>
              <div style={{
                background: "#ffffff",
                borderRadius: 24, padding: 36,
                border: "1.5px solid #b8cdb8",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
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
