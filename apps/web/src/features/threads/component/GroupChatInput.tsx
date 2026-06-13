import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Swapped to Textarea for rich code text entry
import { socket } from "@/shared/lib/socket/socket.client";
import { Code2, Send } from "lucide-react";
import { useState } from "react";

interface GroupChatInputProps {
  groupId: string;
}

interface ChatFormProps {
  groupId: string;
}

const ChatForm = ({ groupId }: ChatFormProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSend = () => {
    if (!title.trim() && !content.trim()) return;

    const currentTitle = title;
    const currentContent = content;

    setTitle("");
    setContent("");

    socket.emit(
      "chat:send",
      { title: currentTitle, content: currentContent, groupId },
      (response) => {
        if (!response?.success) {
          setTitle(currentTitle);
          setContent(currentContent);
        }
      },
    );
  };

  const handleSaveOnEnter = (e: React.KeyboardEvent) => {
    // Send on Enter, allow multi-line shift entries for writing functions
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div>
      <div className="flex items-center pb-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleSaveOnEnter}
          placeholder="Post Title (optional)..."
          className="h-8 border-2 bg-transparent px-2 font-medium text-xs text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-offset-0"
        />
      </div>
      <div className="relative flex-1">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleSaveOnEnter}
          placeholder="Paste raw code or type a message..."
          className="w-full min-h-22.5 max-h-80 border-2 bg-transparent p-4 font-mono text-xs text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-offset-0 resize-none leading-relaxed selection:bg-zinc-800"
        />
      </div>
      <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-900 bg-zinc-900/10 text-[11px] text-zinc-500 font-mono select-none">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Code2 className="w-3.5 h-3.5 text-zinc-500" />
          <span>Auto-detects syntax</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-zinc-600 text-[10px]">
            Shift + Enter for new line
          </span>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!title.trim() && !content.trim()}
            className="h-7 w-7 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-600 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const GroupChatInput = ({ groupId }: GroupChatInputProps) => {
  return (
    <div className="px-4 py-3 border-t border-border bg-background">
      <ChatForm groupId={groupId} />
    </div>
  );
};
