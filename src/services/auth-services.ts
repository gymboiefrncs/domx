import { signupModel } from "../models/auth-model.js";
import type { SignupSchema } from "../schemas/auth-schema.js";

export const signupService = async (data: SignupSchema) => {
  try {
    return await signupModel(data);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
