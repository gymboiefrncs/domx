import * as jose from "jose";
import type { tokens } from "../common/types.js";

const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_TOKEN);
const accessSecret = new TextEncoder().encode(process.env.JWT_ACCESS_TOKEN);

export const generateTokens = async (
  userId: string,
  isAdmin: boolean,
  jti: string,
): Promise<tokens> => {
  const accessToken = await new jose.SignJWT({
    userId,
    isAdmin,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .sign(accessSecret);

  const refreshToken = await new jose.SignJWT({
    userId,
    jti,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(refreshSecret);

  return { accessToken, refreshToken };
};
