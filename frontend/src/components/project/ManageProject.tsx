"use client";

import { useState, memo } from "react";
import { Upload, Trash2, FileCode, Download } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileViewer } from "./FileViewer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Issue } from "@/lib/types";

interface ManageProjectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  projectId: string;
  issues: Issue[];
  files: Record<string, { name: string; path: string; size?: number; mime_type?: string }>;
  onUploadFiles: (files: File[], filePaths: string[]) => Promise<void>;
  onDeleteIssue: (issueId: string) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onFileSelect: (filePath: string) => Promise<string>;
}

export const ManageProject = memo(function ManageProject({
  open,
  onOpenChange,
  projectName,
  projectId,
  issues,
  files,
  onUploadFiles,
  onDeleteIssue,
  onDeleteProject,
  onFileSelect,
}: ManageProjectProps) {
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteProjectOpen, setConfirmDeleteProjectOpen] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState<{ id: string; title: string } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    try {
      const filesArray = Array.from(fileList);
      const filePaths = filesArray.map(f => f.name);
      await onUploadFiles(filesArray, filePaths);
      e.target.value = ""; // Reset input
    } catch (error) {
      console.error("Failed to upload files:", error);
      toast.error("Failed to upload files", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteIssue = (issueId: string, issueTitle: string) => {
    setIssueToDelete({ id: issueId, title: issueTitle });
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!issueToDelete) return;

    try {
      await onDeleteIssue(issueToDelete.id);
      setConfirmDeleteOpen(false);
      setIssueToDelete(null);
    } catch (error) {
      console.error("Failed to delete issue:", error);
      toast.error("Failed to delete issue", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const handleDownloadZip = async () => {
    if (Object.keys(files).length === 0) {
      toast.error("No files to download");
      return;
    }

    setDownloading(true);
    try {
      const zip = new JSZip();

      // Fetch and add each file to the zip
      for (const file of Object.values(files)) {
        try {
          const content = await onFileSelect(file.path);
          zip.file(file.name, content);
        } catch (error) {
          console.error(`Failed to fetch file ${file.name}:`, error);
          toast.error(`Failed to add ${file.name} to ZIP`, {
            description: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }

      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Create download link and trigger download
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName.toLowerCase().replace(/\s+/g, "-")}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Files downloaded successfully");
    } catch (error) {
      console.error("Failed to create ZIP:", error);
      toast.error("Failed to download files", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteProject = () => {
    setConfirmDeleteProjectOpen(true);
  };

  const confirmDeleteProject = async () => {
    try {
      await onDeleteProject(projectId);
      setConfirmDeleteProjectOpen(false);
      onOpenChange(false);
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const getStatusColor = (status: Issue["status"]) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "in_progress":
        return "warning";
      case "solved":
        return "success";
      case "failed":
        return "destructive";
      case "merged":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] flex flex-col w-full">
          <DialogHeader>
            <DialogTitle>Manage Project: {projectName}</DialogTitle>
            <DialogDescription>
              View files, upload new files, and manage issues
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="files" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="issues">Issues ({issues.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="flex-1 overflow-hidden space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFileViewerOpen(true)}
                  className="flex-1"
                >
                  <FileCode className="h-4 w-4 mr-2" />
                  View Files
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadZip}
                  disabled={downloading || Object.keys(files).length === 0}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloading ? "Downloading..." : "Download as ZIP"}
                </Button>
                <div className="flex-1">
                  <label htmlFor="file-upload" className="block">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      disabled={uploading}
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Files"}
                    </Button>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="border rounded-md p-4">
                <h4 className="text-sm font-semibold mb-3">Project Files ({Object.keys(files).length})</h4>
                <ScrollArea className="h-[600px]">
                  {Object.keys(files).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No files in this project yet
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {Object.values(files).map((file) => (
                        <div
                          key={file.name}
                          className="flex items-center gap-2 p-2 rounded hover:bg-accent"
                        >
                          <FileCode className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs font-mono flex-1 truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="issues" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-[650px]">
                {issues.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No issues in this project yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {issues.map((issue) => (
                      <div
                        key={issue.id}
                        className="border rounded-md p-3 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-semibold truncate">{issue.title}</h4>
                              <Badge
                                variant={getStatusColor(issue.status)}
                                className={`text-xs px-2 py-0 ${
                                  issue.status === "merged" ? "bg-purple-600 hover:bg-purple-700" : ""
                                }`}
                              >
                                {issue.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {issue.mode === "basic" ? "Basic syntax fixing" : "Expected output mode"}
                              {" • "}
                              {issue.currentIteration} iteration{issue.currentIteration !== 1 ? 's' : ''}
                            </p>
                            {issue.selectedFiles && issue.selectedFiles.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Files: {issue.selectedFiles.join(", ")}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteIssue(issue.id, issue.title)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Project
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <FileViewer
        open={fileViewerOpen}
        onOpenChange={setFileViewerOpen}
        files={files}
        onFileSelect={onFileSelect}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete Issue"
        description={`Are you sure you want to delete "${issueToDelete?.title}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        variant="destructive"
      />

      <ConfirmDialog
        open={confirmDeleteProjectOpen}
        onOpenChange={setConfirmDeleteProjectOpen}
        title="Delete Project"
        description={`Are you sure you want to delete "${projectName}"? This will permanently delete all files, issues, and data associated with this project. This action cannot be undone.`}
        onConfirm={confirmDeleteProject}
        confirmText="Delete Project"
        variant="destructive"
      />
    </>
  );
});
