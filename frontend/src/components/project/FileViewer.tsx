"use client";

import { useState } from "react";
import { FileCode, ChevronRight, ChevronDown, Folder } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FileViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: Record<string, { name: string; path: string; size?: number; mime_type?: string }>;
  onFileSelect: (filePath: string) => Promise<string>; // Returns file content
}

export function FileViewer({ open, onOpenChange, files, onFileSelect }: FileViewerProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Organize files into a tree structure
  const fileTree = Object.values(files).reduce((acc, file) => {
    const parts = file.name.split('/');
    let current = acc;

    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        // It's a file
        if (!current.files) current.files = [];
        current.files.push(file);
      } else {
        // It's a folder
        if (!current.folders) current.folders = {};
        if (!current.folders[part]) {
          current.folders[part] = {};
        }
        current = current.folders[part];
      }
    });

    return acc;
  }, {} as any);

  const handleFileClick = async (file: { name: string; path: string }) => {
    setLoading(true);
    try {
      const content = await onFileSelect(file.path);
      setFileContent(content);
      setSelectedFile(file.name);
    } catch (error) {
      console.error("Failed to load file:", error);
      setFileContent("Failed to load file content");
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  const renderFileTree = (tree: any, prefix = ""): JSX.Element[] => {
    const items: JSX.Element[] = [];

    // Render folders first
    if (tree.folders) {
      Object.entries(tree.folders).forEach(([folderName, subtree]: [string, any]) => {
        const folderPath = prefix ? `${prefix}/${folderName}` : folderName;
        const isExpanded = expandedFolders.has(folderPath);

        items.push(
          <div key={folderPath}>
            <button
              onClick={() => toggleFolder(folderPath)}
              className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-accent rounded text-sm"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <Folder className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{folderName}</span>
            </button>
            {isExpanded && (
              <div className="ml-4">
                {renderFileTree(subtree, folderPath)}
              </div>
            )}
          </div>
        );
      });
    }

    // Render files
    if (tree.files) {
      tree.files.forEach((file: any) => {
        items.push(
          <button
            key={file.name}
            onClick={() => handleFileClick(file)}
            className={`flex items-center gap-2 w-full px-2 py-1.5 hover:bg-accent rounded text-sm ${
              selectedFile === file.name ? "bg-accent" : ""
            }`}
          >
            <div className="w-4" /> {/* Spacer for alignment */}
            <FileCode className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-xs truncate">{file.name.split('/').pop()}</span>
          </button>
        );
      });
    }

    return items;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Project Files</DialogTitle>
          <DialogDescription>
            View the current state of files in your project
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* File tree */}
          <div className="w-64 border-r border-border pr-4">
            <ScrollArea className="h-[60vh]">
              <div className="space-y-1">
                {Object.keys(files).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No files in this project
                  </p>
                ) : (
                  renderFileTree(fileTree)
                )}
              </div>
            </ScrollArea>
          </div>

          {/* File content */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-3">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">Loading file...</p>
                </div>
              </div>
            ) : selectedFile ? (
              <div className="h-full flex flex-col">
                <div className="border-b border-border pb-2 mb-2">
                  <h3 className="text-sm font-semibold font-mono">{selectedFile}</h3>
                </div>
                <ScrollArea className="flex-1">
                  <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-x-auto">
                    <code>{fileContent}</code>
                  </pre>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">Select a file to view its contents</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
