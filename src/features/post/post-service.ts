import type { Result } from "../../common/types.js";
import { createPost } from "./post-model.js";
import type { PostSchema } from "./post-schema.js";
import { UnauthorizedError } from "../../utils/error.js";

export const createPostForUser = async (
  userId: string | undefined,
  data: PostSchema,
): Promise<Result> => {
  if (!userId) throw new UnauthorizedError("Access denied");
  const result = await createPost(userId, data);
  return { ok: true, message: "Post created successfully", data: result };
};
