import type { Country } from "@/types/contract";

interface DashboardHeaderProps {
  countries: Country[];
  selectedIso: string;
  onCountryChange: (iso: string) => void;
}

export function DashboardHeader({
  countries,
  selectedIso,
  onCountryChange,
}: DashboardHeaderProps) {
  return (
    <div className="dashboard-header">
      <div>
        <h1 className="dashboard-title">Country Dashboard</h1>

        <p className="dashboard-subtitle">
          Solar & wind investment snapshot for Europe
        </p>
      </div>

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
    </div>
  );
}
