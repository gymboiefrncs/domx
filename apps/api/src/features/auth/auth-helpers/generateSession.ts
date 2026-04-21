import type { Tokens } from "../auth.types.js";
import { createToken } from "../auth.repositories.js";
import { generateTokens, getRefreshTokenExpiry } from "./generateToken.js";
import crypto from "crypto";

export const generateSession = async (userId: string): Promise<Tokens> => {
  const jti = crypto.randomUUID();

  const { accessToken, refreshToken } = await generateTokens(userId, jti);

  const hashedToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  await createToken(jti, userId, hashedToken, getRefreshTokenExpiry());

  return { accessToken, refreshToken };
};
