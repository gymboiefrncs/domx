import * as z from "zod";

export const otpSchema = z.object({
  otp: z.string().trim().min(1, "OTP is required"),
});

export const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase(),
});
