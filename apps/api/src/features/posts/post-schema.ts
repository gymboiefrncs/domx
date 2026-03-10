import * as z from "zod";

export const PostSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Post body is required")
    .max(1000, "Post body exceeded"),
});

export const PostParamsSchema = z.object({
  groupId: z.string().uuid("Invalid group ID"),
});

export const EditPostParamsSchema = z.object({
  groupId: z.string().uuid("Invalid group ID"),
  postId: z.string().uuid("Invalid post ID"),
});

export const DeletePostParamsSchema = z.object({
  groupId: z.string().uuid("Invalid group ID"),
  postId: z.string().uuid("Invalid post ID"),
});

export type PostInput = z.infer<typeof PostSchema>;
export type PostParams = z.infer<typeof PostParamsSchema>;
export type EditPostParams = z.infer<typeof EditPostParamsSchema>;
export type DeletePostParams = z.infer<typeof DeletePostParamsSchema>;
