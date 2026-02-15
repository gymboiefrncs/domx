import type { Result } from "../common/types.js";
import { createPostModel } from "../models/post-model.js";
import type { PostSchema } from "../schemas/post-schema.js";
import { UnauthorizedError } from "../utils/error.js";

export const createPostService = async (
  userId: string | undefined,
  data: PostSchema,
): Promise<Result> => {
  if (!userId) throw new UnauthorizedError("Access denied");
  const result = await createPostModel(userId, data);
  return { ok: true, message: "Post created successfully", data: result };
};
