import OtpPage from "./pages/Otp";
import SetupProfilePage from "./pages/SetupProfile";
import SignupPage from "./pages/Signup";
import { Route, Routes, Navigate } from "react-router-dom";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signup" replace />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/otp" element={<OtpPage />} />
      <Route path="/setup-profile" element={<SetupProfilePage />} />
    </Routes>
  );
}

// TODO: add routing
