import { Routes, Route, Navigate } from "react-router-dom";

import { ComparisonScreen } from "@/components/comparison/ComparisonScreen";
import { HomeScreen } from "@/components/home/HomeScreen";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthRequiredPanel } from "@/components/layout/AuthRequiredPanel";
import { useAuth } from "@/hooks/useAuth";
import { AccountPage } from "@/pages/AccountPage";
import { AdminUsersPage } from "@/pages/AdminUsersPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { MapPage } from "@/pages/MapPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { VerifyEmailPage } from "@/pages/VerifyEmailPage";
import { paths } from "@/routes/paths";

function ComparisonRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <AuthRequiredPanel />;
  }

  return <ComparisonScreen />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to={paths.home} replace />} />
        <Route path="home" element={<HomeScreen />} />
        <Route path="map" element={<MapPage />} />
        <Route path="comparison" element={<ComparisonRoute />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="admin/users" element={<AdminUsersPage />} />
        <Route path="dashboard/:iso" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to={paths.home} replace />} />
      </Route>
    </Routes>
  );
}
