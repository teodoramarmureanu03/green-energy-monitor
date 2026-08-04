import { Routes, Route, Navigate } from "react-router-dom";

import { ComparisonScreen } from "@/components/comparison/ComparisonScreen";
import { HomeScreen } from "@/components/home/HomeScreen";
import { AppLayout } from "@/components/layout/AppLayout";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { AccountPage } from "@/pages/AccountPage";
import { AdminUsersPage } from "@/pages/AdminUsersPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { LoginPage } from "@/pages/LoginPage";
import { MapPage } from "@/pages/MapPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { VerifyEmailPage } from "@/pages/VerifyEmailPage";
import { paths } from "@/routes/paths";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path={paths.forgotPassword} element={<ForgotPasswordPage />} />
      <Route path={paths.resetPassword} element={<ResetPasswordPage />} />
      <Route path={paths.verifyEmail} element={<VerifyEmailPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to={paths.home} replace />} />
          <Route path="home" element={<HomeScreen />} />
          <Route path="map" element={<MapPage />} />
          <Route path="comparison" element={<ComparisonScreen />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="admin/users" element={<AdminUsersPage />} />
          <Route path="dashboard/:iso" element={<DashboardPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
