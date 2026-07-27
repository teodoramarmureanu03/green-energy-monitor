import { GitCompareArrows, Map, Home, Users } from "lucide-react";

import { paths } from "@/routes/paths";

export const SIDEBAR_ITEMS = [
  { id: "home", label: "Home", icon: Home, to: paths.home },
  { id: "map", label: "Europe Map", icon: Map, to: paths.map },
  {
    id: "comparison",
    label: "Country Comparison",
    icon: GitCompareArrows,
    to: paths.comparison,
  },
] as const;

export const ADMIN_SIDEBAR_ITEM = {
  id: "admin",
  label: "Manage Users",
  icon: Users,
  to: paths.adminUsers,
} as const;

export type SidebarItemId =
  (typeof SIDEBAR_ITEMS)[number]["id"] | typeof ADMIN_SIDEBAR_ITEM.id;
