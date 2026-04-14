import { SendIcon } from "@/shared/assets/icons";
import type React from "react";

type ChatComposerProps = {
  post: string;
  title: string;
  isFocused: boolean;
  loading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onPostChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onTitleChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onFocus: () => void;
  onBlurArea: (e: React.FocusEvent<HTMLDivElement>) => void;
  onSend: () => void;
};

export const ChatComposer = ({
  post,
  title,
  isFocused,
  loading,
  textareaRef,
  onPostChange,
  onTitleChange,
  onKeyDown,
  onFocus,
  onBlurArea,
  onSend,
}: ChatComposerProps) => (
  <div
    className="sticky bottom-0 z-10 shrink-0 border-t border-border-subtle bg-neutral-50/95 px-4 py-3 backdrop-blur-sm"
    onBlur={onBlurArea}
  >
    <div className="mx-auto w-full max-w-4xl">
      <div className="animate-soft-pop flex flex-col gap-1 rounded-2xl bg-white/95 px-3 py-2 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.65)] ring-1 ring-black/5 transition-all duration-200 focus-within:-translate-y-0.5 focus-within:shadow-[0_16px_30px_-20px_rgba(15,23,42,0.6)] md:px-4 md:py-3">
        {isFocused && (
          <textarea
            placeholder="Title"
            required
            value={title}
            onKeyDown={onKeyDown}
            onChange={(e) => onTitleChange(e.target.value)}
            rows={1}
            className="w-full resize-none bg-transparent text-sm font-medium text-text placeholder:text-text-muted outline-none md:text-base"
          />
        )}

        <div className="h-px bg-border" />

        <textarea
          placeholder="Start with ```(language)"
          value={post}
          onChange={onPostChange}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          ref={textareaRef}
          rows={1}
          className="w-full min-h-10 max-h-40 resize-none overflow-y-auto bg-transparent text-sm text-text placeholder:text-xs placeholder:text-text-muted outline-none md:max-h-48 md:text-base"
        />

        {isFocused && (
          <div className="flex justify-end pt-1">
            <button
              className="btn btn-primary animate-soft-pop flex h-9 w-9 items-center justify-center rounded-full p-0 transition-transform duration-200 hover:scale-105 active:scale-95"
              onClick={onSend}
              disabled={loading}
            >
              <SendIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);
