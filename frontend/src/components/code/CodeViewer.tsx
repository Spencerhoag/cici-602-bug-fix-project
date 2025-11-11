"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCode } from "lucide-react";
import { FileNode } from "@/lib/types";

interface CodeViewerProps {
  file: FileNode;
}

const getLanguageFromExtension = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    py: "python",
    java: "java",
    js: "javascript",
    ts: "typescript",
    jsx: "jsx",
    tsx: "tsx",
    json: "json",
    md: "markdown",
    yaml: "yaml",
    yml: "yaml",
    sh: "bash",
    txt: "text",
  };
  return languageMap[ext || ""] || "text";
};

export function CodeViewer({ file }: CodeViewerProps) {
  const language = file.language || getLanguageFromExtension(file.name);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileCode className="h-5 w-5" />
          {file.path}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {file.content ? (
          <div className="rounded-lg overflow-hidden border">
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: "1rem",
                background: "hsl(var(--card))",
              }}
              showLineNumbers
              wrapLines
            >
              {file.content}
            </SyntaxHighlighter>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No content available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
