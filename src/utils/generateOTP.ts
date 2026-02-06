import crypto from "crypto";

export const generateOTP = async (): Promise<{
  otp: string;
  token: string;
  expiresAt: Date;
}> => {
  const otp = crypto.randomBytes(3).toString("hex");
  const token = crypto.createHash("sha256").update(otp).digest("hex");

  // 2 min from now
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

  return { otp, token, expiresAt };
};
