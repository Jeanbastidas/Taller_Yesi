import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface Props {
  text: string;
}

export function SimpleMarkdown({ text }: Props) {
  return (
    <div className="markdown-body prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
          code: ({ children }) => (
            <code className="bg-white/10 px-1 rounded text-brand-accent font-mono text-[10px]">
              {children}
            </code>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
