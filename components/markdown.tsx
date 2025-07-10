import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  const components = {
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <pre
          {...props}
          className={`${className} text-sm w-full max-w-full overflow-x-auto bg-gray-100 p-4 rounded-xl mt-4 mb-4 border border-gray-200 font-mono`}
        >
          <code className={match[1]}>{children}</code>
        </pre>
      ) : (
        <code
          className={`${className} text-sm bg-gray-100 text-gray-800 py-1 px-2 rounded-md font-mono`}
          {...props}
        >
          {children}
        </code>
      );
    },
    h1: ({ node, children, ...props }: any) => {
      return (
        <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-4 leading-tight font-['Inter',_'system-ui',_sans-serif]" {...props}>
          {children}
        </h1>
      );
    },
    h2: ({ node, children, ...props }: any) => {
      return (
        <h2 className="text-xl font-bold text-gray-900 mt-5 mb-3 leading-tight font-['Inter',_'system-ui',_sans-serif]" {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ node, children, ...props }: any) => {
      return (
        <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-3 leading-tight font-['Inter',_'system-ui',_sans-serif]" {...props}>
          {children}
        </h3>
      );
    },
    p: ({ node, children, ...props }: any) => {
      return (
        <p className="text-gray-700 leading-relaxed mb-4 font-['Inter',_'system-ui',_sans-serif] text-base" {...props}>
          {children}
        </p>
      );
    },
    ol: ({ node, children, ...props }: any) => {
      return (
        <ol className="list-decimal list-outside ml-6 mb-5 space-y-2" {...props}>
          {children}
        </ol>
      );
    },
    ul: ({ node, children, ...props }: any) => {
      return (
        <ul className="list-disc list-outside ml-6 mb-5 space-y-2" {...props}>
          {children}
        </ul>
      );
    },
    li: ({ node, children, ...props }: any) => {
      return (
        <li className="text-gray-700 leading-relaxed font-['Inter',_'system-ui',_sans-serif] text-base" {...props}>
          {children}
        </li>
      );
    },
    strong: ({ node, children, ...props }: any) => {
      return (
        <strong className="font-bold text-gray-900 font-['Inter',_'system-ui',_sans-serif]" {...props}>
          {children}
        </strong>
      );
    },
    em: ({ node, children, ...props }: any) => {
      return (
        <em className="italic text-gray-800 font-['Inter',_'system-ui',_sans-serif]" {...props}>
          {children}
        </em>
      );
    },
    blockquote: ({ node, children, ...props }: any) => {
      return (
        <blockquote className="border-l-4 border-blue-500 pl-4 py-3 my-4 bg-blue-50 rounded-r-lg font-['Inter',_'system-ui',_sans-serif]" {...props}>
          {children}
        </blockquote>
      );
    },
    a: ({ node, children, href, ...props }: any) => {
      return (
        <a 
          href={href}
          className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-500 transition-colors font-medium font-['Inter',_'system-ui',_sans-serif]"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      );
    },
  };

  return (
    <div className="prose prose-base max-w-none antialiased">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
};

export const Markdown = React.memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);
