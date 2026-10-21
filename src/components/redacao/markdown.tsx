"use client";

import ReactMarkdown from "react-markdown";

/** Renderizador de markdown simples e seguro para respostas da IA. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-sm leading-relaxed space-y-2 break-words">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="text-sm leading-relaxed">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-4 space-y-1 text-sm">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 space-y-1 text-sm">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-secondary px-1 py-0.5 text-xs font-mono">
              {children}
            </code>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
