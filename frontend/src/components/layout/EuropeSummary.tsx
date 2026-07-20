import { useEffect, useState } from "react";

import { fetchCountries, fetchGeneration } from "@/lib/api";

import { formatMw, renewableSharePercent } from "./layoutUtils";

interface EuropeStat {
  value: string;
  unit?: string;
  label: string;
  accent?: boolean;
}

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
        countries.map((country) =>
          fetchGeneration(country.isoCode).catch(() => null)
        )
      );

      if (cancelled) {
        return;
      }

      let total = 0;
      let renew = 0;
      let count = 0;

      for (const result of results) {
        if (!result) {
          continue;
        }

        total += result.total;
        renew += result.renewableMw;
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

  const pct = renewableSharePercent(renewableMw, totalMw);

  const stats: EuropeStat[] = [
    { value: formatMw(totalMw), unit: "MW", label: "Total generation" },
    { value: `${pct}%`, label: "Renewable share", accent: true },
    { value: formatMw(renewableMw), unit: "MW", label: "Renewable output" },
    { value: String(countryCount), label: "Countries tracked" },
  ];

  return (
    <div className="europe-summary">
      <div className="europe-summary-badge">
        <span aria-hidden="true" className="europe-summary-dot" />
        <span className="europe-summary-label">EUROPE — LIVE OVERVIEW</span>
      </div>

      {loading ? (
        <div className="europe-summary-loading">Loading European data…</div>
      ) : (
        <div className="stat-strip europe-summary-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-strip-item">
              <div
                className={
                  stat.accent
                    ? "europe-summary-value europe-summary-value-accent"
                    : "europe-summary-value"
                }
              >
                {stat.value}
                {stat.unit && (
                  <span className="europe-summary-unit">{stat.unit}</span>
                )}
              </div>
              <div className="europe-summary-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
