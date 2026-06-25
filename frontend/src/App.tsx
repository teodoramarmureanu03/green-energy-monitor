// ============================================================================
// App — componenta rădăcină.
// Ține minte ce ecran e activ și ce țară e selectată, și leagă cele 3 ecrane.
// Click pe o țară (pe hartă sau în ranking) -> sare pe Dashboard cu acea țară.
// ============================================================================
/*import { useState } from "react";
import { Sidebar, type Screen } from "@/components/layout/Sidebar";
import { DashboardScreen } from "@/components/dashboard/DashboardScreen";
import { ComparisonScreen } from "@/components/comparison/ComparisonScreen";
import { MapScreen } from "@/components/map/MapScreen";

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [selectedIso, setSelectedIso] = useState("DE");

  // când dai click pe o țară din hartă sau ranking, sări pe dashboard-ul ei
  function openCountry(iso: string) {
    setSelectedIso(iso);
    setScreen("dashboard");
  }

  return (
    <div className="flex min-h-screen bg-zinc-100 text-zinc-900">
      <Sidebar active={screen} onNavigate={setScreen} />

      <main className="flex-1 overflow-x-auto p-10">
        <div className="max-w-[1240px]">
          {screen === "dashboard" && (
            // `key` forțează re-montarea cu țara nouă când vii din hartă
            <DashboardScreen key={selectedIso} initialIso={selectedIso} />
          )}
          {screen === "comparison" && <ComparisonScreen onOpenCountry={openCountry} />}
          {screen === "map" && <MapScreen onOpenCountry={openCountry} />}
        </div>
      </main>
    </div>
  );
}*/