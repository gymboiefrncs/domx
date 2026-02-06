import {
  getUserByEmail,
  signupModel,
  userExistsByEmail,
} from "../models/auth-model.js";
import { createVerificationToken } from "../models/verification-model.js";
import type { SignupSchema } from "../schemas/auth-schema.js";
import bcrypt from "bcrypt";
import { UnauthorizedError } from "../utils/error.js";
import type { User } from "../common/types.js";
import crypto from "crypto";
import {
  sendAlreadyRegisteredEmail,
  sendVerificationEmail,
} from "../utils/sendEmail.js";

export const signupService = async (
  data: SignupSchema,
): Promise<{ message: string }> => {
  const userExists = await userExistsByEmail(data.email);
  if (userExists) {
    await sendAlreadyRegisteredEmail(data.email);
    return { message: "Verification email sent. Please check your email" };
  }

  const { password, ...rest } = data;

  const saltRoundsEnv = process.env.BCRYPT_SALT_ROUNDS;
  const otp = crypto.randomBytes(3).toString("hex");
  const token = crypto.createHash("sha256").update(otp).digest("hex");

  // 15 mins from now
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  let saltRounds = 10;
  const MIN_SALT_ROUNDS = 10;
  const MAX_SALT_ROUNDS = 15;
  if (saltRoundsEnv !== undefined) {
    const parsedSaltRounds = Number(saltRoundsEnv);
    if (
      Number.isInteger(parsedSaltRounds) &&
      parsedSaltRounds >= MIN_SALT_ROUNDS &&
      parsedSaltRounds <= MAX_SALT_ROUNDS
    ) {
      saltRounds = parsedSaltRounds;
    }
  }
  const hash = await bcrypt.hash(password, saltRounds);

  const result = await signupModel(hash, rest);
  await createVerificationToken(result.id, token, expiresAt);
  await sendVerificationEmail(result.email, otp);
  return { message: "Verification email sent. Please check your email" };
};

export const loginService = async (
  data: Pick<User, "email" | "password">,
): Promise<Pick<User, "username" | "email">> => {
  const user = await getUserByEmail(data.email);

  if (!user) throw new UnauthorizedError("Invalid credentials");

  const passwordMatch = await bcrypt.compare(data.password, user.password);

  if (!passwordMatch) throw new UnauthorizedError("Invalid credentials");

  return { username: user.username, email: user.email };
};
