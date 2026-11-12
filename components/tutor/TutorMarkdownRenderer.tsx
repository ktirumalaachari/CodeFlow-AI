"use client";

import * as React from "react";
import { Check, Copy, Terminal } from "lucide-react";

interface TutorMarkdownRendererProps {
  content: string;
}

function renderInlineFormatting(text: string): React.ReactNode[] {
  // Split by inline code `...` or bold **...**
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith("`") && token.endsWith("`") && token.length >= 2) {
      return (
        <code
          key={idx}
          className="rounded border border-border-subtle bg-surface-code px-1.5 py-0.5 font-mono text-[11px] text-primary"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith("**") && token.endsWith("**") && token.length >= 4) {
      return (
        <strong key={idx} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{token}</React.Fragment>;
  });
}

function CodeBlockSnippet({
  language,
  code,
}: {
  language: string;
  code: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className="my-2 overflow-hidden rounded-lg border border-border bg-surface-code">
      <div className="flex items-center justify-between border-b border-border-subtle bg-surface-2/70 px-2.5 py-1 text-[10px] font-mono text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Terminal className="h-3 w-3 text-primary" />
          <span>{language || "python"}</span>
          <span className="text-subtle-foreground">· read-only suggestion</span>
        </span>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="h-2.5 w-2.5 text-accent-emerald" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-2.5 w-2.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-2.5 font-mono text-[11px] leading-relaxed text-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function TutorMarkdownRenderer({ content }: TutorMarkdownRendererProps) {
  const blocks = React.useMemo(() => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.filter(Boolean);
  }, [content]);

  return (
    <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
      {blocks.map((block, bIdx) => {
        if (block.startsWith("```") && block.endsWith("```")) {
          const inner = block.slice(3, -3);
          const firstNewline = inner.indexOf("\n");
          const lang =
            firstNewline >= 0 ? inner.slice(0, firstNewline).trim() : "python";
          const codeBody =
            firstNewline >= 0 ? inner.slice(firstNewline + 1).trimEnd() : inner;
          return (
            <CodeBlockSnippet key={bIdx} language={lang} code={codeBody} />
          );
        }

        const lines = block.split("\n");
        const elements: React.ReactNode[] = [];
        let listItems: string[] = [];

        const flushList = (keyPrefix: string) => {
          if (listItems.length === 0) return;
          elements.push(
            <ul
              key={`${keyPrefix}-ul`}
              className="ml-4 list-disc space-y-1 text-xs text-muted-foreground"
            >
              {listItems.map((item, i) => (
                <li key={i} className="leading-relaxed">
                  {renderInlineFormatting(item)}
                </li>
              ))}
            </ul>
          );
          listItems = [];
        };

        lines.forEach((rawLine, lIdx) => {
          const line = rawLine.trim();
          if (!line) {
            flushList(`${bIdx}-${lIdx}`);
            return;
          }

          if (line.startsWith("### ")) {
            flushList(`${bIdx}-${lIdx}`);
            elements.push(
              <h4
                key={`${bIdx}-${lIdx}-h4`}
                className="pt-1 text-xs font-semibold tracking-tight text-foreground"
              >
                {renderInlineFormatting(line.slice(4))}
              </h4>
            );
            return;
          }

          if (line.startsWith("## ")) {
            flushList(`${bIdx}-${lIdx}`);
            elements.push(
              <h3
                key={`${bIdx}-${lIdx}-h3`}
                className="pt-1 text-xs font-bold tracking-tight text-foreground"
              >
                {renderInlineFormatting(line.slice(3))}
              </h3>
            );
            return;
          }

          if (line.startsWith("- ") || line.startsWith("* ")) {
            listItems.push(line.slice(2));
            return;
          }

          const numberedMatch = line.match(/^\d+\.\s+(.*)$/);
          if (numberedMatch) {
            listItems.push(numberedMatch[1]);
            return;
          }

          flushList(`${bIdx}-${lIdx}`);
          elements.push(
            <p key={`${bIdx}-${lIdx}-p`} className="leading-relaxed">
              {renderInlineFormatting(line)}
            </p>
          );
        });

        flushList(`${bIdx}-end`);
        return <React.Fragment key={bIdx}>{elements}</React.Fragment>;
      })}
    </div>
  );
}

