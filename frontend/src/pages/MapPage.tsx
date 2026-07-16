import { useNavigate } from "react-router-dom";

import { EuropeMap } from "@/components/map/EuropeMap";
import { paths } from "@/routes/paths";
import { colors } from "@/lib/tokens";

export function MapPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <div>
        <h1
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: colors.ink,
            letterSpacing: "-0.5px",
          }}
        >
          Europe Map
        </h1>

        <p
          style={{
            fontSize: 15,
            color: colors.muted,
            marginTop: 6,
          }}
        >
          Click a country to open its solar & wind investment dashboard
        </p>
      </div>

      <div
        style={{
          background: colors.surface,
          borderRadius: 24,
          padding: 36,
          border: `1.5px solid ${colors.borderAccent}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          width: "100%",
          minHeight: 560,
        }}
      >
        <EuropeMap onSelectCountry={(iso) => navigate(paths.dashboard(iso))} />
      </div>
    </div>
  );
}
