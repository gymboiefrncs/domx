import "dotenv/config";
import { app } from "./app.js";
import http from "http";
import { WebSocketServer } from "ws";
import { authenticateWs } from "./shared/middlewares/authenticateWs.js";
import type { ChatSocket } from "./features/posts/index.js";
import { handleChatMessage } from "./features/posts/post.routes.js";
import {
  handleGroupWsMessage,
  isGroupWsAction,
} from "./features/groups/group.ws.js";
import {
  getRetryAfterSeconds,
  wsConnectionLimiter,
} from "./shared/middlewares/rateLimit.js";

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const rooms = new Map<string, Set<ChatSocket>>();

wss.on("connection", async (socket: ChatSocket, req) => {
  const ipKey = req.socket.remoteAddress ?? "unknown";
  try {
    await wsConnectionLimiter.consume(ipKey);
  } catch (error) {
    const retryAfter = getRetryAfterSeconds(error);
    socket.send(
      JSON.stringify({
        type: "error",
        payload: "Too many WebSocket connections, try again later",
        retryAfter,
      }),
    );
    return socket.terminate();
  }

  const authenticate = await authenticateWs(socket, req);
  if (!authenticate) return socket.terminate();

  socket.on("message", async (data) => {
    let parsed: { type: string; payload: unknown };

    try {
      parsed = JSON.parse(data.toString()) as {
        type: string;
        payload: unknown;
      };
    } catch {
      socket.send(
        JSON.stringify({ type: "error", payload: "Invalid message format" }),
      );
      return;
    }

    try {
      if (isGroupWsAction(parsed.type)) {
        await handleGroupWsMessage(parsed.type, parsed.payload, socket, rooms);
      } else {
        await handleChatMessage(parsed.type, parsed.payload, socket, rooms);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected server error";
      socket.send(JSON.stringify({ type: "error", payload: message }));
    }
  });
  socket.on("close", () => {
    if (socket.groupId) {
      rooms.get(socket.groupId)?.delete(socket);
    }
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

process.on("SIGINT", () => {
  console.log("Shutting down server...");
  process.exit();
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
