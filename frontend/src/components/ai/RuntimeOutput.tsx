"use client";

import { Terminal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface RuntimeOutputProps {
  output: string;
  exitCode?: number;
  isRunning?: boolean;
}

export function RuntimeOutput({ output, exitCode, isRunning }: RuntimeOutputProps) {
  const getExitCodeBadge = () => {
    if (isRunning) {
      return <Badge variant="warning">Running...</Badge>;
    }
    if (exitCode === undefined) {
      return null;
    }
    return (
      <Badge variant={exitCode === 0 ? "success" : "destructive"}>
        Exit Code: {exitCode}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Terminal className="h-5 w-5" />
            Runtime Output
          </CardTitle>
          {getExitCodeBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <pre className="text-xs font-mono bg-muted p-4 rounded-lg whitespace-pre-wrap break-words">
            {output || "No output yet..."}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
