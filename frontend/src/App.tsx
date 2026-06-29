import { useState } from "react";
import { DashboardScreen } from "@/components/dashboard/DashboardScreen";
import { ComparisonScreen } from "@/components/comparison/ComparisonScreen";
import { EuropeMap } from "@/components/map/EuropeMap";

type Screen = "dashboard" | "comparison" | "map";

const SIDEBAR_BG = "#0d2b1d";
const SIDEBAR_ACTIVE = "#1a4a30";
const ACCENT_GREEN = "#22c55e";
const MAIN_BG = "#f0faf4";

function Sidebar({ active, onNavigate }: { active: Screen; onNavigate: (s: Screen) => void }) {
  const items = [
    { key: "dashboard" as Screen, label: "Dashboard", icon: "📊" },
    { key: "comparison" as Screen, label: "Comparison", icon: "🏆" },
    { key: "map" as Screen, label: "Europe Map", icon: "🗺️" },
  ];

  return (
    <aside style={{
      width: 220, minHeight: "100vh", background: SIDEBAR_BG,
      display: "flex", flexDirection: "column", padding: "0 12px", flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "28px 12px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>
          ⚡ RenewAdvisor
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
          Europe Investment Platform
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 4, padding: "20px 0", flex: 1 }}>
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 14px", borderRadius: 10, border: "none",
              fontSize: 14, fontWeight: active === item.key ? 600 : 400,
              cursor: "pointer",
              background: active === item.key ? SIDEBAR_ACTIVE : "transparent",
              color: active === item.key ? ACCENT_GREEN : "rgba(255,255,255,0.65)",
              textAlign: "left", transition: "all 0.15s", width: "100%",
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {active === item.key && (
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT_GREEN, flexShrink: 0 }} />
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: "16px 12px 24px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", lineHeight: 1.6 }}>
          Data: Energy-Charts.info<br />CC BY 4.0
        </p>
      </div>
    </aside>
  );
}

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