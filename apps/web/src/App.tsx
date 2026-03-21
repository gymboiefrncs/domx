import OtpPage from "./pages/Otp";
import SetupProfilePage from "./pages/SetupProfile";
import SignupPage from "./pages/Signup";
import { GroupPage } from "./pages/GroupPage";
import { Route, Routes, Navigate, Outlet } from "react-router-dom";
import { LoginPage } from "./pages/Login";
import { AppLayout } from "./layout/AppLayout";
import { GroupProvider } from "./context/GroupContext";
import { GroupChatPage } from "./pages/GroupChat";
import { AuthLayout } from "./layout/AuthLayout";
import { Toaster } from "sonner";

export function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/signup" replace />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/otp" element={<OtpPage />} />
        <Route path="/setup-profile" element={<SetupProfilePage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<AuthLayout />}>
          <Route element={<AppLayout />}>
            <Route
              element={
                <GroupProvider>
                  <Outlet />
                </GroupProvider>
              }
            >
              <Route path="/groups" element={<GroupPage />} />
              <Route path="/groups/:id" element={<GroupChatPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </>
  );
}

// TODO: fix nav
// TODO: fix types
