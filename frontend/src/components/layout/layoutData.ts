import { GitCompareArrows, Map, Home } from "lucide-react";

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

export type SidebarItemId =
  (typeof SIDEBAR_ITEMS)[number]["id"];
