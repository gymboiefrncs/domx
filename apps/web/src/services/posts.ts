import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { API_BASE_URL } from "@/config";
import type { Post, PostDetails } from "@domx/shared";

type ChatOutgoingMessage =
  | { type: "joinGroup"; payload: { groupId: string } }
  | { type: "sendMessage"; payload: { title: string; body: string } };

export type ChatIncomingMessage =
  | { type: "newMessage"; data: Post | PostDetails }
  | { type: "postEdited"; data: Partial<PostDetails> & { id: string } }
  | { type: "postDeleted"; data: { postId: string } }
  | { type: "error"; message?: string; payload?: string }
  | { message: string };

type PostSocketHandlers = {
  onOpen?: () => void;
  onMessage?: (message: ChatIncomingMessage) => void;
  onClose?: () => void;
  onError?: () => void;
};

const getApiHttpBase = (): string => {
  const baseUrl = new URL(API_BASE_URL);
  return baseUrl.origin;
};

const getPostsWsUrl = (): string => {
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = new URL(getApiHttpBase());
  url.protocol = wsProtocol;
  return url.toString();
};

const safeParseMessage = (raw: unknown): ChatIncomingMessage | null => {
  if (typeof raw !== "string") return null;

  try {
    return JSON.parse(raw) as ChatIncomingMessage;
  } catch {
    return null;
  }
};

export const connectPostSocket = (handlers: PostSocketHandlers): WebSocket => {
  const socket = new WebSocket(getPostsWsUrl());

  socket.addEventListener("open", () => {
    handlers.onOpen?.();
  });

  socket.addEventListener("message", (event) => {
    const parsed = safeParseMessage(event.data);
    if (!parsed) return;
    handlers.onMessage?.(parsed);
  });

  socket.addEventListener("close", () => {
    handlers.onClose?.();
  });

  socket.addEventListener("error", () => {
    handlers.onError?.();
  });

  return socket;
};

export const joinPostGroup = (socket: WebSocket, groupId: string): void => {
  const message: ChatOutgoingMessage = {
    type: "joinGroup",
    payload: { groupId },
  };
  socket.send(JSON.stringify(message));
};

export const sendPostMessage = (
  socket: WebSocket,
  payload: { title: string; body: string },
): void => {
  const message: ChatOutgoingMessage = {
    type: "sendMessage",
    payload,
  };
  socket.send(JSON.stringify(message));
};

export const fetchMessages = async (
  groupId: string,
): Promise<PostDetails[]> => {
  const res = await fetchWithAuth(`${API_BASE_URL}/groups/${groupId}/posts`, {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors[0].message);

  return data.data;
};
