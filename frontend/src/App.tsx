import { Routes, Route, Navigate } from "react-router-dom";

import { ComparisonScreen } from "@/components/comparison/ComparisonScreen";
import { HomeScreen } from "@/components/home/HomeScreen";
import { AppLayout } from "@/components/layout/AppLayout";
import { AccountPage } from "@/pages/AccountPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { MapPage } from "@/pages/MapPage";
import { paths } from "@/routes/paths";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to={paths.home} replace />} />
        <Route path="home" element={<HomeScreen />} />
        <Route path="map" element={<MapPage />} />
        <Route path="comparison" element={<ComparisonScreen />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="dashboard/:iso" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to={paths.home} replace />} />
      </Route>
    </Routes>
  );
}
