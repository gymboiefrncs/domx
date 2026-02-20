import { sendAlreadyRegisteredEmail } from "../sendEmail.js";
import { EMAIL_MESSAGE } from "../../features/auth/auth-service.js";

export const handleVerifiedUser = (
  email: string,
): { ok: true; message: string } => {
  sendAlreadyRegisteredEmail(email).catch((error) => {
    console.error("Failed to send already registered email:", error);
  });
  return {
    ok: true,
    message: EMAIL_MESSAGE,
  };
};
