import OtpPage from "./pages/Otp";
import SetupProfilePage from "./pages/SetupProfile";
import SignupPage from "./pages/Signup";
import { GroupPage } from "./pages/GroupPage";
import { Route, Routes, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/Login";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signup" replace />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/otp" element={<OtpPage />} />
      <Route path="/setup-profile" element={<SetupProfilePage />} />
      <Route path="/groups" element={<GroupPage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}

// TODO: add routing
