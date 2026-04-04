import type { ChatSocket } from "@api/features/posts/post.types.js";
import * as jose from "jose";
import type { IncomingMessage } from "node:http";
import { config } from "../config.js";
import cookie from "cookie";
const accessSecret = new TextEncoder().encode(config.jwt.accessTokenSecret);

export const authenticateWs = async (
  socket: ChatSocket,
  req: IncomingMessage,
) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.accessToken;

    if (!token) return false;
    const { payload } = await jose.jwtVerify(token, accessSecret);
    const userId = payload.userId;
    if (typeof userId !== "string") {
      return false;
    }

    socket.userId = userId;
    return true;
  } catch {
    return false;
  }
};
