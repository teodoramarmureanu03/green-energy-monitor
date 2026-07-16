import { SORT_OPTIONS, getSortLabel, type SortKey } from "./comparisonUtils";

interface ComparisonHeaderProps {
  sortBy: SortKey;
  onSortChange: (sortKey: SortKey) => void;
}

export function ComparisonHeader({
  sortBy,
  onSortChange,
}: ComparisonHeaderProps) {
  return (
    <div className="comparison-header">
      <div>
        <h1 className="comparison-title">Country Comparison</h1>

        <p className="comparison-subtitle">
          Ranked by solar & wind capacity · Click a row to open its dashboard
        </p>
      </div>

      <div className="comparison-sort-control">
        {SORT_OPTIONS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onSortChange(key)}
            className={
              sortBy === key
                ? "comparison-sort-button comparison-sort-button-active"
                : "comparison-sort-button"
            }
          >
            {getSortLabel(key)}
          </button>
        ))}
      </div>
    </div>
  );
}
