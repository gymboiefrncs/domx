import type { Thread } from "@domx/shared";

export type ThreadParams = { groupId: string };
export type EditThread = Pick<Thread, "id" | "user_id">;
export interface Content {
  id: string;
  groupId: string;
  userId: string;
  title: string;
  content: string;
  username: string;
  displayId: string;
  createdAt: string;
}

export interface ContentPayload {
  groupId: string;
  title: string;
  content: string;
}

export interface ThreadResponse<T> {
  data: T;
}

// --- Service - Repository Params ---
// thread.types.ts

/**
 * The minimum identity needed to locate a thread.
 * Both threadId and groupId are required together because
 * threads are scoped to a group — a threadId alone isn't unique enough.
 */
export interface RepoThreadIdentity {
  threadId: string;
  groupId: string;
}

/**
 * The content fields of a thread. Optional here to support
 * partial updates via COALESCE in updateThread — only the
 * fields provided will overwrite the existing values.
 */
export interface RepoThreadContent {
  title?: string;
  content?: string;
}

/**
 * Required version of ThreadContent for insertions,
 * where both fields must be present.
 */
export type RepoRequiredThreadContent = Required<ThreadContent>;

/**
 * Parameters for inserting a new thread.
 * Extends RequiredThreadContent since both title and content
 * are mandatory on creation, and adds the ownership/scope context.
 */
export interface RepoInsertThreadParams extends RepoRequiredThreadContent {
  userId: string;
  groupId: string;
}

/**
 * Parameters for updating an existing thread.
 * Extends ThreadIdentity to locate the thread, and ThreadContent
 * for the optional fields that may be patched.
 */
export interface RepoUpdateThreadParams
  extends RepoThreadIdentity, RepoThreadContent {}

// getAllThreads only needs groupId — a plain string is sufficient,
// no interface needed for a single scalar parameter.

// findThreadById and deleteThread both only need ThreadIdentity,
// so they reuse that directly with no additional type needed.

// --- Controllers/Handlers - Service Params ---

export interface GroupRequestContext {
  groupId: string;
  requesterId: string;
}
export interface ThreadRequestContext extends GroupRequestContext {
  threadId: string;
}
export interface ThreadContent {
  title?: string;
  content?: string;
}

export type RequiredThreadContent = Required<ThreadContent>;
export type CreateThreadParams = GroupRequestContext & RequiredThreadContent;
export type UpdateThreadParams = ThreadRequestContext & ThreadContent;
