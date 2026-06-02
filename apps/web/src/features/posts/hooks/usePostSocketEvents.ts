import { socket } from "@/shared/lib/socket/socket.client";
import type {
  ChatResponsePayload,
  Group,
  PostDetails,
  User,
} from "@domx/shared";

import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

export const usePostSocketEvents = () => {
  const queryClient = useQueryClient();
  /**
   * strict: false because this hook is mounted globally.
   * we dont want it to throw error when the route params are not present in the url
   */
  const { id: activeGroupId } = useParams({ strict: false });

  useEffect(() => {
    const errorCallback = ({ message }: { message: string }) => {
      toast.error(message);
    };

    const handleChatReceived = (payload: ChatResponsePayload) => {
      const {
        data: { message },
        by,
      } = payload;
      if (payload.type === "added") {
        const me = queryClient.getQueryData<User>(["profile", "me"]);
        const isOwnMesage = by === me?.id;
        const isViewingGroup = activeGroupId === message.group_id;
        if (!isViewingGroup && !isOwnMesage) {
          queryClient.setQueryData(["groups"], (oldGroups: Group[]) => {
            return oldGroups.map((group) =>
              group.group_id === message.group_id
                ? { ...group, unread_count: group.unread_count + 1 }
                : group,
            );
          });
        }

        queryClient.setQueryData(
          ["posts", message.group_id],
          (oldData: PostDetails[]) => {
            return [...oldData, payload.data.message];
          },
        );
      }
      if (payload.type === "edited") {
        queryClient.setQueryData(
          ["posts", message.group_id],
          (oldData: PostDetails[]) => {
            return oldData.map((post) =>
              post.id === payload.data.message.id ? payload.data.message : post,
            );
          },
        );
      }
      if (payload.type === "deleted") {
        queryClient.setQueryData(
          ["posts", message.group_id],
          (oldData: PostDetails[]) => {
            return oldData.filter(
              (post) => post.id !== payload.data.message.id,
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
  }, [queryClient, activeGroupId]);
};
