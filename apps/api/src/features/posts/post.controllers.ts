import type { Request, Response, NextFunction } from "express";
import {
  createPost,
  editPost,
  getGroupPosts,
  removePost,
} from "./post.services.js";
import type { ChatSocket } from "./post.types.js";
import { performChecks } from "./post.helpers.js";

export const handleGetPosts = async (
  req: Request<{ groupId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const requesterId = req.user!.userId;

    const result = await getGroupPosts(groupId, requesterId);
    res.status(200).json({
      success: result.ok,
      message: result.message,
      data: result.ok ? result.data : null,
    });
  } catch (error) {
    next(error);
  }
};

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
  console.log(result.data);
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
