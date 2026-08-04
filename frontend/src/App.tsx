import { Routes, Route, Navigate } from "react-router-dom";

import { ComparisonScreen } from "@/components/comparison/ComparisonScreen";
import { HomeScreen } from "@/components/home/HomeScreen";
import { AppLayout } from "@/components/layout/AppLayout";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { MapPage } from "@/pages/MapPage";
import { paths } from "@/routes/paths";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to={paths.home} replace />} />
          <Route path="home" element={<HomeScreen />} />
          <Route path="map" element={<MapPage />} />
          <Route path="comparison" element={<ComparisonScreen />} />
          <Route path="dashboard/:iso" element={<DashboardPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}