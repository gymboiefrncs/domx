import * as z from "zod";

export const postSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(50, "Max character reached"),
  content: z.string().trim().min(1, "Content is required"),
});

export type PostSchema = z.infer<typeof postSchema>;
