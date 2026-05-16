import { wsClient, type WsOutgoingMessage } from "@/shared/lib/ws/wsClient";
import type { Group, Member } from "@domx/shared";

type GroupWsOutgoingMessage = Extract<
  WsOutgoingMessage,
  | { type: "addMember" }
  | { type: "promoteMember" }
  | { type: "demoteMember" }
  | { type: "kickMember" }
  | { type: "leaveGroup" }
  | { type: "deleteGroup" }
>;

type GroupWsIncomingMessage =
  | { type: "memberAdded"; message?: string; data: Member; group?: Group }
  | {
      type: "memberPromoted";
      message?: string;
      data: { groupId: string; displayId: string };
    }
  | {
      type: "memberDemoted";
      message?: string;
      data: { groupId: string; displayId: string };
    }
  | {
      type: "memberKicked";
      message?: string;
      data: { groupId: string; displayId: string };
    }
  | {
      type: "groupLeft";
      message?: string;
      data: { groupId: string; displayId?: string };
    }
  | { type: "groupDeleted"; message?: string; data: { groupId: string } }
  | { type: "error"; message?: string; payload?: string }
  | { message: string }
  | { type: string };

type GroupWsSuccessType =
  | "memberAdded"
  | "memberPromoted"
  | "memberDemoted"
  | "memberKicked"
  | "groupLeft"
  | "groupDeleted";

const sendGroupWsRequest = async <TSuccess extends GroupWsSuccessType, T>(
  message: GroupWsOutgoingMessage,
  successType: TSuccess,
  onSuccess: (
    message: Extract<GroupWsIncomingMessage, { type: TSuccess }>,
  ) => T,
  matcher?: (
    message: Extract<GroupWsIncomingMessage, { type: TSuccess }>,
  ) => boolean,
): Promise<T> =>
  new Promise((resolve, reject) => {
    const release = wsClient.acquire();
    const unsubscribe = wsClient.subscribe((parsed) => {
      if (!("type" in parsed)) {
        if ("message" in parsed && typeof parsed.message === "string") {
          unsubscribe();
          release();
          reject(new Error(parsed.message));
        }
        return;
      }

      if (parsed.type === "error") {
        unsubscribe();
        release();
        reject(new Error(parsed.message ?? parsed.payload ?? "Request failed"));
        return;
      }

      if (parsed.type !== successType) {
        return;
      }

      const successMessage = parsed as Extract<
        GroupWsIncomingMessage,
        { type: TSuccess }
      >;

      if (matcher && !matcher(successMessage)) {
        return;
      }

      unsubscribe();
      release();
      resolve(onSuccess(successMessage));
    });

    wsClient.send(message);
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
    () => undefined,
    (message) =>
      message.data.groupId === groupId && message.data.displayId === displayId,
  );
};

export const addMemberInGroup = async (
  groupId: string,
  displayId: string,
): Promise<Member> =>
  sendGroupWsRequest(
    {
      type: "addMember",
      payload: { groupId, displayId },
    },
    "memberAdded",
    (message) => message.data,
    (message) =>
      message.data.group_id === groupId &&
      message.data.display_id === displayId,
  );

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
    () => undefined,
    (message) =>
      message.data.groupId === groupId && message.data.displayId === displayId,
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
    () => undefined,
    (message) =>
      message.data.groupId === groupId && message.data.displayId === displayId,
  );
};

export const leaveGroupById = async (groupId: string) => {
  await sendGroupWsRequest(
    {
      type: "leaveGroup",
      payload: { groupId },
    },
    "groupLeft",
    () => undefined,
    (message) => message.data.groupId === groupId,
  );
};

export const deleteGroupByIdWs = async (groupId: string) => {
  await sendGroupWsRequest(
    {
      type: "deleteGroup",
      payload: { groupId },
    },
    "groupDeleted",
    () => undefined,
    (message) => message.data.groupId === groupId,
  );
};
