"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IssueMode } from "@/lib/types";

interface CreateIssueProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateIssue: (data: {
    title: string;
    description: string;
    mode: IssueMode;
    expectedOutput?: string;
    maxIterations: number;
  }) => void;
}

export function CreateIssue({ open, onOpenChange, onCreateIssue }: CreateIssueProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<IssueMode>("basic");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [maxIterations, setMaxIterations] = useState(5);

  const handleSubmit = () => {
    onCreateIssue({
      title,
      description,
      mode,
      expectedOutput: mode === "expected_output" ? expectedOutput : undefined,
      maxIterations,
    });
    // Reset form
    setTitle("");
    setDescription("");
    setMode("basic");
    setExpectedOutput("");
    setMaxIterations(5);
    onOpenChange(false);
  };

  const isFormValid = () => {
    if (!title) return false;
    if (mode === "expected_output") {
      return !!description && !!expectedOutput;
    }
    return true; // Basic mode only needs title
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Issue</DialogTitle>
          <DialogDescription>
            Describe the problem you want the AI to solve.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Issue Title</label>
            <Input
              placeholder="Fix syntax error"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                type="button"
                variant={mode === "basic" ? "default" : "outline"}
                onClick={() => setMode("basic")}
                className="h-auto py-3 justify-start text-left"
              >
                <div>
                  <div className="font-medium">Basic Syntax Fixing</div>
                  <div className="text-xs opacity-80 mt-1">
                    Automatically fix syntax and runtime errors
                  </div>
                </div>
              </Button>
              <Button
                type="button"
                variant={mode === "expected_output" ? "default" : "outline"}
                onClick={() => setMode("expected_output")}
                className="h-auto py-3 justify-start text-left"
              >
                <div>
                  <div className="font-medium">Expected Output</div>
                  <div className="text-xs opacity-80 mt-1">
                    Describe desired behavior
                  </div>
                </div>
              </Button>
            </div>
          </div>

          {mode === "expected_output" && (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe the issue in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Expected Output <span className="text-destructive">*</span>
                </label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe what you want the code to do in natural language..."
                  value={expectedOutput}
                  onChange={(e) => setExpectedOutput(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Max Iterations</label>
              <Input
                type="number"
                min="1"
                max="20"
                value={maxIterations}
                onChange={(e) => setMaxIterations(parseInt(e.target.value) || 1)}
                className="w-20 h-8 text-center"
              />
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={maxIterations}
              onChange={(e) => setMaxIterations(parseInt(e.target.value))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1</span>
              <span>20</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid()}
            className="w-full sm:w-auto"
          >
            Create Issue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
