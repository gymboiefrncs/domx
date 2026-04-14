import { demoteMember, kickMember, promoteMember } from "../group.services.js";
import type { ChatSocket } from "@api/shared/types/ws.js";
import { broadcastToGroup } from "../group-helper.js";

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
  const result = await kickMember(groupId, socket.userId, socket.userId);
  const payload = JSON.stringify({
    type: "groupLeft",
    message: result.message,
    data: { groupId },
  });
  socket.send(payload);
  broadcastToGroup(rooms, groupId, payload);
};
