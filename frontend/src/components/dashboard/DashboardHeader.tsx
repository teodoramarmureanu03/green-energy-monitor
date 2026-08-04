import { Download } from "lucide-react";

import type { Country } from "@/types/contract";

interface DashboardHeaderProps {
  countries: Country[];
  selectedIso: string;
  onCountryChange: (iso: string) => void;
  onDownloadPdf: () => void;
  isExporting: boolean;
  downloadDisabled?: boolean;
}

export function DashboardHeader({
  countries,
  selectedIso,
  onCountryChange,
  onDownloadPdf,
  isExporting,
  downloadDisabled = false,
}: DashboardHeaderProps) {
  return (
    <div className="dashboard-header">
      <div>
        <h1 className="dashboard-title">Country Dashboard</h1>

        <p className="dashboard-subtitle">
          Solar & wind investment snapshot for Europe
        </p>
      </div>

      <div className="dashboard-header-actions">
        <select
          value={selectedIso}
          onChange={(event) => onCountryChange(event.target.value)}
          className="select-field dashboard-country-select"
          aria-label="Select country"
        >
          {countries.map((country) => (
            <option key={country.isoCode} value={country.isoCode}>
              {country.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="dashboard-download-btn"
          onClick={onDownloadPdf}
          disabled={isExporting || downloadDisabled}
          aria-label="Download dashboard as PDF"
          title="Download this country’s dashboard as PDF"
        >
          <Download size={16} aria-hidden="true" />
          <span>{isExporting ? "Preparing PDF…" : "Download PDF"}</span>
        </button>
      </div>
    </div>
  );
}
