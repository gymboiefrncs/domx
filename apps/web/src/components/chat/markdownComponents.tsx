import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

const MARKDOWN_COMPONENTS: Components = {
  p: ({ children }) => (
    <p className="mb-2 whitespace-pre-wrap text-sm text-text-muted last:mb-0 md:text-base">
      {children}
    </p>
  ),
  pre: ({ children }) => (
    <pre className="my-2 wrap-break-word overflow-x-hidden whitespace-pre-wrap rounded-lg text-xs leading-5 md:text-sm">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className?.includes("language-"));
    if (isBlock) {
      return (
        <code
          className={`${className} block whitespace-pre-wrap wrap-break-word`}
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <code
        className="rounded bg-neutral-200/80 px-1 py-0.5 text-xs text-neutral-900"
        {...props}
      >
        {children}
      </code>
    );
  },
};

type MarkdownBodyProps = {
  body: string;
};

export const MarkdownBody = ({ body }: MarkdownBodyProps) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
    components={MARKDOWN_COMPONENTS}
  >
    {body}
  </ReactMarkdown>
);
