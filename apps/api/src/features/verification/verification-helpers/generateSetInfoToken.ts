import * as jose from "jose";
import { config } from "@api/shared/config.js";

const setInfoSecret = new TextEncoder().encode(config.jwt.setInfoTokenSecret);

export const generateSetInfoToken = async (userId: string): Promise<string> => {
  const token = await new jose.SignJWT({
    sub: userId,
    purpose: "set-info",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(setInfoSecret);

  return token;
};
