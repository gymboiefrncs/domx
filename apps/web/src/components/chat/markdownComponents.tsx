import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

const MARKDOWN_COMPONENTS: Components = {
  p: ({ children }) => (
    <p className="wrap-break-word mb-2 whitespace-pre-wrap text-sm text-text-muted last:mb-0 md:text-base">
      {children}
    </p>
  ),
  pre: ({ children }) => (
    <pre className="my-2 max-w-full overflow-x-auto whitespace-pre rounded-lg text-xs leading-5 md:text-sm">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-2 max-w-full overflow-x-auto">
      <table className="w-full min-w-max border-collapse text-left text-xs md:text-sm">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-border px-2 py-1 font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-border px-2 py-1">{children}</td>
  ),
  img: ({ alt, src }) => (
    <img
      src={src ?? ""}
      alt={alt ?? ""}
      className="h-auto max-w-full rounded-md"
    />
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className?.includes("language-"));
    if (isBlock) {
      return (
        <code
          className={`${className} block min-w-0 whitespace-pre`}
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <code
        className="wrap-break-word rounded bg-neutral-200/80 px-1 py-0.5 text-xs text-neutral-900"
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
