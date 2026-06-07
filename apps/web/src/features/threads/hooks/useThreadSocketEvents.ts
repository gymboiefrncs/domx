import { socket } from "@/shared/lib/socket/socket.client";
import type { ChatResponsePayload } from "@domx/shared";

import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { threadsQueryOptions } from "../queries";
import { groupsQueryOptions } from "@/features/groups/queries";
import { meQueryOptions } from "@/features/profile/queries";

export const useThreadSocketEvents = () => {
  const queryClient = useQueryClient();
  /**
   * strict: false because this hook is mounted globally.
   * we dont want it to throw error when the route params are not present in the url
   */
  const { id: activeGroupId } = useParams({ strict: false });

  /**
   * use ref to store the activeGroupId instead of putting it in the dependency array
   * to avoid re-subscribing to the socket events every time the activeGroupId changes
   */
  const activeGroupIdRef = useRef(activeGroupId);
  useEffect(() => {
    activeGroupIdRef.current = activeGroupId;
  });

  useEffect(() => {
    const errorCallback = ({ message }: { message: string }) => {
      toast.error(message);
    };

    const handleChatReceived = (payload: ChatResponsePayload) => {
      const {
        data: { message },
        by,
      } = payload;

      const currentGroupId = activeGroupIdRef.current;

      if (payload.type === "added") {
        const me = queryClient.getQueryData(meQueryOptions.queryKey);
        const isOwnMesage = by === me?.id;
        const isViewingGroup = currentGroupId === message.group_id;
        if (!isViewingGroup && !isOwnMesage) {
          queryClient.setQueryData(groupsQueryOptions.queryKey, (oldGroups) =>
            oldGroups?.map((group) =>
              group.group_id === message.group_id
                ? { ...group, unread_count: group.unread_count + 1 }
                : group,
            ),
          );
        }

        queryClient.setQueryData(
          threadsQueryOptions(message.group_id).queryKey,
          (oldThread) =>
            oldThread ? [...oldThread, payload.data.message] : undefined,
        );
      }
      if (payload.type === "edited") {
        queryClient.setQueryData(
          threadsQueryOptions(message.group_id).queryKey,
          (oldThread) =>
            oldThread?.map((thread) =>
              thread.id === payload.data.message.id
                ? payload.data.message
                : thread,
            ),
        );
      }
      if (payload.type === "deleted") {
        queryClient.setQueryData(
          threadsQueryOptions(message.group_id).queryKey,
          (oldThread) => {
            return oldThread?.filter(
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
  }, [queryClient]);
};
