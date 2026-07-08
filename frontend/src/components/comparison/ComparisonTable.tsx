import type { CSSProperties, KeyboardEvent } from "react";
import type { RankedCountryGeneration } from "./comparisonUtils";
import { formatMw } from "./comparisonUtils";

interface ComparisonTableProps {
  loading: boolean;
  ranked: RankedCountryGeneration[];
  maxMw: number;
  onOpenCountry: (iso: string) => void;
}

interface RankRowProps {
  rank: number;
  item: RankedCountryGeneration;
  maxMw: number;
  onOpen: () => void;
}

interface RankBadgeProps {
  rank: number;
}

interface CountryFlagProps {
  iso: string;
}

export function ComparisonTable({
  loading,
  ranked,
  maxMw,
  onOpenCountry,
}: ComparisonTableProps) {
  return (
    <div className="comparison-table-card">
      {loading ? (
        <div className="comparison-loading">Loading country data…</div>
      ) : (
        <div className="comparison-table-scroll">
          <table className="comparison-table">
            <thead>
              <tr className="comparison-table-head-row">
                <th className="comparison-table-heading comparison-rank-heading">
                  #
                </th>

                <th className="comparison-table-heading comparison-country-heading">
                  Country
                </th>

                <th className="comparison-table-heading comparison-wind-heading">
                  Wind (MW)
                </th>

                <th className="comparison-table-heading comparison-solar-heading">
                  Solar (MW)
                </th>

                <th className="comparison-table-heading comparison-total-heading">
                  Total (MW)
                </th>
              </tr>
            </thead>

            <tbody>
              {ranked.map((item, index) => (
                <RankRow
                  key={item.country.isoCode}
                  rank={index + 1}
                  item={item}
                  maxMw={maxMw}
                  onOpen={() => onOpenCountry(item.country.isoCode)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RankRow({ rank, item, maxMw, onOpen }: RankRowProps) {
  const { country, windMw, solarMw, totalRenewable } = item;
  const barWidth = maxMw > 0 ? (totalRenewable / maxMw) * 100 : 0;

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  }

  return (
    <tr
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      className="comparison-rank-row"
    >
      <td className="comparison-rank-cell">
        <RankBadge rank={rank} />
      </td>

      <td className="comparison-country-cell">
        <div className="comparison-country-info">
          <FlagCircle iso={country.isoCode} />
          <FallbackBadge iso={country.isoCode} />

          <span className="comparison-country-name">{country.name}</span>
        </div>
      </td>

      <td className="comparison-energy-cell">
        <span className="comparison-energy-value comparison-wind-value">
          {formatMw(windMw)}
        </span>

        <span className="comparison-energy-unit">MW</span>
      </td>

      <td className="comparison-energy-cell">
        <span className="comparison-energy-value comparison-solar-value">
          {formatMw(solarMw)}
        </span>

        <span className="comparison-energy-unit">MW</span>
      </td>

      <td className="comparison-total-cell">
        <div className="comparison-total-wrapper">
          <div className="comparison-progress-bar">
            <div
              className="comparison-progress-fill"
              style={{ width: `${barWidth}%` }}
            />
          </div>

          <span className="comparison-total-value">
            {formatMw(totalRenewable)} MW
          </span>
        </div>
      </td>
    </tr>
  );
}

function RankBadge({ rank }: RankBadgeProps) {
  const badgeClassName = getRankBadgeClassName(rank);

  return <span className={badgeClassName}>{rank}</span>;
}

function getRankBadgeClassName(rank: number) {
  const baseClassName = "comparison-rank-badge";

  if (rank === 1) {
    return `${baseClassName} comparison-rank-badge-gold`;
  }

  if (rank === 2) {
    return `${baseClassName} comparison-rank-badge-silver`;
  }

  if (rank === 3) {
    return `${baseClassName} comparison-rank-badge-bronze`;
  }

  return baseClassName;
}

function FlagCircle({ iso }: CountryFlagProps) {
  return (
    <img
      src={`https://flagcdn.com/48x36/${iso.toLowerCase()}.png`}
      alt={`${iso} flag`}
      className="comparison-flag"
      onError={(event) => {
        const flagImage = event.currentTarget;
        flagImage.style.display = "none";

        const fallbackBadge = flagImage.nextElementSibling as HTMLElement | null;

        if (fallbackBadge) {
          fallbackBadge.style.display = "inline-flex";
        }
      }}
    />
  );
}

function FallbackBadge({ iso }: CountryFlagProps) {
  const hue = ((iso.charCodeAt(0) * 37 + iso.charCodeAt(1) * 17) % 280) + 160;

  const fallbackStyle = {
    "--fallback-bg": `hsl(${hue}, 55%, 92%)`,
    "--fallback-color": `hsl(${hue}, 55%, 28%)`,
    "--fallback-border": `hsl(${hue}, 40%, 78%)`,
  } as CSSProperties;

  return (
    <span className="comparison-fallback-badge" style={fallbackStyle}>
      {iso.toUpperCase()}
    </span>
  );
}