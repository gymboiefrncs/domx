import "dotenv/config";
import { app } from "./app.js";
import http from "http";
import { WebSocketServer } from "ws";
import { authenticateWs } from "./shared/middlewares/authenticateWs.js";
import type { ChatSocket } from "./features/posts/index.js";

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const rooms = new Map<string, Set<ChatSocket>>();

wss.on("connection", async (socket: ChatSocket, req) => {
  const authenticate = await authenticateWs(socket, req);
  if (!authenticate) return socket.terminate();

  socket.on("message", async (data) => {
    try {
      const { type, payload } = JSON.parse(data.toString());
      // TODO: handle different types(join room, send message ...)
    } catch {
      socket.send(
        JSON.stringify({ type: "error", payload: "Invalid message format" }),
      );
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
