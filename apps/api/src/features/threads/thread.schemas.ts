import * as z from "zod";

export const ThreadSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Thread title is required")
    .max(50, "Thread title exceeded"),
  content: z
    .string()
    .trim()
    .min(1, "Thread body is required")
    .max(10000, "Thread body exceeded"),
});

export const ThreadParamsSchema = z.object({
  groupId: z.string().uuid("Invalid group ID"),
});

export const JoinGroupPayloadSchema = ThreadParamsSchema;

export const EditThreadPayloadSchema = z.object({
  threadId: z.string().uuid("Invalid thread ID"),
  title: z
    .string()
    .trim()
    .min(1, "Thread title is required")
    .max(50, "Thread title exceeded"),
  content: z
    .string()
    .trim()
    .min(1, "Thread body is required")
    .max(10000, "Thread body exceeded"),
});

export const DeleteThreadPayloadSchema = z.object({
  threadId: z.string().uuid("Invalid thread ID"),
});

export const EditThreadParamsSchema = z.object({
  groupId: z.string().uuid("Invalid group ID"),
  threadId: z.string().uuid("Invalid thread ID"),
});

export const DeleteThreadParamsSchema = z.object({
  groupId: z.string().uuid("Invalid group ID"),
  threadId: z.string().uuid("Invalid thread ID"),
});

export type ThreadInput = z.infer<typeof ThreadSchema>;
export type ThreadParams = z.infer<typeof ThreadParamsSchema>;
export type JoinGroupPayload = z.infer<typeof JoinGroupPayloadSchema>;
export type EditThreadPayload = z.infer<typeof EditThreadPayloadSchema>;
export type DeleteThreadPayload = z.infer<typeof DeleteThreadPayloadSchema>;
export type EditThreadParams = z.infer<typeof EditThreadParamsSchema>;
export type DeleteThreadParams = z.infer<typeof DeleteThreadParamsSchema>;
