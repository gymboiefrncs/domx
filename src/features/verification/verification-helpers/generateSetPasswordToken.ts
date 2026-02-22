import * as jose from "jose";

const SET_PASSWORD_SECRET = new TextEncoder().encode(
  process.env.SET_PASSWORD_TOKEN!,
);

export const generateSetPasswordToken = async (
  userId: string,
): Promise<string> => {
  const token = await new jose.SignJWT({
    sub: userId,
    purpose: "set-password",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(SET_PASSWORD_SECRET);

  return token;
};
