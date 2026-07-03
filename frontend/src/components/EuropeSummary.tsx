// ============================================================================
// EuropeSummary — card mare care adună producția TUTUROR țărilor.
// Arată: total Europa (MW) + procent regenerabil + câte țări.
// ============================================================================
import { useEffect, useState } from "react";
import { fetchCountries, fetchGeneration } from "@/lib/api";
import { colors, gradients, shadows } from "@/lib/tokens";

export function EuropeSummary() {
  const [loading, setLoading] = useState(true);
  const [totalMw, setTotalMw] = useState(0);
  const [renewableMw, setRenewableMw] = useState(0);
  const [countryCount, setCountryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const countries = await fetchCountries();
      const results = await Promise.all(
        countries.map((c) => fetchGeneration(c.isoCode).catch(() => null))
      );
      if (cancelled) return;
      let total = 0;
      let renew = 0;
      let count = 0;
      for (const r of results) {
        if (!r) continue;
        total += r.total;
        renew += r.renewableMw;
        count++;
      }
      setTotalMw(total);
      setRenewableMw(renew);
      setCountryCount(count);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pct = totalMw > 0 ? Math.round((renewableMw / totalMw) * 100) : 0;
  const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

  return (
    <div
      style={{
        background: gradients.heroDark,
        color: "#fff",
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        boxShadow: shadows.ambientHero,
      }}
    >
      <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 12 }}>
        🌍 Europe — live overview
      </div>

      {loading ? (
        <div style={{ fontSize: 18, opacity: 0.7 }}>Loading European data…</div>
      ) : (
        <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>
              {fmt(totalMw)} <span style={{ fontSize: 16, opacity: 0.7 }}>MW</span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
              Total generation
            </div>
          </div>

          <div>
            <div style={{ fontSize: 32, fontWeight: 700, color: colors.sentryTeal }}>
              {pct}%
            </div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
              Renewable share
            </div>
          </div>

          <div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>
              {fmt(renewableMw)} <span style={{ fontSize: 16, opacity: 0.7 }}>MW</span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
              Renewable output
            </div>
          </div>

          <div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{countryCount}</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
              Countries tracked
            </div>
          </div>
        </div>
      )}
    </div>
  );
}