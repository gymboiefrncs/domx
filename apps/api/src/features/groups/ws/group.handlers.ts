import {
  addMember,
  deleteGroupById,
  demoteMember,
  kickMember,
  leaveMember,
  promoteMember,
} from "../group.services.js";
import type { ChatSocket } from "@api/shared/types/ws.js";
import { fetchUserByDisplayId } from "../group.repositories.js";
import { broadcastToGroup } from "../group-helper.js";
import { sendToUserSockets } from "@api/shared/ws/socketRegistry.js";
import { getProfile } from "@api/features/profile/profile.repositories.js";

export const handleAddMember = async (
  data: unknown,
  socket: ChatSocket,
  rooms: Map<string, Set<ChatSocket>>,
) => {
  const { groupId, displayId } = data as { groupId: string; displayId: string };
  const result = await addMember(groupId, displayId, socket.userId);
  if (!result.ok) {
    throw new Error(result.message);
  }

  const payload = JSON.stringify({
    type: "memberAdded",
    message: result.message,
    data: result.data,
  });

  socket.send(payload);
  broadcastToGroup(rooms, groupId, payload);

  const targetUserId = await fetchUserByDisplayId(displayId);
  if (targetUserId) {
    sendToUserSockets(targetUserId, payload);
  }
};

export const handlePromoteMember = async (
  data: unknown,
  socket: ChatSocket,
  rooms: Map<string, Set<ChatSocket>>,
) => {
  const { groupId, displayId } = data as { groupId: string; displayId: string };
  const result = await promoteMember(groupId, displayId, socket.userId);
  const payload = JSON.stringify({
    type: "memberPromoted",
    message: result.message,
    data: { groupId, displayId },
  });
  socket.send(payload);
  broadcastToGroup(rooms, groupId, payload);
};

export const handleDemoteMember = async (
  data: unknown,
  socket: ChatSocket,
  rooms: Map<string, Set<ChatSocket>>,
) => {
  const { groupId, displayId } = data as { groupId: string; displayId: string };
  const result = await demoteMember(groupId, displayId, socket.userId);
  const payload = JSON.stringify({
    type: "memberDemoted",
    message: result.message,
    data: { groupId, displayId },
  });
  socket.send(payload);
  broadcastToGroup(rooms, groupId, payload);
};

export const handleKickMember = async (
  data: unknown,
  socket: ChatSocket,
  rooms: Map<string, Set<ChatSocket>>,
) => {
  const { groupId, displayId } = data as { groupId: string; displayId: string };
  const result = await kickMember(groupId, displayId, socket.userId);
  const payload = JSON.stringify({
    type: "memberKicked",
    message: result.message,
    data: { groupId, displayId },
  });
  socket.send(payload);
  broadcastToGroup(rooms, groupId, payload);
};

export const handleLeaveGroup = async (
  data: unknown,
  socket: ChatSocket,
  rooms: Map<string, Set<ChatSocket>>,
) => {
  const { groupId } = data as { groupId: string };
  const result = await leaveMember(groupId, socket.userId);
  const profile = await getProfile(socket.userId);

  const payload = JSON.stringify({
    type: "groupLeft",
    message: result.message,
    data: { groupId, displayId: profile.display_id },
  });
  socket.send(payload);
  broadcastToGroup(rooms, groupId, payload);
};

export const handleDeleteGroup = async (
  data: unknown,
  socket: ChatSocket,
  rooms: Map<string, Set<ChatSocket>>,
) => {
  const { groupId } = data as { groupId: string };
  const result = await deleteGroupById(groupId, socket.userId);

  const payload = JSON.stringify({
    type: "groupDeleted",
    message: result.message,
    data: { groupId },
  });

  socket.send(payload);
  broadcastToGroup(rooms, groupId, payload);
};
