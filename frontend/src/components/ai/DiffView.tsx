"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeChange } from "@/lib/types";
import { FileCode } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DiffViewProps {
  changes: CodeChange[];
}

interface DiffLine {
  type: 'context' | 'addition' | 'deletion' | 'header';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

function parseDiff(diffText: string): DiffLine[] {
  const lines = diffText.split('\n');
  const result: DiffLine[] = [];
  let oldLineNum = 0;
  let newLineNum = 0;

  for (const line of lines) {
    if (line.startsWith('---') || line.startsWith('+++')) {
      result.push({ type: 'header', content: line });
    } else if (line.startsWith('@@')) {
      // Parse hunk header to get line numbers
      const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
      if (match) {
        oldLineNum = parseInt(match[1]) - 1;
        newLineNum = parseInt(match[2]) - 1;
      }
      result.push({ type: 'header', content: line });
    } else if (line.startsWith('+')) {
      newLineNum++;
      result.push({
        type: 'addition',
        content: line.substring(1),
        newLineNumber: newLineNum,
      });
    } else if (line.startsWith('-')) {
      oldLineNum++;
      result.push({
        type: 'deletion',
        content: line.substring(1),
        oldLineNumber: oldLineNum,
      });
    } else if (line.startsWith(' ')) {
      oldLineNum++;
      newLineNum++;
      result.push({
        type: 'context',
        content: line.substring(1),
        oldLineNumber: oldLineNum,
        newLineNumber: newLineNum,
      });
    } else if (line.trim() === '') {
      // Empty line
      oldLineNum++;
      newLineNum++;
      result.push({
        type: 'context',
        content: '',
        oldLineNumber: oldLineNum,
        newLineNumber: newLineNum,
      });
    }
  }

  return result;
}

function DiffLineComponent({ line }: { line: DiffLine }) {
  const getLineStyle = () => {
    switch (line.type) {
      case 'addition':
        return 'bg-green-500/10 border-l-2 border-green-500';
      case 'deletion':
        return 'bg-red-500/10 border-l-2 border-red-500';
      case 'header':
        return 'bg-muted/50 text-muted-foreground font-semibold';
      default:
        return 'hover:bg-muted/30';
    }
  };

  const getLinePrefix = () => {
    switch (line.type) {
      case 'addition':
        return <span className="text-green-500 font-bold">+</span>;
      case 'deletion':
        return <span className="text-red-500 font-bold">-</span>;
      default:
        return <span className="text-muted-foreground"> </span>;
    }
  };

  if (line.type === 'header') {
    return (
      <div className={`px-2 py-1 text-xs font-mono ${getLineStyle()}`}>
        {line.content}
      </div>
    );
  }

  return (
    <div className={`flex items-start ${getLineStyle()} transition-colors`}>
      {/* Line numbers */}
      <div className="flex-shrink-0 select-none px-2 py-1 text-xs font-mono text-muted-foreground w-20 text-right">
        <span className="inline-block w-8">
          {line.oldLineNumber || ''}
        </span>
        <span className="inline-block w-8">
          {line.newLineNumber || ''}
        </span>
      </div>

      {/* Line content */}
      <div className="flex-1 px-2 py-1 text-xs font-mono overflow-x-auto">
        <span className="mr-2">{getLinePrefix()}</span>
        <span className={line.type === 'deletion' ? 'text-red-500' : line.type === 'addition' ? 'text-green-500' : ''}>
          {line.content || ' '}
        </span>
      </div>
    </div>
  );
}

export function DiffView({ changes }: DiffViewProps) {
  const [selectedChangeId, setSelectedChangeId] = useState<string>(
    changes[0]?.id || ""
  );

  const selectedChange = changes.find((c) => c.id === selectedChangeId);

  if (changes.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No changes to display
        </CardContent>
      </Card>
    );
  }

  const diffLines = selectedChange ? parseDiff(selectedChange.diff) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileCode className="h-5 w-5" />
          Code Changes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* File selector */}
        {changes.length > 1 && (
          <div className="mb-4 flex gap-2 flex-wrap">
            {changes.map((change) => (
              <button
                key={change.id}
                onClick={() => setSelectedChangeId(change.id)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors font-mono ${
                  selectedChangeId === change.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {change.filePath}
              </button>
            ))}
          </div>
        )}

        {/* Diff display */}
        {selectedChange && (
          <div className="rounded-lg overflow-hidden border bg-card">
            {/* File header */}
            <div className="bg-muted px-4 py-2 text-sm font-mono border-b flex items-center justify-between">
              <span>{selectedChange.filePath}</span>
              {selectedChange.accepted !== undefined && (
                <span className={`text-xs px-2 py-1 rounded ${
                  selectedChange.accepted
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-red-500/20 text-red-500'
                }`}>
                  {selectedChange.accepted ? 'Accepted' : 'Rejected'}
                </span>
              )}
            </div>

            {/* Diff lines */}
            <ScrollArea className="max-h-[500px]">
              <div className="bg-card">
                {diffLines.map((line, index) => (
                  <DiffLineComponent key={index} line={line} />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
