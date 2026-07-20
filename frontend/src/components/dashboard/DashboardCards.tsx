import type { CSSProperties, ReactNode } from "react";

interface HeroKpiCardProps {
  label: string;
  value: string;
  unit: string;
  sub: string;
  icon: string;
}

interface KpiCardProps {
  label: string;
  value: string;
  unit: string;
  sub: string;
  topColor: string;
  icon: string;
  iconBg: string;
}

interface CardProps {
  title: string;
  children: ReactNode;
}

export function HeroKpiCard({
  label,
  value,
  unit,
  sub,
  icon,
}: HeroKpiCardProps) {
  return (
    <div className="dashboard-hero-kpi-card">
      <div className="dashboard-kpi-top-row">
        <span className="dashboard-hero-kpi-label">{label}</span>

        <div className="dashboard-hero-kpi-icon">{icon}</div>
      </div>

      <div>
        <div className="dashboard-hero-kpi-value">
          {value}
          <span className="dashboard-hero-kpi-unit">{unit}</span>
        </div>

        <div className="dashboard-hero-kpi-subtitle">{sub}</div>
      </div>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  unit,
  sub,
  topColor,
  icon,
  iconBg,
}: KpiCardProps) {
  const cardStyle = {
    "--kpi-top-color": topColor,
    "--kpi-icon-bg": iconBg,
  } as CSSProperties;

  return (
    <div className="dashboard-kpi-card" style={cardStyle}>
      <div className="dashboard-kpi-top-row">
        <span className="dashboard-kpi-label">{label}</span>

        <div className="dashboard-kpi-icon">{icon}</div>
      </div>

      <div>
        <div className="dashboard-kpi-value">
          {value}
          <span className="dashboard-kpi-unit">{unit}</span>
        </div>

        <div className="dashboard-kpi-subtitle">{sub}</div>
      </div>
    </div>
  );
}

export function Card({ title, children }: CardProps) {
  return (
    <section className="dashboard-card">
      <h3 className="dashboard-card-title">{title}</h3>

      {children}
    </section>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      <div className="dashboard-skeleton-kpi-grid">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="dashboard-skeleton-block dashboard-skeleton-kpi"
          />
        ))}
      </div>

      <div className="dashboard-skeleton-chart-grid">
        <div className="dashboard-skeleton-block dashboard-skeleton-chart" />
        <div className="dashboard-skeleton-block dashboard-skeleton-chart" />
      </div>
    </div>
  );
}
