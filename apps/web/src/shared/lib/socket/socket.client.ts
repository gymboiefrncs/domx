import type { ClientToServerEvents, ServerToClientEvents } from "@domx/shared";
import { io, Socket } from "socket.io-client";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  "http://localhost:8080",
  {
    autoConnect: false,
    withCredentials: true,
  },
);
