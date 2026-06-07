import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import { RateLimitError, UnauthorizedError } from "./shared/error.js";
import cookie from "cookie";
import * as jose from "jose";
import { config } from "./shared/config.js";
import { registerGroupHandlers } from "./features/groups/ws/group.handlers.js";
import { wsConnectionLimiter } from "./shared/middlewares/rateLimit.js";
import type { ClientToServerEvents, ServerToClientEvents } from "@domx/shared";
import { getUserGroups } from "./features/groups/group.services.js";
import { app } from "./app.js";
import { registerThreadHandlers } from "./features/threads/ws/thread.handlers.js";

const server = http.createServer(app);
const accessSecret = new TextEncoder().encode(config.jwt.accessTokenSecret);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  },
});

io.use(async (socket, next) => {
  try {
    const rawCookie = socket.handshake.headers.cookie;

    if (!rawCookie) {
      return next(new UnauthorizedError("Invalid or expired token"));
    }

    const cookies = cookie.parse(rawCookie);
    const token = cookies.accessToken;

    if (!token) {
      return next(new UnauthorizedError("Invalid or expired token"));
    }

    const { payload } = await jose.jwtVerify(token, accessSecret);

    const userId = payload.userId;

    if (typeof userId !== "string") {
      return next(new UnauthorizedError("Invalid token payload"));
    }

    socket.data.user = { id: userId };

    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
});

io.use(async (socket, next) => {
  try {
    await wsConnectionLimiter.consume(socket.data.user.id);
    next();
  } catch {
    next(
      new RateLimitError(
        "Too many connection attempts. Please try again later.",
      ),
    );
  }
});

io.on("connection", async (socket) => {
  /**
   * Join a private room for the user to receive direct messages.
   * This also handles multiple tabs open, since all their connections end up in the same room.
   */
  socket.join(socket.data.user.id);

  const groups = await getUserGroups(socket.data.user.id);
  groups.forEach((group) => socket.join(group.group_id));

  registerGroupHandlers(io, socket);
  registerThreadHandlers(io, socket);
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
