import type { ChatSocket } from "@api/shared/types/ws.js";

const userSockets = new Map<string, Set<ChatSocket>>();

export const registerUserSocket = (socket: ChatSocket): void => {
  const sockets = userSockets.get(socket.userId) ?? new Set<ChatSocket>();
  sockets.add(socket);
  userSockets.set(socket.userId, sockets);
};

export const unregisterUserSocket = (socket: ChatSocket): void => {
  const sockets = userSockets.get(socket.userId);
  if (!sockets) return;

  sockets.delete(socket);
  if (sockets.size === 0) {
    userSockets.delete(socket.userId);
  }
};

export const sendToUserSockets = (userId: string, payload: string): void => {
  const sockets = userSockets.get(userId);
  if (!sockets) return;

  sockets.forEach((socket) => {
    if (socket.readyState !== socket.OPEN) return;
    socket.send(payload);
  });
};
