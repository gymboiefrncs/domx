import { memo, useMemo } from "react";
import { CollapsibleCard } from "./CollapsibleCard";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

interface CodeBlockProps extends React.HTMLAttributes<HTMLElement> {
  languageLabel?: string;
  children: React.ReactNode;
}

const TextBlock = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="text-sm leading-7 text-zinc-400/90 whitespace-pre-wrap">
      {children}
    </div>
  );
};

const CodeBlock = ({
  className,
  languageLabel,
  children,
  ...props
}: CodeBlockProps) => {
  return (
    <CollapsibleCard
      className={className}
      languageLabel={languageLabel}
      {...props}
    >
      {children}
    </CollapsibleCard>
  );
};

export const MarkdownRenderer = memo(({ content }: { content: string }) => {
  const components = useMemo(
    () => ({
      code({ className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || "");
        const languageLabel = match ? match[1] : "code";

        return (
          <CodeBlock
            className={className}
            languageLabel={languageLabel}
            {...props}
          >
            {children}
          </CodeBlock>
        );
      },

      p({ children }: any) {
        return <TextBlock>{children}</TextBlock>;
      },
    }),
    [],
  );

  return (
    <ReactMarkdown rehypePlugins={[[rehypeHighlight]]} components={components}>
      {content}
    </ReactMarkdown>
  );
});
