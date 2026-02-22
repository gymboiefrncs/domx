import * as jose from "jose";
import type { Role, Tokens } from "../common/types.js";

const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_TOKEN);
const accessSecret = new TextEncoder().encode(process.env.JWT_ACCESS_TOKEN);
export const refreshTokenExpiry = new Date(
  Date.now() + 7 * 24 * 60 * 60 * 1000,
);

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
    .setExpirationTime(refreshTokenExpiry)
    .sign(refreshSecret);

  return { accessToken, refreshToken };
};
