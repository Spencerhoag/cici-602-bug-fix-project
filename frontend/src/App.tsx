import { useState, useEffect, useCallback } from "react";
import { Play, X, GitBranch, GitMerge, GitPullRequest, StopCircle, Edit } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { CreateProject } from "@/components/project/CreateProject";
import { ManageProject } from "@/components/project/ManageProject";
import { ManageGroups } from "@/components/project/ManageGroups";
import { CreateIssue } from "@/components/issue/CreateIssue";
import { EditIssue } from "@/components/issue/EditIssue";
import { DiffView } from "@/components/ai/DiffView";
import { RuntimeOutput } from "@/components/ai/RuntimeOutput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { uploadFile, repairCode } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { AuthPage } from "@/components/auth/AuthPage";
import type { Issue } from "@/lib/types";
import {
  getProjects,
  createProject as dbCreateProject,
  uploadProjectFile,
  getProjectFiles,
  getProjectFileContent,
  getIssues,
  createIssue as dbCreateIssue,
  updateIssue,
  deleteIssue as dbDeleteIssue,
  deleteProject as dbDeleteProject,
} from "@/lib/database";
import { createUnifiedDiff } from "@/lib/diffUtils";

// File metadata type
interface FileMetadata {
  name: string;
  path: string;
  size?: number;
  mime_type?: string;
}

export default function App() {
  const { user, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage />;
  }

  // User is authenticated, show main app
  return (
    <>
      <MainApp />
      <Toaster position="bottom-right" richColors />
    </>
  );
}

