"use client";

import { useState } from "react";
import { Upload, Link as LinkIcon, Loader2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cloneGitHubRepo, validateGitHubUrl } from "@/lib/api";
import type { GitHubFile } from "@/lib/types";
import { toast } from "sonner";

interface CreateProjectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (data: {
    name: string;
    description?: string;
    files?: File[];
    filePaths?: string[]; // Relative paths for each file to preserve folder structure
    githubUrl?: string;
    githubRepoName?: string;
  }) => void;
}

export function CreateProject({ open, onOpenChange, onCreateProject }: CreateProjectProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [filePaths, setFilePaths] = useState<string[]>([]);
  const [githubUrl, setGithubUrl] = useState("");
  const [uploadMode, setUploadMode] = useState<"files" | "folder">("files");
  const [isCloning, setIsCloning] = useState(false);
  const [clonedFiles, setClonedFiles] = useState<GitHubFile[]>([]);
  const [repoName, setRepoName] = useState("");
  const [selectedTab, setSelectedTab] = useState<"upload" | "github">("upload");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setFiles(fileArray);

      // Extract relative paths (for folder uploads)
      const paths = fileArray.map(file => {
        // webkitRelativePath contains the folder structure
        if ((file as any).webkitRelativePath) {
          return (file as any).webkitRelativePath;
        }
        // For single file uploads, just use the file name
        return file.name;
      });
      setFilePaths(paths);
    }
  };

  const handleCloneGitHub = async () => {
    if (!githubUrl) {
      toast.error("Please enter a GitHub URL");
      return;
    }

    const isValid = await validateGitHubUrl(githubUrl);
    if (!isValid) {
      toast.error("Invalid GitHub URL. Please use format: https://github.com/username/repo");
      return;
    }

    setIsCloning(true);
    try {
      const response = await cloneGitHubRepo({ url: githubUrl });
      setClonedFiles(response.files);
      setRepoName(response.repo_name);

      // Auto-populate project name if empty
      if (!name) {
        setName(response.repo_name);
      }

      toast.success(`Successfully cloned ${response.total_files} files from ${response.repo_name}`);
    } catch (error) {
      console.error("Clone error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to clone repository");
      setClonedFiles([]);
      setRepoName("");
    } finally {
      setIsCloning(false);
    }
  };

  const handleSubmit = () => {
    if (selectedTab === "github") {
      // Convert GitHub files to File objects
      const githubFiles = clonedFiles.map(file => {
        const blob = new Blob([file.content], { type: 'text/plain' });
        return new File([blob], file.name, { type: 'text/plain' });
      });
      const githubPaths = clonedFiles.map(file => file.path);

      onCreateProject({
        name,
        description,
        files: githubFiles,
        filePaths: githubPaths,
        githubUrl,
        githubRepoName: repoName
      });
    } else {
      onCreateProject({ name, description, files, filePaths });
    }

    // Reset form
    setName("");
    setDescription("");
    setFiles([]);
    setFilePaths([]);
    setGithubUrl("");
    setUploadMode("files");
    setClonedFiles([]);
    setRepoName("");
    setSelectedTab("upload");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Upload code files or connect a GitHub repository to get started.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Project Name
            </label>
            <Input
              placeholder="My Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Description (optional)
            </label>
            <Input
              placeholder="A brief description of your project"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Tabs defaultValue="upload" value={selectedTab} onValueChange={(v) => setSelectedTab(v as "upload" | "github")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </TabsTrigger>
              <TabsTrigger value="github">
                <LinkIcon className="h-4 w-4 mr-2" />
                GitHub Repository
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-4">
              <div className="space-y-4">
                {/* Upload mode selector */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="upload-mode"
                      value="files"
                      checked={uploadMode === "files"}
                      onChange={() => {
                        setUploadMode("files");
                        setFiles([]);
                        setFilePaths([]);
                      }}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Upload Files</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="upload-mode"
                      value="folder"
                      checked={uploadMode === "folder"}
                      onChange={() => {
                        setUploadMode("folder");
                        setFiles([]);
                        setFilePaths([]);
                      }}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Upload Folder (Git Repo)</span>
                  </label>
                </div>

                {/* Upload area */}
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-sm font-medium">
                      {uploadMode === "folder" ? "Click to select folder" : "Click to upload files"}
                    </span>
                    <span className="text-sm text-muted-foreground"> or drag and drop</span>
                    <input
                      id="file-upload"
                      type="file"
                      multiple={uploadMode === "files"}
                      {...(uploadMode === "folder" ? { webkitdirectory: "", directory: "" } as any : {})}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">
                    {uploadMode === "folder"
                      ? "Select a folder to upload entire directory structure"
                      : "Select one or more files to upload"}
                  </p>
                  {files.length > 0 && (
                    <div className="mt-4 text-left">
                      <div className="text-sm font-medium mb-2">
                        Selected files ({files.length}):
                      </div>
                      <div className="max-h-32 overflow-y-auto text-xs text-muted-foreground space-y-1">
                        {filePaths.map((path, idx) => (
                          <div key={idx} className="font-mono">{path}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="github" className="mt-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://github.com/username/repo"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isCloning) {
                        handleCloneGitHub();
                      }
                    }}
                  />
                  <Button
                    onClick={handleCloneGitHub}
                    disabled={!githubUrl || isCloning}
                    className="whitespace-nowrap"
                  >
                    {isCloning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cloning...
                      </>
                    ) : (
                      "Clone Repo"
                    )}
                  </Button>
                </div>

                {clonedFiles.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <div className="text-sm font-medium mb-2">
                      Cloned files from {repoName} ({clonedFiles.length} files):
                    </div>
                    <div className="max-h-64 overflow-y-auto text-xs text-muted-foreground space-y-1">
                      {clonedFiles.map((file, idx) => (
                        <div key={idx} className="font-mono flex items-center gap-2">
                          <span className="flex-1">{file.path}</span>
                          <span className="text-xs opacity-50">
                            {(file.size / 1024).toFixed(1)}KB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!clonedFiles.length && !isCloning && (
                  <p className="text-xs text-muted-foreground">
                    Enter a public GitHub repository URL to clone and upload all files.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !name ||
              (selectedTab === "upload" && files.length === 0) ||
              (selectedTab === "github" && clonedFiles.length === 0)
            }
          >
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
