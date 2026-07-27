import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { useCountries } from "@/hooks/useCountries";
import { useGeneration } from "@/hooks/useGeneration";
import { useGenerationHistory } from "@/hooks/useGenerationHistory";
import { useTimezone } from "@/hooks/useTimezone";
import { paths } from "@/routes/paths";
import { colors, shadows, skeletonGradient } from "@/lib/tokens";

import { DashboardHeader } from "./DashboardHeader";
import { DashboardContent } from "./DashboardContent";
import { DashboardSkeleton } from "./DashboardCards";
import { downloadDashboardPdf } from "./exportDashboardPdf";
import { formatDateTime } from "./dashboardUtils";

import "./DashboardScreen.css";

interface DashboardScreenProps {
  initialIso: string;
}

const dashboardCssVariables = {
  "--dashboard-wind-color": colors.indigoDeep,
  "--dashboard-solar-color": colors.sentryTeal,
  "--dashboard-green-dark": colors.forest,
  "--dashboard-green-light": colors.sageTint,

  "--dashboard-card-bg": colors.surface,
  "--dashboard-border": colors.borderAccent,
  "--dashboard-text-dark": colors.ink,
  "--dashboard-text-mid": colors.slate,
  "--dashboard-text-muted": colors.muted,

  "--dashboard-hero-bg": `linear-gradient(135deg, ${colors.indigoDeep} 0%, ${colors.steelNavy} 100%)`,
  "--dashboard-hero-shadow": shadows.ambientHero,
  "--dashboard-card-shadow": shadows.ambientCard,
  "--dashboard-tooltip-shadow": shadows.tooltipDark,

  "--dashboard-error-bg": colors.errorBg,
  "--dashboard-error-border": colors.errorBorder,
  "--dashboard-error-text": colors.errorRed,

  "--dashboard-skeleton-gradient": skeletonGradient,
  "--dashboard-track-bg": colors.trackBg,
} as CSSProperties;

export function DashboardScreen({ initialIso }: DashboardScreenProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { countries } = useCountries();
  const { timeZone } = useTimezone();
  const [selectedIso, setSelectedIso] = useState(initialIso);
  const [showAuthTip, setShowAuthTip] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const downloadButtonRef = useRef<HTMLButtonElement>(null);

  const { data, loading, error } = useGeneration(selectedIso);
  const {
    historyByPeriod,
    loading: historyLoading,
    error: historyError,
  } = useGenerationHistory(selectedIso);

  const countryName =
    countries.find((country) => country.isoCode === selectedIso)?.name ??
    selectedIso;

  useEffect(() => {
    if (!showAuthTip) {
      return;
    }

    function hideTip() {
      setShowAuthTip(false);
    }

    window.addEventListener("mousedown", hideTip);
    window.addEventListener("keydown", hideTip);
    return () => {
      window.removeEventListener("mousedown", hideTip);
      window.removeEventListener("keydown", hideTip);
    };
  }, [showAuthTip]);

  function handleDownloadPdf() {
    setExportError(null);

    if (!user) {
      setShowAuthTip(true);
      return;
    }

    if (!data || loading) {
      setExportError(
        "Wait for dashboard data to finish loading, then try again."
      );
      return;
    }

    if (historyLoading) {
      setExportError(
        "Wait for history data to finish loading, then try again."
      );
      return;
    }

    setShowAuthTip(false);
    setIsExporting(true);

    try {
      downloadDashboardPdf({
        data,
        countryName,
        selectedIso,
        updatedAt: formatDateTime(data.timestamp, timeZone),
        generatedAt: formatDateTime(new Date().toISOString(), timeZone),
        historyByPeriod,
      });
    } catch (exportFailure) {
      console.error("PDF export failed:", exportFailure);
      setExportError("Could not download the PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="dashboard-screen" style={dashboardCssVariables}>
      <DashboardHeader
        countries={countries}
        selectedIso={selectedIso}
        onCountryChange={(iso) => {
          setSelectedIso(iso);
          navigate(paths.dashboard(iso));
        }}
        onDownloadPdf={handleDownloadPdf}
        isExporting={isExporting}
        showAuthTip={showAuthTip}
        downloadButtonRef={downloadButtonRef}
        downloadDisabled={loading || !data}
      />

      {exportError && (
        <p className="dashboard-download-error" role="alert">
          {exportError}
        </p>
      )}

      {loading && <DashboardSkeleton />}

      {error && <div className="dashboard-error">⚠️ {error}</div>}

      {data && !loading && (
        <DashboardContent
          data={data}
          countryName={countryName}
          selectedIso={selectedIso}
          historyByPeriod={historyByPeriod}
          historyLoading={historyLoading}
          historyError={historyError}
        />
      )}
    </div>
  );
}
