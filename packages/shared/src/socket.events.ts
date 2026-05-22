import type { Group, Member } from "./group.js";

export interface GroupMemberPayload {
  groupId: string;
  targetUserDisplayId: string;
}

export interface GroupRenamePayload {
  groupId: string;
  newName: string;
}

export interface ClientToServerEvents {
  "group:join": (groupId: string) => void;
  "group:leave": (groupId: string) => void;
  "group:member:add": (payload: GroupMemberPayload) => void;
  "group:member:kick": (payload: GroupMemberPayload) => void;
  "group:member:leave": (groupId: string) => void;
  "group:member:promote": (payload: GroupMemberPayload) => void;
  "group:member:demote": (payload: GroupMemberPayload) => void;
  "group:rename": (payload: GroupRenamePayload) => void;
  "group:delete": (groupId: string) => void;
}

// ------ Response ------
export interface ErrorResponse {
  message: string;
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
export interface GroupMemberLeftResponse {
  data: { groupId: string; displayId: string };
}
interface GroupRenamedResponse {
  data: { groupId: string; newName: string };
  by: string;
}
interface GroupAddMemberResponse {
  data: { groupId: string; newMember: Member };
  by: string;
}
interface GroupSummaryResponse {
  group: Group;
  type: "added";
}

export interface ServerToClientEvents {
  "group:join:failed": (payload: ErrorResponse) => void;
  "group:member:added": (payload: GroupAddMemberResponse) => void;
  "group:member:add:failed": (payload: ErrorResponse) => void;
  "group:member:kicked": (payload: GroupMemberResponse) => void;
  "group:member:kick:failed": (payload: ErrorResponse) => void;
  "group:member:left": (payload: GroupMemberLeftResponse) => void;
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
}
