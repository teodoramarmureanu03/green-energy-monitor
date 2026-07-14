import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { EuropeSummary } from "@/components/EuropeSummary";
import { Toolbar } from "@/components/layout/Toolbar";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  getIsoFromPathname,
  getScreenFromPathname,
} from "@/routes/paths";
import { colors, fontFamily } from "@/lib/tokens";

const PAGE_BG = colors.mist;

function toolbarInfo(
  pathname: string
): { title: string; subtitle?: string } {
  const screen = getScreenFromPathname(pathname);
  const iso = getIsoFromPathname(pathname);

  switch (screen) {
    case "home":
      return {
        title: "Home",
        subtitle: "EU renewable energy overview",
      };
    case "map":
      return {
        title: "Europe Map",
        subtitle: "Solar & wind across the EU",
      };
    case "comparison":
      return {
        title: "Country Comparison",
        subtitle: "Ranked by renewable capacity",
      };
    case "dashboard":
      return {
        title: "Dashboard",
        subtitle: iso
          ? `${iso} · solar & wind investment`
          : undefined,
      };
    default:
      return { title: "EU Renewables Monitor" };
  }
}

export function AppLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const screen = getScreenFromPathname(
    location.pathname
  );
  const { title, subtitle } = toolbarInfo(
    location.pathname
  );

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: PAGE_BG,
        fontFamily,
      }}
    >
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() =>
          setCollapsed((value) => !value)
        }
      />

      <main className="min-w-0 flex-1 overflow-x-auto px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <Toolbar
            title={title}
            subtitle={subtitle}
            onRefresh={() => window.location.reload()}
          />

          {screen !== "home" && <EuropeSummary />}

          <Outlet />
        </div>
      </main>
    </div>
  );
}
