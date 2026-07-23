export const paths = {
  home: "/home",
  map: "/map",
  comparison: "/comparison",
  account: "/account",
  dashboard: (iso: string) => `/dashboard/${iso.toLowerCase()}`,
} as const;

export type AppScreen = "home" | "map" | "comparison" | "dashboard" | "account";

export function getScreenFromPathname(pathname: string): AppScreen {
  if (pathname.startsWith("/dashboard/")) {
    return "dashboard";
  }

  if (pathname === paths.map) {
    return "map";
  }

  if (pathname === paths.comparison) {
    return "comparison";
  }

  if (pathname === paths.account) {
    return "account";
  }

  if (pathname === paths.home) {
    return "home";
  }

  return "home";
}

export function getIsoFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/dashboard\/([a-z]{2})$/i);

  return match ? match[1].toUpperCase() : null;
}
