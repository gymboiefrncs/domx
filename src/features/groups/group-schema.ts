import * as z from "zod";

export const GroupSchema = z.object({
  groupName: z
    .string()
    .min(1, "Group name is required")
    .max(50, "Group name must be at most 50 characters long")
    .trim(),
});

export type GroupInput = z.infer<typeof GroupSchema>;
