import { Navigate, useNavigate, useParams } from "react-router-dom";

import { DashboardScreen } from "@/components/dashboard/DashboardScreen";
import { paths } from "@/routes/paths";

export function DashboardPage() {
  const navigate = useNavigate();
  const { iso } = useParams<{ iso: string }>();
  const normalizedIso = iso?.toUpperCase();

  if (
    !normalizedIso ||
    !/^[A-Z]{2}$/.test(normalizedIso)
  ) {
    return <Navigate to={paths.map} replace />;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <button
        type="button"
        onClick={() => navigate(paths.map)}
        className="pill-btn"
        style={{ width: "fit-content" }}
      >
        ← Back to map
      </button>

      <DashboardScreen
        key={normalizedIso}
        initialIso={normalizedIso}
      />
    </div>
  );
}
