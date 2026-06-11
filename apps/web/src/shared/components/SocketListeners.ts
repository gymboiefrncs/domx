import { useGroupSocketEvents } from "@/features/groups/hooks/useGroupSocketEvents";
import { useThreadSocketEvents } from "@/features/threads/hooks/useThreadSocketEvents";
import { useEffect } from "react";
import { socket } from "@/shared/lib/socket/socket.client";

export function SocketListener() {
  useGroupSocketEvents();
  useThreadSocketEvents();

  useEffect(() => {
    if (!socket.connected) socket.connect();
  }, []);

  return null;
}
