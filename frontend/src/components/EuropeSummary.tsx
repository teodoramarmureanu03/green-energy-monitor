// ============================================================================
// EuropeSummary — card mare care adună producția TUTUROR țărilor.
// Arată: total Europa (MW) + procent regenerabil + câte țări.
// ============================================================================
import { useEffect, useState } from "react";
import { fetchCountries, fetchGeneration } from "@/lib/api";
import { colors, gradients } from "@/lib/tokens";

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

  const stats: { value: string; unit?: string; label: string; accent?: string }[] = [
    { value: fmt(totalMw), unit: "MW", label: "Total generation" },
    { value: `${pct}%`, label: "Renewable share", accent: colors.sentryTeal },
    { value: fmt(renewableMw), unit: "MW", label: "Renewable output" },
    { value: String(countryCount), label: "Countries tracked" },
  ];

  return (
    <div
      className="card-elevated"
      style={{
        background: gradients.heroDark,
        color: "#fff",
        borderRadius: 24,
        padding: "28px 36px",
        marginBottom: 28,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <span
          aria-hidden="true"
          style={{ width: 7, height: 7, borderRadius: "50%", background: colors.sentryTeal, boxShadow: `0 0 0 4px rgba(3,189,194,0.18)` }}
        />
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", color: "rgba(255,255,255,0.6)" }}>
          EUROPE — LIVE OVERVIEW
        </span>
      </div>

      {loading ? (
        <div style={{ fontSize: 18, opacity: 0.7 }}>Loading European data…</div>
      ) : (
        <div className="stat-strip">
          {stats.map((s) => (
            <div key={s.label} className="stat-strip-item">
              <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1, color: s.accent ?? "#fff" }}>
                {s.value}
                {s.unit && <span style={{ fontSize: 17, fontWeight: 500, opacity: 0.6, marginLeft: 6 }}>{s.unit}</span>}
              </div>
              <div style={{ fontSize: 13, opacity: 0.55, marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}