function MainApp() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>();
  const [selectedIssueId, setSelectedIssueId] = useState<string>();
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [manageProjectOpen, setManageProjectOpen] = useState(false);
  const [manageGroupsOpen, setManageGroupsOpen] = useState(false);
  const [createIssueOpen, setCreateIssueOpen] = useState(false);
  const [createIssueProjectId, setCreateIssueProjectId] = useState<string>();
  const [editIssueOpen, setEditIssueOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showOpenPR, setShowOpenPR] = useState(false);
  const [projectFiles, setProjectFiles] = useState<Record<string, Record<string, FileMetadata>>>({});  // projectId -> fileName -> FileMetadata
  const [_issueRunIds, setIssueRunIds] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Load projects from database on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const dbProjects = await getProjects();

      // Load issues and files for each project
      const projectsWithIssues = await Promise.all(
        dbProjects.map(async (project) => {
          const [dbIssues, dbFiles] = await Promise.all([
            getIssues(project.id),
            getProjectFiles(project.id),
          ]);

          // Store file metadata (we'll download file content when needed)
          const fileMap: Record<string, any> = {};
          dbFiles.forEach((file) => {
            // Store file metadata, not the actual File object yet
            fileMap[file.name] = {
              name: file.name,
              path: file.path,
              size: file.size,
              mime_type: file.mime_type,
            };
          });
          setProjectFiles((prev) => ({
            ...prev,
            [project.id]: fileMap,
          }));

          // Transform issues to frontend format
          const issues = dbIssues.map((issue) => ({
            id: issue.id,
            title: issue.title,
            description: issue.description,
            status: issue.status,
            mode: issue.mode,
            expectedOutput: issue.expected_output,
            currentIteration: issue.iterations_count,
            selectedFiles: issue.selected_files || [],
            iterations: [], // Not tracking individual iterations anymore
            // Store final result if available
            originalCode: issue.original_code,
            fixedCode: issue.fixed_code,
            reasoning: issue.reasoning,
            runtimeOutput: issue.runtime_output,
            exitCode: issue.exit_code,
            createdAt: issue.created_at,
          }));

          return {
            id: project.id,
            name: project.name,
            description: undefined,
            repository: undefined,
            issues,
            createdAt: undefined,
            fileCount: dbFiles.length,
            files: dbFiles.map(f => f.name),
          };
        })
      );

      setProjects(projectsWithIssues);
      if (projectsWithIssues.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectsWithIssues[0].id);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast.error("Failed to load projects from database");
    } finally {
      setLoading(false);
    }
  };

  // Granular update functions to avoid full reloads
  const updateProjectFiles = async (projectId: string) => {
    const dbFiles = await getProjectFiles(projectId);
    const fileMap: Record<string, any> = {};
    dbFiles.forEach((file) => {
      fileMap[file.name] = {
        name: file.name,
        path: file.path,
        size: file.size,
        mime_type: file.mime_type,
      };
    });
    setProjectFiles((prev) => ({
      ...prev,
      [projectId]: fileMap,
    }));

    // Update file count in projects
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, fileCount: dbFiles.length, files: dbFiles.map(f => f.name) }
          : p
      )
    );
  };

  const updateProjectIssues = async (projectId: string) => {
    const dbIssues = await getIssues(projectId);
    const issues = dbIssues.map((issue) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      mode: issue.mode,
      expectedOutput: issue.expected_output,
      currentIteration: issue.iterations_count,
      selectedFiles: issue.selected_files || [],
      iterations: [],
      originalCode: issue.original_code,
      fixedCode: issue.fixed_code,
      reasoning: issue.reasoning,
      runtimeOutput: issue.runtime_output,
      exitCode: issue.exit_code,
      createdAt: issue.created_at,
    }));

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, issues } : p
      )
    );
  };

  const updateSingleIssue = (projectId: string, issueId: string, updates: Partial<Issue>) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              issues: p.issues.map((i: Issue) =>
                i.id === issueId ? { ...i, ...updates } : i
              ),
            }
          : p
      )
    );
  };

  const removeProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  const removeIssue = (projectId: string, issueId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, issues: p.issues.filter((i: Issue) => i.id !== issueId) }
          : p
      )
    );
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedIssue = selectedProject?.issues.find(
    (i: Issue) => i.id === selectedIssueId
  );

  const handleProjectSelect = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedIssueId(undefined);
    setMobileSidebarOpen(false);
  }, []);

  const handleIssueSelect = useCallback((issueId: string) => {
    setSelectedIssueId(issueId);
    const project = projects.find((p) =>
      p.issues.some((i: Issue) => i.id === issueId)
    );
    if (project) {
      setSelectedProjectId(project.id);
    }
    setMobileSidebarOpen(false);
    setShowOpenPR(false);
  }, [projects]);

  const handleCreateIssue = useCallback((projectId: string) => {
    setCreateIssueProjectId(projectId);
    setCreateIssueOpen(true);
  }, []);

  const handleStartAI = async () => {
    if (!selectedIssueId || !selectedProjectId) return;

    // Get the files selected for this issue
    const issueFileNames = selectedIssue?.selectedFiles || [];
    if (issueFileNames.length === 0) {
      toast.error("No files selected for this issue");
      return;
    }

    const fileMetadata = projectFiles[selectedProjectId]?.[issueFileNames[0]];

    if (!fileMetadata) {
      toast.error("File not found in project");
      return;
    }

    setIsProcessing(true);

    let file: File | null = null;

    try {
      // Download file content from storage
      const fileContent = await getProjectFileContent(fileMetadata.path);

      // Convert to File object
      file = new File([fileContent], fileMetadata.name, {
        type: fileMetadata.mime_type || "text/plain",
      });
    } catch (error) {
      console.error("Failed to download file:", error);
      toast.error("Failed to download file from storage");
      setIsProcessing(false);
      return;
    }

    try {
      // Update issue status to in_progress
      await updateIssue(selectedIssueId, { status: "in_progress" });

      // Update local state
      setProjects((prev) =>
        prev.map((project) => ({
          ...project,
          issues: project.issues.map((issue: Issue) =>
            issue.id === selectedIssueId
              ? { ...issue, status: "in_progress" as const }
              : issue
          ),
        }))
      );

      // Upload the file
      const uploadResponse = await uploadFile(file, "python");
      console.log("Upload response:", uploadResponse);

      // Store the run_id
      setIssueRunIds((prev) => ({
        ...prev,
        [selectedIssueId]: uploadResponse.run_id,
      }));

      // Repair the code
      const repairResponse = await repairCode(uploadResponse.run_id, {
        language: "python",
        expected_output: selectedIssue?.mode === "expected_output" ? selectedIssue.expectedOutput : undefined,
      });
      console.log("Repair response:", repairResponse);

      // Update issue status and final result
      const finalStatus = repairResponse.status === "success" ? "solved" : "failed";
      await updateIssue(selectedIssueId, {
        status: finalStatus,
        original_code: repairResponse.original_code,
        fixed_code: repairResponse.fixed_code,
        reasoning: repairResponse.message || `Attempted to fix code. ${repairResponse.status === "success" ? "Success!" : "Failed after " + repairResponse.iterations + " attempts."}`,
        runtime_output: repairResponse.output || repairResponse.last_output || repairResponse.last_error || "",
        exit_code: repairResponse.status === "success" ? 0 : (repairResponse.last_exit_code || 1),
        iterations_count: repairResponse.iterations || 0,
      });

      // Update local state
      updateSingleIssue(selectedProjectId, selectedIssueId, {
        status: finalStatus,
        originalCode: repairResponse.original_code,
        fixedCode: repairResponse.fixed_code,
        reasoning: repairResponse.message || `Attempted to fix code. ${repairResponse.status === "success" ? "Success!" : "Failed after " + repairResponse.iterations + " attempts."}`,
        runtimeOutput: repairResponse.output || repairResponse.last_output || repairResponse.last_error || "",
        exitCode: repairResponse.status === "success" ? 0 : (repairResponse.last_exit_code || 1),
        currentIteration: repairResponse.iterations || 0,
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error processing issue", {
        description: error instanceof Error ? error.message : "Unknown error"
      });

      try {
        // Update issue status to failed
        await updateIssue(selectedIssueId, { status: "failed" });

        // Update local state
        setProjects((prev) =>
          prev.map((project) => ({
            ...project,
            issues: project.issues.map((issue: Issue) =>
              issue.id === selectedIssueId
                ? { ...issue, status: "failed" as const }
                : issue
            ),
          }))
        );
      } catch (updateError) {
        console.error("Failed to update issue status:", updateError);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStopAI = () => {
    console.log("Stopping AI iteration...");
    setIsProcessing(false);
  };

  const handleAcceptChanges = async () => {
    if (!selectedIssueId || !selectedProjectId || !selectedIssue?.fixedCode) return;

    try {
      console.log("Accepting changes...");

      // Get the file to update
      const fileName = selectedIssue.selectedFiles?.[0];
      if (!fileName) {
        toast.error("No file selected for this issue");
        return;
      }

      const fileMetadata = projectFiles[selectedProjectId]?.[fileName];
      if (!fileMetadata) {
        toast.error("File not found in project");
        return;
      }

      // Check for conflicts with other merged issues
      const otherMergedIssues = selectedProject?.issues.filter(
        (issue: Issue) => issue.id !== selectedIssueId && issue.status === "merged" &&
        issue.selectedFiles?.some(f => selectedIssue.selectedFiles?.includes(f))
      ) || [];

      if (otherMergedIssues.length > 0) {
        toast.error("Cannot merge: Another issue has already modified the same file(s)", {
          description: `Conflicting with: ${otherMergedIssues.map((i: Issue) => i.title).join(", ")}. This requires Git integration.`
        });
        return;
      }

      // Create a new File object with the fixed code
      const fixedFile = new File([selectedIssue.fixedCode], fileName, {
        type: fileMetadata.mime_type || "text/plain",
      });

      // Upload the fixed code to storage (overwrite the original)
      await uploadProjectFile(selectedProjectId, fixedFile, fileName);

      // Mark issue as merged
      await updateIssue(selectedIssueId, {
        status: "merged",
      });

      // Update local state
      updateSingleIssue(selectedProjectId, selectedIssueId, { status: "merged" });
      await updateProjectFiles(selectedProjectId);

      toast.success("Changes merged successfully", {
        description: "The code has been updated in your project"
      });

      // If issue is connected to GitHub, show the Open PR button
      if (selectedIssue?.githubIssueUrl) {
        setShowOpenPR(true);
      }
    } catch (error) {
      console.error("Failed to accept changes:", error);
      toast.error("Failed to save fixed code", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const handleRejectChanges = async () => {
    if (!selectedIssueId) return;

    try {
      console.log("Rejecting changes...");

      // Reset issue to pending status and clear results
      await updateIssue(selectedIssueId, {
        status: "pending",
        original_code: undefined,
        fixed_code: undefined,
        reasoning: undefined,
        runtime_output: undefined,
        exit_code: undefined,
        iterations_count: 0,
      });

      // Update local state
      if (selectedProjectId) {
        updateSingleIssue(selectedProjectId, selectedIssueId, {
          status: "pending",
          originalCode: undefined,
          fixedCode: undefined,
          reasoning: undefined,
          runtimeOutput: undefined,
          exitCode: undefined,
          currentIteration: 0,
        });
      }

      setShowOpenPR(false);

      toast.success("Issue reset to pending", {
        description: "You can try fixing it again"
      });
    } catch (error) {
      console.error("Failed to reject changes:", error);
      toast.error("Failed to reset issue", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const handleOpenPR = () => {
    console.log("Opening pull request...");
    // In real app, this would call API to create PR
    // For now, just update local state to show PR was created
    setShowOpenPR(false);
  };

  // Show loading spinner while loading projects
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Header onMenuClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-20 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed md:relative inset-y-0 left-0 z-30 md:z-0
            transform transition-transform duration-300 ease-in-out
            ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            w-64 md:w-64 h-full
          `}
        >
          <Sidebar
            projects={projects}
            selectedProjectId={selectedProjectId}
            selectedIssueId={selectedIssueId}
            onProjectSelect={handleProjectSelect}
            onIssueSelect={handleIssueSelect}
            onCreateProject={() => setCreateProjectOpen(true)}
            onCreateIssue={handleCreateIssue}
            onManageProject={(projectId) => {
              setSelectedProjectId(projectId);
              setManageProjectOpen(true);
            }}
            onManageGroups={() => setManageGroupsOpen(true)}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-background">
          {!selectedIssue ? (
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-center space-y-3">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Welcome to CICI</h2>
                <p className="text-base md:text-lg text-muted-foreground">Select an issue to get started</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Issue Header - Fixed at top */}
              <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm px-4 py-3 md:px-6 md:py-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 max-w-5xl mx-auto">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg md:text-xl font-bold mb-2 tracking-tight">
                      {selectedIssue.title}
                    </h1>
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        {selectedIssue.mode === "basic" ? "Basic" : "Expected Output"}
                      </Badge>
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        Iteration {selectedIssue.currentIteration}
                      </Badge>
                      <Badge
                        variant={
                          selectedIssue.status === "merged" ? "default" :
                          selectedIssue.status === "solved" ? "success" :
                          selectedIssue.status === "in_progress" ? "warning" :
                          selectedIssue.status === "failed" ? "destructive" : "outline"
                        }
                        className={`text-xs px-2 py-0.5 ${
                          selectedIssue.status === "merged" ? "bg-purple-600 hover:bg-purple-700" : ""
                        }`}
                      >
                        {selectedIssue.status === "merged" && <GitMerge className="h-2.5 w-2.5 mr-1 inline" />}
                        {selectedIssue.status.replace("_", " ")}
                      </Badge>

                      {/* PR Status in Header */}
                      {selectedIssue.githubPrUrl && selectedIssue.githubPrMerged && (
                        <Badge variant="default" className="text-xs px-2 py-0.5 bg-purple-600 hover:bg-purple-700">
                          <GitMerge className="h-2.5 w-2.5 mr-1" />
                          PR #{selectedIssue.githubPrNumber} Merged
                        </Badge>
                      )}
                      {selectedIssue.githubPrUrl && !selectedIssue.githubPrMerged && (
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          <GitPullRequest className="h-2.5 w-2.5 mr-1" />
                          PR #{selectedIssue.githubPrNumber} Open
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditIssueOpen(true)}
                      className="flex-1 md:flex-none"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    {isProcessing || selectedIssue.status === "in_progress" ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleStopAI}
                        className="flex-1 md:flex-none"
                        disabled={isProcessing}
                      >
                        <StopCircle className="h-4 w-4 mr-2" />
                        {isProcessing ? "Processing..." : "Stop AI"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleStartAI}
                        disabled={selectedIssue.status === "solved" || isProcessing}
                        className="flex-1 md:flex-none"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start AI
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Final result view - Scrollable */}
              <div className="flex-1 overflow-auto p-3 md:p-4">
                {selectedIssue.status === "pending" ? (
                  <div className="flex items-center justify-center h-full">
                    <Card className="max-w-md border-border/50">
                      <CardContent className="p-6 text-center">
                        <p className="text-base font-semibold mb-2">Ready to fix</p>
                        <p className="text-xs text-muted-foreground">
                          Click "Start AI" to begin working on this issue
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ) : selectedIssue.status === "in_progress" ? (
                  <div className="flex items-center justify-center h-full">
                    <Card className="max-w-md border-border/50">
                      <CardContent className="p-6 text-center">
                        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-base font-semibold mb-2">Fixing code...</p>
                        <p className="text-xs text-muted-foreground">
                          AI is attempting up to 8 fixes
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (selectedIssue.status === "solved" || selectedIssue.status === "failed" || selectedIssue.status === "merged") && selectedIssue.fixedCode ? (
                  <div className="space-y-3 max-w-5xl mx-auto">
                    <Card className="border-primary/50">
                      <CardHeader className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-sm font-semibold">
                              Final Result
                            </CardTitle>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {selectedIssue.currentIteration} iteration{selectedIssue.currentIteration !== 1 ? 's' : ''} attempted
                            </p>
                          </div>
                          <Badge
                            variant={
                              selectedIssue.status === "merged" ? "default" :
                              selectedIssue.status === "solved" ? "success" :
                              "destructive"
                            }
                            className={`text-[10px] px-2 py-0.5 ${
                              selectedIssue.status === "merged" ? "bg-purple-600 hover:bg-purple-700" : ""
                            }`}
                          >
                            {selectedIssue.status === "merged" && <GitMerge className="h-2.5 w-2.5 mr-1 inline" />}
                            {selectedIssue.status}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 pt-0 p-3">
                        {/* AI Reasoning */}
                        {selectedIssue.reasoning && (
                          <div>
                            <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide">Reasoning</h4>
                            <div className="text-xs bg-muted p-2 rounded-md leading-relaxed">
                              {selectedIssue.reasoning}
                            </div>
                          </div>
                        )}

                        {/* Code Changes */}
                        {selectedIssue.originalCode && selectedIssue.fixedCode && (
                          <div>
                            <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide">Code Changes</h4>
                            <DiffView changes={[{
                              id: 'final-change',
                              filePath: selectedIssue.selectedFiles?.[0] || 'file',
                              diff: createUnifiedDiff(
                                selectedIssue.originalCode,
                                selectedIssue.fixedCode,
                                selectedIssue.selectedFiles?.[0] || 'file'
                              ),
                            }]} />
                          </div>
                        )}

                        {/* Runtime Output */}
                        {selectedIssue.runtimeOutput && (
                          <div>
                            <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide">Runtime Output</h4>
                            <RuntimeOutput
                              output={selectedIssue.runtimeOutput}
                              exitCode={selectedIssue.exitCode}
                              isRunning={false}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* PR Status if applicable */}
                    {(selectedIssue.githubPrUrl) && (
                      <Card className="bg-muted/30 border-border/50">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">GitHub</span>
                            <div className="h-3 w-px bg-border"></div>
                            {selectedIssue.githubPrMerged ? (
                              <Badge variant="default" className="text-xs px-2 py-0.5 bg-purple-600 hover:bg-purple-700">
                                <GitMerge className="h-2.5 w-2.5 mr-1" />
                                PR #{selectedIssue.githubPrNumber} Merged
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs px-2.py-0.5">
                                <GitPullRequest className="h-2.5 w-2.5 mr-1" />
                                PR #{selectedIssue.githubPrNumber} Open
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Card className="max-w-md border-border/50">
                      <CardContent className="p-6 text-center">
                        <p className="text-base font-semibold mb-2">No result yet</p>
                        <p className="text-xs text-muted-foreground">
                          Start the AI to see the fix result
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Action buttons - Fixed at bottom */}
              {selectedIssue.status === "solved" && selectedIssue.fixedCode && (
                <div className="border-t border-border/50 bg-card/50 backdrop-blur-sm p-3 md:p-4">
                  <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col sm:flex-row gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRejectChanges}
                        className="sm:w-auto hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleAcceptChanges}
                        className="sm:w-auto"
                      >
                        <GitMerge className="h-4 w-4 mr-2" />
                        Merge Changes
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Merged status message */}
              {selectedIssue.status === "merged" && (
                <div className="border-t border-border/50 bg-card/50 backdrop-blur-sm p-3 md:p-4">
                  <div className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <GitMerge className="h-4 w-4 text-purple-600" />
                      <span>Changes have been merged into the project</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Open PR button - Shows after accepting if GitHub connected */}
              {showOpenPR && selectedIssue.githubIssueUrl && (
                <div className="border-t border-border/50 bg-card/50 backdrop-blur-sm p-3 md:p-4">
                  <div className="max-w-5xl mx-auto">
                    <Card className="bg-primary/10 border-primary/50">
                      <CardContent className="p-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Changes Accepted</h4>
                            <p className="text-xs text-muted-foreground">
                              Connected to GitHub issue #{selectedIssue.githubIssueNumber}. Open a PR?
                            </p>
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleOpenPR}
                            className="w-full sm:w-auto"
                          >
                            <GitBranch className="h-4 w-4 mr-2" />
                            Open PR
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ManageGroups
        open={manageGroupsOpen}
        onOpenChange={setManageGroupsOpen}
      />
      <CreateProject
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        onCreateProject={async (data) => {
          try {
            console.log("Create project:", data);

            // Create project in database
            const project = await dbCreateProject({
              name: data.name,
            });

            // Upload files to storage
            if (data.files && data.files.length > 0) {
              const fileMap: Record<string, any> = {};

              for (let i = 0; i < data.files.length; i++) {
                const file = data.files[i];
                const relativePath = data.filePaths?.[i];

                // Upload with relative path to preserve folder structure
                const dbFile = await uploadProjectFile(project.id, file, relativePath);

                // Store file metadata (using the full path as key for nested files)
                fileMap[dbFile.name] = {
                  name: dbFile.name,
                  path: dbFile.path,
                  size: dbFile.size,
                  mime_type: dbFile.mime_type,
                };
              }

              // Store file metadata in local state
              setProjectFiles((prev) => ({
                ...prev,
                [project.id]: fileMap,
              }));
            }

            // Add new project to state
            setProjects((prev) => [
              ...prev,
              {
                id: project.id,
                name: project.name,
                description: undefined,
                repository: undefined,
                issues: [],
                createdAt: undefined,
                fileCount: data.files?.length || 0,
                files: data.files?.map((f: File) => f.name) || [],
              },
            ]);

            // Select the new project
            setSelectedProjectId(project.id);
          } catch (error) {
            console.error("Failed to create project:", error);
            toast.error("Failed to create project", {
              description: error instanceof Error ? error.message : "Unknown error"
            });
          }
        }}
      />

      <CreateIssue
        open={createIssueOpen}
        onOpenChange={setCreateIssueOpen}
        projectFiles={
          createIssueProjectId && projectFiles[createIssueProjectId]
            ? Object.keys(projectFiles[createIssueProjectId])
            : []
        }
        onCreateIssue={async (data: any) => {
          try {
            console.log("Create issue:", data, "for project:", createIssueProjectId);
            if (!createIssueProjectId) return;

            // Create issue in database
            const dbIssue = await dbCreateIssue({
              project_id: createIssueProjectId,
              title: data.title,
              description: data.description,
              mode: data.mode,
              expected_output: data.expectedOutput,
              selected_files: data.selectedFiles,
            });

            // Add issue to local state
            const newIssue: Issue = {
              id: dbIssue.id,
              title: dbIssue.title,
              description: dbIssue.description || undefined,
              status: dbIssue.status,
              mode: dbIssue.mode,
              expectedOutput: dbIssue.expected_output,
              currentIteration: 0,
              selectedFiles: dbIssue.selected_files || [],
              iterations: [],
              createdAt: dbIssue.created_at,
            };

            setProjects((prev) =>
              prev.map((p) =>
                p.id === createIssueProjectId
                  ? { ...p, issues: [newIssue, ...p.issues] }
                  : p
              )
            );

            // Select the new issue
            setSelectedIssueId(dbIssue.id);
          } catch (error) {
            console.error("Failed to create issue:", error);
            toast.error("Failed to create issue", {
              description: error instanceof Error ? error.message : "Unknown error"
            });
          }
        }}
      />

      <EditIssue
        open={editIssueOpen}
        onOpenChange={setEditIssueOpen}
        projectFiles={
          selectedProjectId && projectFiles[selectedProjectId]
            ? Object.keys(projectFiles[selectedProjectId])
            : []
        }
        initialData={
          selectedIssue
            ? {
                title: selectedIssue.title,
                description: selectedIssue.description || "",
                mode: selectedIssue.mode,
                expectedOutput: selectedIssue.expectedOutput || "",
                selectedFiles: selectedIssue.selectedFiles || [],
              }
            : undefined
        }
        onEditIssue={async (data: any) => {
          try {
            console.log("Edit issue:", data, "for issue:", selectedIssueId);
            if (!selectedIssueId) return;

            // Update issue in database
            await updateIssue(selectedIssueId, {
              title: data.title,
              description: data.description,
              mode: data.mode,
              expected_output: data.expectedOutput,
              selected_files: data.selectedFiles,
            });

            // Update local state
            if (selectedProjectId) {
              updateSingleIssue(selectedProjectId, selectedIssueId, {
                title: data.title,
                description: data.description,
                mode: data.mode,
                expectedOutput: data.expectedOutput,
                selectedFiles: data.selectedFiles,
              });
            }

            toast.success("Issue updated successfully");
          } catch (error) {
            console.error("Failed to edit issue:", error);
            toast.error("Failed to edit issue", {
              description: error instanceof Error ? error.message : "Unknown error"
            });
          }
        }}
      />

      <ManageProject
        open={manageProjectOpen}
        onOpenChange={setManageProjectOpen}
        projectName={selectedProject?.name || ""}
        projectId={selectedProjectId || ""}
        issues={selectedProject?.issues || []}
        files={selectedProjectId && projectFiles[selectedProjectId] ? projectFiles[selectedProjectId] : {}}
        onUploadFiles={async (files: File[], filePaths: string[]) => {
          if (!selectedProjectId) return;

          try {
            for (let i = 0; i < files.length; i++) {
              await uploadProjectFile(selectedProjectId, files[i], filePaths[i]);
            }
            await updateProjectFiles(selectedProjectId);
            toast.success(`${files.length} file(s) uploaded successfully`);
          } catch (error) {
            console.error("Failed to upload files:", error);
            throw error;
          }
        }}
        onDeleteIssue={async (issueId: string) => {
          if (!selectedProjectId) return;

          // Optimistic update
          removeIssue(selectedProjectId, issueId);

          // Clear selection if deleted issue was selected
          if (selectedIssueId === issueId) {
            setSelectedIssueId(undefined);
          }

          try {
            await dbDeleteIssue(issueId);
            toast.success("Issue deleted successfully");
          } catch (error) {
            console.error("Failed to delete issue:", error);
            // Revert by reloading issues
            await updateProjectIssues(selectedProjectId);
            throw error;
          }
        }}
        onDeleteProject={async (projectId: string) => {
          // Optimistic update
          removeProject(projectId);

          // Clear selection if deleted project was selected
          if (selectedProjectId === projectId) {
            setSelectedProjectId(undefined);
            setSelectedIssueId(undefined);
          }

          // Close the manage project dialog
          setManageProjectOpen(false);

          try {
            await dbDeleteProject(projectId);
          } catch (error) {
            console.error("Failed to delete project:", error);
            // Revert by reloading all projects
            await loadProjects();
            throw error;
          }
        }}
        onFileSelect={async (filePath: string) => {
          try {
            const content = await getProjectFileContent(filePath);
            return content;
          } catch (error) {
            console.error("Failed to load file:", error);
            throw error;
          }
        }}
      />
    </div>
  );
}
