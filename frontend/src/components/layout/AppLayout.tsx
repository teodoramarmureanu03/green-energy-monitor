import { useState } from "react";
import type { CSSProperties } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { colors, fontFamily, gradients } from "@/lib/tokens";
import { getScreenFromPathname } from "@/routes/paths";

import { EuropeSummary } from "./EuropeSummary";
import { Sidebar } from "./Sidebar";
import { Toolbar } from "./Toolbar";
import { getToolbarInfo } from "./layoutUtils";

import "./AppLayout.css";

const layoutCssVariables = {
  "--layout-page-bg": colors.mist,
  "--layout-font-family": fontFamily,
  "--layout-sidebar-bg": gradients.sidebar,
  "--layout-forest": colors.forest,
  "--layout-forest-mid": colors.forestMid,
  "--layout-sentry-teal": colors.sentryTeal,
  "--layout-sidebar-text-1": colors.sidebarText1,
  "--layout-sidebar-text-2": colors.sidebarText2,
  "--layout-sidebar-text-3": colors.sidebarText3,
  "--layout-sidebar-text-4": colors.sidebarText4,
  "--layout-sidebar-live-dot": colors.sidebarLiveDot,
  "--layout-sidebar-active-text": colors.sidebarActiveText,
  "--layout-sidebar-hint-text": colors.sidebarHintText,
  "--layout-toolbar-border": colors.borderAccent,
  "--layout-toolbar-title": colors.ink,
  "--layout-toolbar-subtitle": colors.muted,
  "--layout-toolbar-btn-bg": colors.surface,
  "--layout-toolbar-btn-border": colors.borderAccent,
  "--layout-toolbar-btn-color": colors.slate,
  "--layout-summary-bg": gradients.heroDark,
} as CSSProperties;

export function AppLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const screen = getScreenFromPathname(location.pathname);
  const { title, subtitle } = getToolbarInfo(location.pathname);

  return (
    <div className="app-layout" style={layoutCssVariables}>
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
      />

      <main className="app-layout-main">
        <div className="app-layout-content">
          <Toolbar title={title} subtitle={subtitle} />

          {screen !== "home" && screen !== "admin" && screen !== "account" && (
            <EuropeSummary />
          )}

          <Outlet />
        </div>
      </main>
    </div>
  );
}
