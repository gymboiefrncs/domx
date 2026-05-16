import { API_BASE_URL } from "@/shared/config";
import type { Group, Member, Post, PostDetails } from "@domx/shared";

export type WsOutgoingMessage =
  | { type: "joinGroup"; payload: { groupId: string } }
  | { type: "sendMessage"; payload: { title: string; body: string } }
  | {
      type: "editMessage";
      payload: { postId: string; title: string; body: string };
    }
  | { type: "deleteMessage"; payload: { postId: string } }
  | {
      type: "addMember" | "promoteMember" | "demoteMember" | "kickMember";
      payload: { groupId: string; displayId: string };
    }
  | { type: "leaveGroup" | "deleteGroup"; payload: { groupId: string } };

export type WsIncomingMessage =
  | { type: "newMessage"; data: PostDetails }
  | { type: "postEdited"; data: Partial<PostDetails> & { id: string } }
  | { type: "postDeleted"; data: { postId: string } }
  | { type: "memberAdded"; data: Member; group?: Group; message?: string }
  | {
      type: "memberPromoted" | "memberDemoted" | "memberKicked";
      data: { groupId: string; displayId: string };
      message?: string;
    }
  | {
      type: "groupLeft";
      data: { groupId: string; displayId?: string };
      message?: string;
    }
  | {
      type: "groupDeleted";
      data: { groupId: string };
      message?: string;
    }
  | {
      type: "error";
      message?: string;
      payload?: string;
      retryAfter?: number | null;
    }
  | { message: string };

type ConnectionEvent = "open" | "close" | "error";

const getApiHttpBase = (): string => {
  const baseUrl = new URL(API_BASE_URL);
  return baseUrl.origin;
};

const getWsUrl = (): string => {
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = new URL(getApiHttpBase());
  url.protocol = wsProtocol;
  return url.toString();
};

const safeParseIncomingMessage = (raw: unknown): WsIncomingMessage | null => {
  if (typeof raw !== "string") return null;

  try {
    return JSON.parse(raw) as WsIncomingMessage;
  } catch {
    return null;
  }
};

class WsClient {
  private socket: WebSocket | null = null;
  private listeners = new Set<(message: WsIncomingMessage) => void>();
  private connectionListeners = new Set<(event: ConnectionEvent) => void>();
  private reconnectTimer: number | null = null;
  private refCount = 0;
  private queue: string[] = [];

  acquire(): () => void {
    this.refCount += 1;
    this.ensureConnected();

    return () => {
      this.refCount = Math.max(0, this.refCount - 1);
      if (this.refCount === 0) {
        this.clearReconnectTimer();
        this.socket?.close();
        this.socket = null;
        this.queue = [];
      }
    };
  }

  subscribe(listener: (message: WsIncomingMessage) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeConnection(listener: (event: ConnectionEvent) => void): () => void {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  isOpen(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  send(message: WsOutgoingMessage): void {
    const payload = JSON.stringify(message);
    this.ensureConnected();

    if (this.isOpen()) {
      this.socket?.send(payload);
      return;
    }

    this.queue.push(payload);
  }

  private ensureConnected(): void {
    if (this.refCount === 0) return;
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) return;

    this.clearReconnectTimer();
    const socket = new WebSocket(getWsUrl());
    this.socket = socket;

    socket.addEventListener("open", () => {
      this.connectionListeners.forEach((listener) => listener("open"));

      if (this.queue.length) {
        this.queue.forEach((item) => socket.send(item));
        this.queue = [];
      }
    });

    socket.addEventListener("message", (event) => {
      const parsed = safeParseIncomingMessage(event.data);
      if (!parsed) return;

      this.listeners.forEach((listener) => listener(parsed));
    });

    socket.addEventListener("error", () => {
      this.connectionListeners.forEach((listener) => listener("error"));
    });

    socket.addEventListener("close", () => {
      this.connectionListeners.forEach((listener) => listener("close"));
      if (this.socket === socket) {
        this.socket = null;
      }

      if (this.refCount > 0) {
        this.reconnectTimer = window.setTimeout(() => {
          this.ensureConnected();
        }, 1000);
      }
    });
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer === null) return;
    window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }
}

export const wsClient = new WsClient();
