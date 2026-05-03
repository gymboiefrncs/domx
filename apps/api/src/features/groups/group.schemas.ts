import * as z from "zod";

export const GroupSchema = z.object({
  groupName: z
    .string()
    .min(1, "Group name is required")
    .max(50, "Group name must be at most 50 characters long")
    .trim(),
});

export const ManageMemberSchema = z.object({
  groupId: z.string().uuid("Invalid group ID"),
  displayId: z
    .string()
    .trim()
    .regex(
      /^[A-Z0-9]{8}$/,
      "Display ID must be 8 uppercase alphanumeric characters",
    ),
});

export const GroupParamsSchema = z.object({
  groupId: z.string().uuid("Invalid group ID"),
});
