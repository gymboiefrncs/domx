import type { Tokens } from "../auth.types.js";
import { createToken } from "../auth.repositories.js";
import type { Role } from "@domx/shared";
import {
  generateTokens,
  getRefreshTokenExpiry,
} from "@api/utils/generateToken.js";
import crypto from "crypto";

export const generateSession = async (
  userId: string,
  role: Role,
): Promise<Tokens> => {
  const jti = crypto.randomUUID();

  const { accessToken, refreshToken } = await generateTokens(userId, role, jti);

  const hashedToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  await createToken(jti, userId, hashedToken, getRefreshTokenExpiry());

  return { accessToken, refreshToken };
};
