import { createPost, editPost, removePost } from "../post.services.js";
import type { ChatSocket } from "@api/shared/types/ws.js";
import { performChecks } from "../post.helpers.js";

export const handleJoinGroup = async (
  data: unknown,
  socket: ChatSocket,
  rooms: Map<string, Set<ChatSocket>>,
): Promise<void> => {
  const { groupId } = data as { groupId: string };

  // Only allow room subscription for users that belong to the group.
  await performChecks(groupId, socket.userId);

  if (socket.groupId && socket.groupId !== groupId) {
    rooms.get(socket.groupId)?.delete(socket);
  }

  if (!rooms.has(groupId)) {
    rooms.set(groupId, new Set());
  }

  rooms.get(groupId)!.add(socket);
  socket.groupId = groupId;
};

export const handleCreatePost = async (
  data: unknown,
  socket: ChatSocket,
  rooms: Map<string, Set<ChatSocket>>,
) => {
  const { title, body } = data as { title: string; body: string };
  const result = await createPost(title, body, socket.userId, socket.groupId);

  if (!result.ok) {
    return socket.send(
      JSON.stringify({ type: "error", message: result.message }),
    );
  }

  const room = rooms.get(socket.groupId);
  room?.forEach((client) => {
    client.send(JSON.stringify({ type: "newMessage", data: result.data }));
  });
};

export const handleEditPost = async (
  data: unknown,
  socket: ChatSocket,
  rooms: Map<string, Set<ChatSocket>>,
) => {
  const { postId, title, body } = data as {
    postId: string;
    title: string;
    body: string;
  };
  const result = await editPost(
    title,
    body,
    socket.userId,
    socket.groupId,
    postId,
  );

  if (!result.ok) {
    return socket.send(
      JSON.stringify({ type: "error", message: result.message }),
    );
  }

  const room = rooms.get(socket.groupId);
  room?.forEach((client) => {
    client.send(JSON.stringify({ type: "postEdited", data: result.data }));
  });
};

export const handleDeletePost = async (
  data: unknown,
  socket: ChatSocket,
  rooms: Map<string, Set<ChatSocket>>,
) => {
  const { postId } = data as { postId: string };
  const result = await removePost(postId, socket.groupId, socket.userId);
  if (!result.ok) {
    return socket.send(
      JSON.stringify({ type: "error", message: result.message }),
    );
  }
  const room = rooms.get(socket.groupId);
  room?.forEach((client) => {
    client.send(JSON.stringify({ type: "postDeleted", data: { postId } }));
  });
};
