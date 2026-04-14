import { API_BASE_URL } from "@/shared/config";

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
