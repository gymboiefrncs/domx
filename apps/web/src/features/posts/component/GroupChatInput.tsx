import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient } from "@/shared/lib/queryClient";
import { socket } from "@/shared/lib/socket/socket.client";
import type { PostDetails } from "@domx/shared";
import { Send } from "lucide-react";
import { useState } from "react";

interface GroupChatInputProps {
  groupId: string;
  username?: string;
  displayId?: string;
  userId?: string;
}

export const GroupChatInput = ({
  groupId,
  username,
  displayId,
  userId,
}: GroupChatInputProps) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const handleSend = () => {
    if (!title.trim() && !body.trim()) return;

    const optimisticPost: PostDetails = {
      username: username || "",
      display_id: displayId || "",
      id: crypto.randomUUID(),
      title,
      body,
      group_id: groupId,
      user_id: userId || "someid",
      created_at: new Date(),
      updated_at: new Date(),
    }; // for optimistic update - this will be replaced by the actual post from the server

    queryClient.setQueryData(["posts", groupId], (oldData: PostDetails[]) => {
      return [...oldData, optimisticPost];
    });

    setTitle("");
    setBody("");

    socket.emit("chat:send", { title, body, groupId }, (response) => {
      // Debug: log response from server
      console.log("[GroupChatInput] chat:send response:", response);
      /**
       * remove optimistic post no matter what (success or failure) because:
       * - on success, it will be replaced by the actual post from the server via the "chat:received" event.
       * keeping it will cause duplicate
       * - on failure, we want to remove the optimistic post and show an error toast (handled in usePostSocketEvents)
       */
      queryClient.setQueryData(
        ["posts", groupId],
        (oldMessage: PostDetails[] = []) =>
          oldMessage.filter((p) => p.id !== optimisticPost.id),
      );
      if (!response.success) {
        setTitle(title);
        setBody(body);
      }
    });
  };

  return (
    <div className="px-3 py-3 border-t border-border">
      <div className="flex items-end gap-2">
        <div className="flex-1 border border-border rounded-xl overflow-hidden bg-muted/40">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="border-0 border-b border-border rounded-none bg-transparent font-medium focus-visible:ring-0 text-sm"
          />
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a message..."
            className="border-0 rounded-none bg-transparent focus-visible:ring-0 text-sm"
          />
        </div>
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!title.trim() && !body.trim()}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
