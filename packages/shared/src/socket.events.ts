import type { Group, Member } from "./group.js";
import type { PostDetails } from "./post.js";

export interface GroupMemberPayload {
  groupId: string;
  targetUserDisplayId: string;
}

export interface GroupRenamePayload {
  groupId: string;
  newName: string;
}

export interface ChatPayload {
  title: string;
  body: string;
  groupId: string;
}
export interface ChatDeletePayload {
  groupId: string;
  postId: string;
}
export interface ChatEditPayload {
  title?: string;
  body?: string;
  groupId: string;
  postId: string;
}

// ------ Responses ------
export interface ErrorResponse {
  message: string;
}
export interface GroupLeftResponse {
  data: { groupId: string; memberCount: number; wasDeleted?: boolean };
  by: string;
}
export interface GroupRenameResponse {
  data: { groupId: string; newName: string };
  by: string;
}
export interface GroupMemberResponse {
  data: { groupId: string; targetUserDisplayId: string };
  by: string;
}
export interface GroupDeleteResponse {
  data: { groupId: string };
  by: string;
}
export interface GroupRenamedResponse {
  data: { groupId: string; newName: string };
  by: string;
}
export interface GroupAddMemberResponse {
  data: { groupId: string; newMember: Member; groupDetail: Group };
  by: string;
}
export interface GroupSummaryResponse {
  group: Group;
  type: "added";
}
export interface GroupMemberKickResponse {
  data: {
    groupId: string;
    targetUserDisplayId: string;
    memberCount: number;
    targetId: string;
  };
  by: string;
}

export interface ChatResponsePayload {
  data: { message: PostDetails };
  by: string;
  type: "added" | "edited" | "deleted";
}
export interface ChatDeleteResponsePayload {
  data: { postId: string; groupId: string };
  by: string;
  type: "deleted";
}

export interface ClientToServerEvents {
  "group:join": (groupId: string) => void;
  "group:leave": (groupId: string) => void;
  "group:member:add": (payload: GroupMemberPayload) => void;
  "group:member:kick": (payload: GroupMemberPayload) => void;
  "group:member:leave": (
    groupId: string,
    callback: (response: { success: boolean }) => void,
  ) => void;
  "group:member:promote": (payload: GroupMemberPayload) => void;
  "group:member:demote": (payload: GroupMemberPayload) => void;
  "group:rename": (payload: GroupRenamePayload) => void;
  "group:delete": (groupId: string) => void;

  // chat events
  "chat:send": (
    payload: ChatPayload,
    callback: (response: { success: boolean }) => void,
  ) => void;
  "chat:edit": (payload: ChatEditPayload) => void;
  "chat:delete": (payload: ChatDeletePayload) => void;
}

export interface ServerToClientEvents {
  "group:join:failed": (payload: ErrorResponse) => void;
  "group:member:added": (payload: GroupAddMemberResponse) => void;
  "group:member:add:failed": (payload: ErrorResponse) => void;
  "group:member:kicked": (payload: GroupMemberKickResponse) => void;
  "group:member:kick:failed": (payload: ErrorResponse) => void;
  "group:member:left": (payload: GroupLeftResponse) => void;
  "group:member:leave:failed": (payload: ErrorResponse) => void;
  "group:member:promoted": (payload: GroupMemberResponse) => void;
  "group:member:promote:failed": (payload: ErrorResponse) => void;
  "group:member:demoted": (payload: GroupMemberResponse) => void;
  "group:member:demote:failed": (payload: ErrorResponse) => void;
  "group:renamed": (payload: GroupRenamedResponse) => void;
  "group:rename:failed": (payload: ErrorResponse) => void;
  "group:deleted": (payload: GroupDeleteResponse) => void;
  "group:delete:failed": (payload: ErrorResponse) => void;
  "group:summary": (payload: GroupSummaryResponse) => void;

  // chat events
  "chat:received": (payload: ChatResponsePayload) => void;
  "chat:send:failed": (payload: ErrorResponse) => void;
}
