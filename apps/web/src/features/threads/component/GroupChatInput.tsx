import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { socket } from "@/shared/lib/socket/socket.client";
import { Send } from "lucide-react";
import { useState } from "react";

interface GroupChatInputProps {
  groupId: string;
  username?: string;
  displayId?: string;
  userId?: string;
}

export const GroupChatInput = ({ groupId }: GroupChatInputProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSaveOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!title.trim() && !content.trim()) return;

    setTitle("");
    setContent("");

    socket.emit("chat:send", { title, content, groupId }, (response) => {
      if (!response.success) {
        setTitle(title);
        setContent(content);
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
            onKeyDown={handleSaveOnEnter}
            placeholder="Title"
            className="border-0 border-b border-border rounded-none bg-transparent font-medium focus-visible:ring-0 text-sm"
          />
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleSaveOnEnter}
            placeholder="Write a message..."
            className="border-0 rounded-none bg-transparent focus-visible:ring-0 text-sm"
          />
        </div>
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!title.trim() && !content.trim()}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
