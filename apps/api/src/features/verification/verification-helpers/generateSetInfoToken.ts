import * as jose from "jose";
import { SET_INFO_SECRET } from "../verification.constants.js";

export const generateSetInfoToken = async (userId: string): Promise<string> => {
  const token = await new jose.SignJWT({
    sub: userId,
    purpose: "set-info",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(SET_INFO_SECRET);

  return token;
};
