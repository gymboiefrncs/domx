import { socket } from "@/shared/lib/socket/socket.client";
import type { ChatResponsePayload, PostDetails } from "@domx/shared";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

export const usePostSocketEvents = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const errorCallback = ({ message }: { message: string }) => {
      toast.error(message);
    };

    const handleChatReceived = (payload: ChatResponsePayload) => {
      const { group_id } = payload.data.message;
      if (payload.type === "added") {
        queryClient.setQueryData(
          ["posts", group_id],
          (oldData: PostDetails[]) => {
            return [...oldData, payload.data.message];
          },
        );
      }
      if (payload.type === "edited") {
        queryClient.setQueryData(
          ["posts", group_id],
          (oldData: PostDetails[]) => {
            return oldData.map((post) =>
              post.id === payload.data.message.id ? payload.data.message : post,
            );
          },
        );
      }
    };
    socket.on("chat:received", handleChatReceived);

    socket.on("chat:send:failed", errorCallback);
    return () => {
      socket.off("chat:received", handleChatReceived);
      socket.off("chat:send:failed", errorCallback);
    };
  }, [queryClient]);
};
