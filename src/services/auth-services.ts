import {
  getUserByEmail,
  signupModel,
  userExistsByEmail,
} from "../models/auth-model.js";
import type { SignupSchema } from "../schemas/auth-schema.js";
import bcrypt from "bcrypt";
import { ConflictError, UnauthorizedError } from "../utils/error.js";
import type { User } from "../common/types.js";

export const signupService = async (
  data: SignupSchema,
): Promise<Pick<User, "username" | "email">> => {
  const userExists = await userExistsByEmail(data.email);
  if (userExists) {
    throw new ConflictError(
      "An account with this email address already exists",
    );
  }

  const { password, ...rest } = data;

  const saltRoundsEnv = process.env.BCRYPT_SALT_ROUNDS;
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
  return result;
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
