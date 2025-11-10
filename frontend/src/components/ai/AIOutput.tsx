"use client";

import { Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Iteration } from "@/lib/types";

interface AIOutputProps {
  iteration: Iteration;
}

export function AIOutput({ iteration }: AIOutputProps) {
  const getStatusColor = (status: Iteration["status"]) => {
    switch (status) {
      case "running":
        return "warning";
      case "completed":
        return "success";
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5" />
            AI Reasoning - Iteration {iteration.number}
          </CardTitle>
          <Badge variant={getStatusColor(iteration.status)}>
            {iteration.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-foreground whitespace-pre-wrap">{iteration.reasoning}</p>
        </div>

        {iteration.changes.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">
              Changes ({iteration.changes.length} file{iteration.changes.length !== 1 ? "s" : ""})
            </div>
            <div className="space-y-1">
              {iteration.changes.map((change) => (
                <div
                  key={change.id}
                  className="text-sm text-muted-foreground flex items-center gap-2"
                >
                  <span className="font-mono text-xs">{change.filePath}</span>
                  {change.accepted !== undefined && (
                    <Badge variant={change.accepted ? "success" : "destructive"} className="text-xs">
                      {change.accepted ? "Accepted" : "Rejected"}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
