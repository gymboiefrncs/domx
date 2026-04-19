import {
  wsClient,
  type WsIncomingMessage,
  type WsOutgoingMessage,
} from "@/shared/lib/ws/wsClient";

export type ChatIncomingMessage = WsIncomingMessage;

export type PostSocketHandlers = {
  onOpen?: () => void;
  onMessage?: (message: ChatIncomingMessage) => void;
  onClose?: () => void;
  onError?: () => void;
};

export const connectPostSocket = (
  handlers: PostSocketHandlers,
): (() => void) => {
  const release = wsClient.acquire();
  const unsubscribeMessage = wsClient.subscribe((message) => {
    handlers.onMessage?.(message);
  });

  const unsubscribeConnection = wsClient.subscribeConnection((event) => {
    if (event === "open") {
      handlers.onOpen?.();
      return;
    }
    if (event === "close") {
      handlers.onClose?.();
      return;
    }
    handlers.onError?.();
  });

  if (wsClient.isOpen()) {
    handlers.onOpen?.();
  }

  return () => {
    unsubscribeMessage();
    unsubscribeConnection();
    release();
  };
};

export const isPostSocketConnected = (): boolean => wsClient.isOpen();

export const joinPostGroup = (groupId: string): void => {
  wsClient.send({
    type: "joinGroup",
    payload: { groupId },
  } satisfies WsOutgoingMessage);
};

export const sendPostMessage = (payload: {
  title: string;
  body: string;
}): void => {
  wsClient.send({
    type: "sendMessage",
    payload,
  } satisfies WsOutgoingMessage);
};

export const sendEditPostMessage = (payload: {
  postId: string;
  title: string;
  body: string;
}): void => {
  wsClient.send({
    type: "editMessage",
    payload,
  } satisfies WsOutgoingMessage);
};

export const sendDeletePostMessage = (payload: { postId: string }): void => {
  wsClient.send({
    type: "deleteMessage",
    payload,
  } satisfies WsOutgoingMessage);
};
