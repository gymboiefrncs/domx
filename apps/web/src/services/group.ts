import { fetchWithAuth } from "@/lib/fetchWithAuth";
import type { GroupDetail, NewMember } from "@domx/shared";
import { API_BASE_URL } from "@/config";
import { getApiErrorMessage } from "@/utils/error";

type GroupWsOutgoingMessage =
  | {
      type: "promoteMember" | "demoteMember" | "kickMember";
      payload: { groupId: string; displayId: string };
    }
  | { type: "leaveGroup"; payload: { groupId: string } };

type GroupWsIncomingMessage =
  | { type: "memberPromoted"; message?: string }
  | { type: "memberDemoted"; message?: string }
  | { type: "memberKicked"; message?: string }
  | { type: "groupLeft"; message?: string }
  | { type: "error"; message?: string; payload?: string }
  | { message: string };

const getApiHttpBase = (): string => {
  const baseUrl = new URL(API_BASE_URL);
  return baseUrl.origin;
};

const getGroupsWsUrl = (): string => {
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = new URL(getApiHttpBase());
  url.protocol = wsProtocol;
  return url.toString();
};

const safeParseGroupWsMessage = (
  raw: unknown,
): GroupWsIncomingMessage | null => {
  if (typeof raw !== "string") return null;

  try {
    return JSON.parse(raw) as GroupWsIncomingMessage;
  } catch {
    return null;
  }
};

const sendGroupWsRequest = async (
  message: GroupWsOutgoingMessage,
  successType:
    | "memberPromoted"
    | "memberDemoted"
    | "memberKicked"
    | "groupLeft",
): Promise<void> =>
  new Promise((resolve, reject) => {
    const socket = new WebSocket(getGroupsWsUrl());

    socket.addEventListener("open", () => {
      socket.send(JSON.stringify(message));
    });

    socket.addEventListener("message", (event) => {
      const parsed = safeParseGroupWsMessage(event.data);
      if (!parsed) return;

      if ("type" in parsed && parsed.type === successType) {
        socket.close();
        resolve();
        return;
      }

      if ("type" in parsed && parsed.type === "error") {
        socket.close();
        reject(new Error(parsed.message ?? parsed.payload ?? "Request failed"));
        return;
      }

      if ("message" in parsed && typeof parsed.message === "string") {
        socket.close();
        reject(new Error(parsed.message));
      }
    });

    socket.addEventListener("error", () => {
      socket.close();
      reject(new Error("WebSocket request failed"));
    });
  });

export const createGroup = async (name: string): Promise<GroupDetail> => {
  const res = await fetchWithAuth(`${API_BASE_URL}/groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ groupName: name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(getApiErrorMessage(data));
  return data.data;
};

export const changeGroupName = async (groupId: string, newName: string) => {
  const res = await fetchWithAuth(`${API_BASE_URL}/groups/${groupId}/name`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ groupName: newName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(getApiErrorMessage(data));
  return data;
};

export const fetchMyGroups = async (): Promise<GroupDetail[]> => {
  const res = await fetchWithAuth(`${API_BASE_URL}/groups`, {
    method: "GET",
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(getApiErrorMessage(data));
  return data.data;
};

export const addMemberToGroup = async (
  groupId: string,
  displayId: string,
): Promise<NewMember> => {
  const res = await fetchWithAuth(
    `${API_BASE_URL}/groups/${groupId}/add/${displayId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ displayId }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(getApiErrorMessage(data));
  return data.data;
};

export const fetchGroupMembers = async (groupId: string) => {
  const res = await fetchWithAuth(`${API_BASE_URL}/groups/${groupId}/members`, {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(getApiErrorMessage(data));
  return data.data;
};

export const deleteGroup = async (groupId: string) => {
  const res = await fetchWithAuth(`${API_BASE_URL}/groups/${groupId}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(getApiErrorMessage(data));
  return data;
};

export const promoteMemberInGroup = async (
  groupId: string,
  displayId: string,
) => {
  await sendGroupWsRequest(
    {
      type: "promoteMember",
      payload: { groupId, displayId },
    },
    "memberPromoted",
  );
};

export const demoteMemberInGroup = async (
  groupId: string,
  displayId: string,
) => {
  await sendGroupWsRequest(
    {
      type: "demoteMember",
      payload: { groupId, displayId },
    },
    "memberDemoted",
  );
};

export const kickMemberFromGroup = async (
  groupId: string,
  displayId: string,
) => {
  await sendGroupWsRequest(
    {
      type: "kickMember",
      payload: { groupId, displayId },
    },
    "memberKicked",
  );
};

export const leaveGroupById = async (groupId: string) => {
  await sendGroupWsRequest(
    {
      type: "leaveGroup",
      payload: { groupId },
    },
    "groupLeft",
  );
};

export const markGroupAsSeen = async (groupId: string): Promise<void> => {
  const res = await fetchWithAuth(`${API_BASE_URL}/groups/${groupId}/seen`, {
    method: "PATCH",
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(getApiErrorMessage(data));
};
