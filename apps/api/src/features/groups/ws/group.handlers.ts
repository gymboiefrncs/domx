import {
  addMember,
  deleteGroupById,
  demoteMember,
  getUserGroupSummary,
  kickMember,
  leaveMember,
  promoteMember,
} from "../group.services.js";
import type { ChatSocket } from "@api/shared/types/ws.js";
import { fetchUserByDisplayId } from "../group.repositories.js";
import { broadcastToGroup } from "../group-helper.js";
import { sendToUserSockets } from "@api/shared/ws/socketRegistry.js";
import { fetchProfile } from "@api/features/profile/index.js";

export const handleAddMember = async (
  data: unknown,
  socket: ChatSocket,
  rooms: Map<string, Set<ChatSocket>>,
) => {
  const { groupId, displayId } = data as { groupId: string; displayId: string };
  const newMember = await addMember(groupId, displayId, socket.userId);
  if (!newMember) {
    throw new Error("Failed to add member");
  }

  const targetUserId = await fetchUserByDisplayId(displayId);
  const payload = JSON.stringify({
    type: "memberAdded",
    data: newMember,
  });

  socket.send(payload);
  broadcastToGroup(rooms, groupId, payload, socket, targetUserId ?? undefined);

  if (targetUserId) {
    const groupSummary = await getUserGroupSummary(targetUserId, groupId);
    const targetPayload = JSON.stringify({
      type: "memberAdded",
      data: newMember,
      group: groupSummary,
    });

    if (targetUserId !== socket.userId) {
      sendToUserSockets(targetUserId, targetPayload);
    }
  }
};

export const handlePromoteMember = async (
  data: unknown,
  socket: ChatSocket,
  rooms: Map<string, Set<ChatSocket>>,
) => {
  const { groupId, displayId } = data as { groupId: string; displayId: string };
  await promoteMember(groupId, displayId, socket.userId);
  const payload = JSON.stringify({
    type: "memberPromoted",
    data: { groupId, displayId },
  });
  socket.send(payload);
  broadcastToGroup(rooms, groupId, payload, socket);
};

export const handleDemoteMember = async (
  data: unknown,
  socket: ChatSocket,
  rooms: Map<string, Set<ChatSocket>>,
) => {
  const { groupId, displayId } = data as { groupId: string; displayId: string };
  await demoteMember(groupId, displayId, socket.userId);
  const payload = JSON.stringify({
    type: "memberDemoted",
    data: { groupId, displayId },
  });
  socket.send(payload);
  broadcastToGroup(rooms, groupId, payload, socket);
};

export const handleKickMember = async (
  data: unknown,
  socket: ChatSocket,
  rooms: Map<string, Set<ChatSocket>>,
) => {
  const { groupId, displayId } = data as { groupId: string; displayId: string };
  await kickMember(groupId, displayId, socket.userId);
  const payload = JSON.stringify({
    type: "memberKicked",
    data: { groupId, displayId },
  });
  socket.send(payload);
  broadcastToGroup(rooms, groupId, payload, socket);
};

export const handleLeaveGroup = async (
  data: unknown,
  socket: ChatSocket,
  rooms: Map<string, Set<ChatSocket>>,
) => {
  const { groupId } = data as { groupId: string };
  await leaveMember(groupId, socket.userId);
  const profile = await fetchProfile(socket.userId);

  const payload = JSON.stringify({
    type: "groupLeft",
    data: { groupId, displayId: profile.display_id },
  });
  socket.send(payload);
  broadcastToGroup(rooms, groupId, payload, socket);
};

export const handleDeleteGroup = async (
  data: unknown,
  socket: ChatSocket,
  rooms: Map<string, Set<ChatSocket>>,
) => {
  const { groupId } = data as { groupId: string };
  await deleteGroupById(groupId, socket.userId);

  const payload = JSON.stringify({
    type: "groupDeleted",
    data: { groupId },
  });

  socket.send(payload);
  broadcastToGroup(rooms, groupId, payload, socket);
};
