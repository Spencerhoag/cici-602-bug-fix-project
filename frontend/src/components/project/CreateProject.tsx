"use client";

import { useState } from "react";
import { Upload, Link as LinkIcon } from "lucide-react";
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

interface CreateProjectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (data: { name: string; description?: string; files?: File[] }) => void;
}

export function CreateProject({ open, onOpenChange, onCreateProject }: CreateProjectProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [githubUrl, setGithubUrl] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = () => {
    onCreateProject({ name, description, files });
    // Reset form
    setName("");
    setDescription("");
    setFiles([]);
    setGithubUrl("");
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

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </TabsTrigger>
              <TabsTrigger value="github" disabled>
                <LinkIcon className="h-4 w-4 mr-2" />
                GitHub (Coming Soon)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-sm font-medium">Click to upload</span>
                  <span className="text-sm text-muted-foreground"> or drag and drop</span>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {files.length > 0 && (
                  <div className="mt-4 text-left">
                    <div className="text-sm font-medium mb-2">
                      Selected files ({files.length}):
                    </div>
                    <div className="max-h-32 overflow-y-auto text-xs text-muted-foreground space-y-1">
                      {files.map((file, idx) => (
                        <div key={idx}>{file.name}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="github" className="mt-4">
              <div className="space-y-4">
                <Input
                  placeholder="https://github.com/username/repo"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  GitHub integration coming soon! For now, please use file upload.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name || files.length === 0}>
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
