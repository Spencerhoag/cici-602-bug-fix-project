"use client";

import { useState, useEffect } from "react";
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

interface EditIssueProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectFiles?: string[]; // List of file names in the project
  onEditIssue: (data: {
    title: string;
    description: string;
    mode: IssueMode;
    expectedOutput?: string;
    selectedFiles?: string[];
  }) => void;
  initialData?: {
    title: string;
    description: string;
    mode: IssueMode;
    expectedOutput?: string;
    selectedFiles?: string[];
  };
}

export function EditIssue({ open, onOpenChange, onEditIssue, projectFiles, initialData }: EditIssueProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<IssueMode>("basic");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [entryFile, setEntryFile] = useState<string>("");

  // Populate form with initial data when dialog opens
  useEffect(() => {
    if (open && initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setMode(initialData.mode || "basic");
      setExpectedOutput(initialData.expectedOutput || "");
      setEntryFile(initialData.selectedFiles?.[0] || "");
    }
  }, [open, initialData]);

  const handleSubmit = () => {
    onEditIssue({
      title,
      description,
      mode,
      expectedOutput: mode === "expected_output" ? expectedOutput : undefined,
      selectedFiles: entryFile ? [entryFile] : [],
    });
    onOpenChange(false);
  };

  const isFormValid = () => {
    if (!title) return false;
    if (!entryFile) return false; // Entry file is required
    if (mode === "expected_output") {
      return !!expectedOutput;
    }
    return true; // Basic mode only needs title and entry file
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Issue</DialogTitle>
          <DialogDescription>
            Update the issue details.
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
            <label className="text-sm font-medium mb-2 block">
              Entry Point File <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Select the main file to run (e.g., main.py). The AI will fix all files in the project.
            </p>
            {!projectFiles || projectFiles.length === 0 ? (
              <div className="border border-input rounded-md p-4 text-center text-sm text-muted-foreground">
                No files in this project. Please add files when creating the project.
              </div>
            ) : (
              <select
                value={entryFile}
                onChange={(e) => setEntryFile(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select entry point file...</option>
                {projectFiles
                  .filter(file => file.toLowerCase().endsWith('.py'))
                  .map((fileName) => (
                    <option key={fileName} value={fileName}>
                      {fileName}
                    </option>
                  ))}
              </select>
            )}
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
                    Specify the exact output you want
                  </div>
                </div>
              </Button>
            </div>
          </div>

          {mode === "expected_output" && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Expected Output <span className="text-destructive">*</span>
              </label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Paste the exact output you are looking for..."
                value={expectedOutput}
                onChange={(e) => setExpectedOutput(e.target.value)}
              />
            </div>
          )}
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
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
