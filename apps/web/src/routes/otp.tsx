import { createFileRoute } from "@tanstack/react-router";
import OtpPage from "@/pages/Otp";

export const Route = createFileRoute("/otp")({
  component: OtpPage,
});
