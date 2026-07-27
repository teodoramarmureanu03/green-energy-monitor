import { Download } from "lucide-react";
import type { RefObject } from "react";

import { AuthRequiredTip } from "@/components/layout/AuthRequiredTip";
import type { Country } from "@/types/contract";

interface DashboardHeaderProps {
  countries: Country[];
  selectedIso: string;
  onCountryChange: (iso: string) => void;
  onDownloadPdf: () => void;
  isExporting: boolean;
  showAuthTip: boolean;
  downloadButtonRef: RefObject<HTMLButtonElement | null>;
  downloadDisabled?: boolean;
}

export function DashboardHeader({
  countries,
  selectedIso,
  onCountryChange,
  onDownloadPdf,
  isExporting,
  showAuthTip,
  downloadButtonRef,
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

        <div className="dashboard-download-wrap">
          <button
            ref={downloadButtonRef}
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
          <AuthRequiredTip
            visible={showAuthTip}
            anchorRef={downloadButtonRef}
            placement="below"
          />
        </div>
      </div>
    </div>
  );
}
