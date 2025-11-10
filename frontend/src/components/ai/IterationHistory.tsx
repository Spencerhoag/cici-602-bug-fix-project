"use client";

import { Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Iteration } from "@/lib/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface IterationHistoryProps {
  iterations: Iteration[];
  selectedIterationId?: string;
  onSelectIteration?: (iteration: Iteration) => void;
}

export function IterationHistory({
  iterations,
  selectedIterationId,
  onSelectIteration,
}: IterationHistoryProps) {
  const getStatusIcon = (status: Iteration["status"]) => {
    switch (status) {
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  if (iterations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Iteration History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No iterations yet. Start the AI to begin.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Iteration History ({iterations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-2">
            {iterations.map((iteration) => (
              <div
                key={iteration.id}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent",
                  selectedIterationId === iteration.id && "bg-accent border-primary"
                )}
                onClick={() => onSelectIteration?.(iteration)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(iteration.status)}
                    <span className="font-medium text-sm">
                      Iteration {iteration.number}
                    </span>
                  </div>
                  {iteration.exitCode !== undefined && (
                    <Badge
                      variant={iteration.exitCode === 0 ? "success" : "destructive"}
                      className="text-xs"
                    >
                      Exit {iteration.exitCode}
                    </Badge>
                  )}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {format(new Date(iteration.startedAt), "MMM d, yyyy HH:mm")}
                </div>
                {iteration.changes.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {iteration.changes.length} file{iteration.changes.length !== 1 ? "s" : ""} changed
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
