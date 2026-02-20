import * as z from "zod";

export const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .length(6, "Invalid OTP")
    .regex(/^[a-f0-9]+$/, "Invalid OTP"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase(),
});

export const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase(),
});
