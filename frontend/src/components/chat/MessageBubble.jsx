import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, User, Bot } from 'lucide-react';
import { cn } from '../../lib/utils';

const CodeBlock = ({ language, children }) => {
  const [copied, setCopied] = React.useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="code-block relative group my-4">
      <div className="flex items-center justify-between bg-[#2d2d30] px-4 py-2 text-xs">
        <span className="text-muted-foreground font-mono">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground transition-colors"
          data-testid="copy-code-btn"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: '#1e1e20',
          fontSize: '0.875rem'
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

export const MessageBubble = ({ message, isUser }) => {
  const components = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      
      if (!inline && language) {
        return <CodeBlock language={language}>{String(children).replace(/\n$/, '')}</CodeBlock>;
      }
      
      return (
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary" {...props}>
          {children}
        </code>
      );
    },
    pre({ children }) {
      return <>{children}</>;
    },
    p({ children }) {
      return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
    },
    ul({ children }) {
      return <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>;
    },
    ol({ children }) {
      return <ol className="list-decimal pl-6 mb-3 space-y-1">{children}</ol>;
    },
    h1({ children }) {
      return <h1 className="text-xl font-heading font-semibold mb-3 mt-4">{children}</h1>;
    },
    h2({ children }) {
      return <h2 className="text-lg font-heading font-semibold mb-2 mt-3">{children}</h2>;
    },
    h3({ children }) {
      return <h3 className="text-base font-heading font-semibold mb-2 mt-3">{children}</h3>;
    },
    blockquote({ children }) {
      return (
        <blockquote className="border-l-2 border-primary pl-4 my-3 text-muted-foreground italic">
          {children}
        </blockquote>
      );
    },
    a({ href, children }) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          {children}
        </a>
      );
    },
    table({ children }) {
      return (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full border border-border rounded-md">{children}</table>
        </div>
      );
    },
    th({ children }) {
      return <th className="bg-muted px-4 py-2 text-left font-semibold border-b border-border">{children}</th>;
    },
    td({ children }) {
      return <td className="px-4 py-2 border-b border-border">{children}</td>;
    }
  };
  
  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        isUser ? "flex-row-reverse" : ""
      )}
      data-testid={isUser ? "user-message" : "ai-message"}
    >
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser ? "bg-primary" : "bg-muted border border-border"
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-primary" />
        )}
      </div>
      
      <div className={cn(
        "max-w-[80%] px-4 py-3",
        isUser ? "chat-bubble-user" : "chat-bubble-ai"
      )}>
        {isUser ? (
          <p className="leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown components={components}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export const TypingIndicator = () => (
  <div className="flex gap-3 animate-fade-in" data-testid="typing-indicator">
    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted border border-border">
      <Bot className="w-4 h-4 text-primary" />
    </div>
    <div className="chat-bubble-ai px-4 py-3">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-primary rounded-full animate-typing"></span>
        <span className="w-2 h-2 bg-primary rounded-full animate-typing animate-delay-100"></span>
        <span className="w-2 h-2 bg-primary rounded-full animate-typing animate-delay-200"></span>
      </div>
    </div>
  </div>
);

