import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Leaf, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { AuthRequiredTip } from "@/components/layout/AuthRequiredTip";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { formatInTimeZone } from "@/lib/timezones";
import { useTimezone } from "@/hooks/useTimezone";

import { SIDEBAR_ITEMS, ADMIN_SIDEBAR_ITEM } from "./layoutData";
import { isSidebarItemActive } from "./layoutUtils";

function useNow() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const now = useNow();
  const { timeZone } = useTimezone();
  const { user } = useAuth();
  const [showComparisonTip, setShowComparisonTip] = useState(false);
  const comparisonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showComparisonTip) {
      return;
    }

    const timeoutId = window.setTimeout(
      () => setShowComparisonTip(false),
      5000
    );
    return () => window.clearTimeout(timeoutId);
  }, [showComparisonTip]);

  const timeStr = formatInTimeZone(now, timeZone, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dateStr = formatInTimeZone(now, timeZone, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const showText = !collapsed;

  return (
    <nav
      className={cn(
        "layout-sidebar",
        collapsed ? "layout-sidebar-collapsed" : "layout-sidebar-expanded"
      )}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="layout-sidebar-toggle"
      >
        {collapsed ? (
          <PanelLeftOpen className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
      </button>

      <div className="layout-sidebar-brand">
        <div className="layout-sidebar-logo">
          <Leaf className="h-5 w-5" />
        </div>

        {showText && (
          <div className="layout-sidebar-brand-text">
            <div className="layout-sidebar-brand-title">EU Renewables</div>
            <div className="layout-sidebar-brand-subtitle">Monitor</div>
          </div>
        )}
      </div>

      {showText && (
        <div className="layout-sidebar-live">
          <div className="layout-sidebar-live-header">
            <span className="layout-sidebar-live-dot" />
            <span className="layout-sidebar-live-caption">
              Live data · ENTSO-E
            </span>
          </div>

          <div className="layout-sidebar-time">{timeStr}</div>
          <div className="layout-sidebar-date">{dateStr}</div>
          <div className="layout-sidebar-timezone">{timeZone}</div>
        </div>
      )}

      {showText && <div className="layout-sidebar-nav-label">Navigation</div>}

      <div className="layout-sidebar-nav">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = isSidebarItemActive(item.id, location.pathname);
          const className = cn(
            "layout-sidebar-link",
            collapsed && "layout-sidebar-link-collapsed",
            isActive && "layout-sidebar-link-active"
          );

          if (item.id === "comparison" && !user) {
            return (
              <div key={item.id} className="layout-sidebar-link-wrap">
                <button
                  ref={comparisonRef}
                  type="button"
                  title={item.label}
                  className={className}
                  onClick={() => setShowComparisonTip(true)}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  {showText && (
                    <span className="layout-sidebar-link-label">
                      {item.label}
                    </span>
                  )}
                </button>
                <AuthRequiredTip
                  visible={showComparisonTip}
                  anchorRef={comparisonRef}
                  placement={collapsed ? "right" : "below"}
                />
              </div>
            );
          }

          return (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.id === "home"}
              title={item.label}
              aria-current={isActive ? "page" : undefined}
              className={className}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {showText && (
                <span className="layout-sidebar-link-label">{item.label}</span>
              )}
            </NavLink>
          );
        })}

        {user?.isAdmin && (
          <NavLink
            to={ADMIN_SIDEBAR_ITEM.to}
            title={ADMIN_SIDEBAR_ITEM.label}
            aria-current={
              isSidebarItemActive(ADMIN_SIDEBAR_ITEM.id, location.pathname)
                ? "page"
                : undefined
            }
            className={cn(
              "layout-sidebar-link",
              collapsed && "layout-sidebar-link-collapsed",
              isSidebarItemActive(ADMIN_SIDEBAR_ITEM.id, location.pathname) &&
                "layout-sidebar-link-active"
            )}
          >
            <ADMIN_SIDEBAR_ITEM.icon className="h-4.5 w-4.5 shrink-0" />
            {showText && (
              <span className="layout-sidebar-link-label">
                {ADMIN_SIDEBAR_ITEM.label}
              </span>
            )}
          </NavLink>
        )}
      </div>

      {showText && (
        <div className="layout-sidebar-hint">
          💡 Click any country on the map to open its investment dashboard.
        </div>
      )}
    </nav>
  );
}
