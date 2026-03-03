import * as jose from "jose";

const SET_INFO_SECRET = new TextEncoder().encode(
  process.env.SET_PASSWORD_TOKEN!,
);

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
