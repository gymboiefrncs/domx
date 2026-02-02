import { signupModel } from "../models/auth-model.js";
import type { SignupSchema } from "../schemas/auth-schema.js";

export const signupService = async (data: SignupSchema) => {
  const result = await signupModel(data);
  return result;
};
