import * as jose from "jose";
import type { Role } from "@domx/shared";
import type { Tokens } from "../auth.types.js";
import { config } from "@api/shared/config.js";

const refreshSecret = new TextEncoder().encode(config.jwt.refreshTokenSecret);
const accessSecret = new TextEncoder().encode(config.jwt.accessTokenSecret);

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Returns a fresh expiry date relative to now.
 * Must be called per token, not cached at module level.
 */
export const getRefreshTokenExpiry = (): Date =>
  new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

export const generateTokens = async (
  userId: string,
  role: Role,
  jti: string,
): Promise<Tokens> => {
  const accessToken = await new jose.SignJWT({
    userId,
    role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(accessSecret);

  const refreshToken = await new jose.SignJWT({
    userId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(getRefreshTokenExpiry())
    .sign(refreshSecret);

  return { accessToken, refreshToken };
};
