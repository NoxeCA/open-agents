"use client";

import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

type Props = {
  text: string;
  className?: string;
};

function MarkdownTable({
  className,
  ...props
}: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="my-4 overflow-x-auto">
      <table
        className={cn(
          "w-full min-w-max border-collapse text-sm [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted/60 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function MarkdownLink({
  className,
  href,
  ...props
}: ComponentPropsWithoutRef<"a">) {
  const isExternal =
    typeof href === "string" &&
    (href.startsWith("http://") || href.startsWith("https://"));

  return (
    <a
      className={cn("underline underline-offset-2", className)}
      href={href}
      rel={isExternal ? "noreferrer noopener" : undefined}
      target={isExternal ? "_blank" : undefined}
      {...props}
    />
  );
}

function MarkdownCode({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"code">) {
  const codeText = String(children);
  const isBlock = codeText.includes("\n");

  return (
    <code
      className={cn(
        "font-mono text-[12px]",
        isBlock
          ? "bg-transparent px-0 py-0"
          : "rounded-md bg-muted px-1.5 py-0.5",
        className,
      )}
      {...props}
    >
      {children}
    </code>
  );
}

function MarkdownPre({
  className,
  ...props
}: ComponentPropsWithoutRef<"pre">) {
  return (
    <pre
      className={cn(
        "my-4 overflow-x-auto rounded-xl border border-border/60 bg-muted/70 p-4",
        className,
      )}
      {...props}
    />
  );
}

export function MarkdownMessage({ text, className }: Props) {
  return (
    <div
      className={cn(
        "min-w-0 break-words text-[13px] leading-[1.65] [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_h1]:mt-6 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-semibold [&_hr]:my-5 [&_hr]:border-border [&_li]:mt-1.5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-0 [&_p:not(:first-child)]:mt-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6",
        className,
      )}
    >
      <ReactMarkdown
        components={{
          a: MarkdownLink,
          code: MarkdownCode,
          pre: MarkdownPre,
          table: MarkdownTable,
        }}
        remarkPlugins={[remarkGfm]}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
