import {
  getIsoFromPathname,
  getScreenFromPathname,
  paths,
} from "@/routes/paths";

import type { SidebarItemId } from "./layoutData";

export function getToolbarInfo(pathname: string): {
  title: string;
  subtitle?: string;
} {
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
        subtitle: iso ? `${iso} · solar & wind investment` : undefined,
      };
    case "account":
      return {
        title: "Account",
        subtitle: "Sign in, register, or manage your profile",
      };
    case "admin":
      return {
        title: "Manage Users",
        subtitle: "Admin-only user management",
      };
    default:
      return { title: "EU Renewables Monitor" };
  }
}

export function isSidebarItemActive(
  itemId: SidebarItemId,
  pathname: string
): boolean {
  if (itemId === "home") {
    return pathname === paths.home;
  }

  if (itemId === "map") {
    return pathname === paths.map || pathname.startsWith("/dashboard/");
  }

  if (itemId === "admin") {
    return pathname.startsWith("/admin");
  }

  return pathname === paths.comparison;
}

export function formatMw(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

export function renewableSharePercent(
  renewableMw: number,
  totalMw: number
): number {
  if (totalMw <= 0) {
    return 0;
  }

  return Math.round((renewableMw / totalMw) * 100);
}
