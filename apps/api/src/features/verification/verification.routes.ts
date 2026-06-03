import express, { type Router } from "express";
import {
  resendOtpHandler,
  verificationHandler,
} from "./verification.controllers.js";
import { validateBody } from "@api/shared/middlewares/validate.js";
import { otpSchema, emailSchema } from "./verification.schemas.js";
import {
  otpLimiter,
  verificationLimiter,
} from "@api/shared/middlewares/rateLimit.js";

const emailValidator = validateBody(emailSchema);
const otpValidator = validateBody(otpSchema);

export const verificationRouter: Router = express.Router();

verificationRouter.post(
  "/verify-email",
  otpValidator,
  otpLimiter,
  verificationHandler,
);
verificationRouter.post(
  "/resend-otp",
  emailValidator,
  verificationLimiter,
  resendOtpHandler,
);
