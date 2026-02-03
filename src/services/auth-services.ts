import { signupModel } from "../models/auth-model.js";
import type { SignupSchema } from "../schemas/auth-schema.js";
import bcrypt from "bcrypt";

export const signupService = async (data: SignupSchema) => {
  const { password, ...rest } = data;
  const saltRounds = process.env.BCRYPT_SALT_ROUNDS
    ? Number(process.env.BCRYPT_SALT_ROUNDS)
    : 10;
  const hash = await bcrypt.hash(password, saltRounds);
  const result = await signupModel(hash, rest);
  return result;
};
