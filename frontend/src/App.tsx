import { useState } from "react";
import { Play, ChevronDown, ChevronRight, Check, X, GitBranch, GitMerge, GitPullRequest, StopCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { CreateProject } from "@/components/project/CreateProject";
import { CreateIssue } from "@/components/issue/CreateIssue";
import { DiffView } from "@/components/ai/DiffView";
import { RuntimeOutput } from "@/components/ai/RuntimeOutput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockProjects } from "@/lib/mock-data";
import type { Iteration } from "@/lib/types";

export default function App() {
  const [projects] = useState(mockProjects);
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id);
  const [selectedIssueId, setSelectedIssueId] = useState<string>();
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createIssueOpen, setCreateIssueOpen] = useState(false);
  const [createIssueProjectId, setCreateIssueProjectId] = useState<string>();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsedIterations, setCollapsedIterations] = useState<Set<string>>(new Set());
  const [showOpenPR, setShowOpenPR] = useState(false);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedIssue = selectedProject?.issues.find(
    (i) => i.id === selectedIssueId
  );

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedIssueId(undefined);
    setMobileSidebarOpen(false);
  };

  const handleIssueSelect = (issueId: string) => {
    setSelectedIssueId(issueId);
    const project = projects.find((p) =>
      p.issues.some((i) => i.id === issueId)
    );
    if (project) {
      setSelectedProjectId(project.id);
    }
    setMobileSidebarOpen(false);
    setShowOpenPR(false);
  };

  const handleCreateIssue = (projectId: string) => {
    setCreateIssueProjectId(projectId);
    setCreateIssueOpen(true);
  };

  const handleStartAI = () => {
    console.log("Starting AI iteration...");
  };

  const handleStopAI = () => {
    console.log("Stopping AI iteration...");
  };

  const toggleIteration = (iterationId: string) => {
    const newCollapsed = new Set(collapsedIterations);
    if (newCollapsed.has(iterationId)) {
      newCollapsed.delete(iterationId);
    } else {
      newCollapsed.add(iterationId);
    }
    setCollapsedIterations(newCollapsed);
  };

  const handleAcceptChanges = () => {
    console.log("Accepting changes...");
    // If issue is connected to GitHub, show the Open PR button
    if (selectedIssue?.githubIssueUrl) {
      setShowOpenPR(true);
    }
  };

  const handleRejectChanges = () => {
    console.log("Rejecting changes...");
    setShowOpenPR(false);
  };

  const handleOpenPR = () => {
    console.log("Opening pull request...");
    // In real app, this would call API to create PR
    // For now, just update local state to show PR was created
    setShowOpenPR(false);
  };

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
                        {selectedIssue.currentIteration}/{selectedIssue.maxIterations} iter
                      </Badge>
                      <Badge
                        variant={
                          selectedIssue.status === "solved" ? "success" :
                          selectedIssue.status === "in_progress" ? "warning" :
                          selectedIssue.status === "failed" ? "destructive" : "outline"
                        }
                        className="text-xs px-2 py-0.5"
                      >
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

                  {/* Start/Stop AI Button */}
                  {selectedIssue.status === "in_progress" ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleStopAI}
                      className="w-full md:w-auto"
                    >
                      <StopCircle className="h-4 w-4 mr-2" />
                      Stop AI
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleStartAI}
                      disabled={selectedIssue.status === "solved"}
                      className="w-full md:w-auto"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start AI
                    </Button>
                  )}
                </div>
              </div>

              {/* Chat-like iteration flow - Scrollable */}
              <div className="flex-1 overflow-auto p-3 md:p-4">
                {selectedIssue.iterations.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <Card className="max-w-md border-border/50">
                      <CardContent className="p-6 text-center">
                        <p className="text-base font-semibold mb-2">No iterations yet</p>
                        <p className="text-xs text-muted-foreground">
                          Click "Start AI" to begin working on this issue
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 max-w-5xl mx-auto">
                    {selectedIssue.iterations.map((iteration, index) => {
                      const isCollapsed = collapsedIterations.has(iteration.id);
                      const isLast = index === selectedIssue.iterations.length - 1;

                      return (
                        <Card key={iteration.id} className={isLast ? "border-primary/50" : "border-border/50"}>
                          <CardHeader
                            className="cursor-pointer hover:bg-accent/30 transition-all p-3"
                            onClick={() => toggleIteration(iteration.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-2 flex-1">
                                {isCollapsed ? (
                                  <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                                )}
                                <div className="flex-1">
                                  <CardTitle className="text-sm font-semibold">
                                    Iteration {iteration.number}
                                    {isLast && iteration.status === "running" && (
                                      <Badge variant="warning" className="ml-2 text-[10px] px-1.5 py-0">Running</Badge>
                                    )}
                                  </CardTitle>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {new Date(iteration.startedAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant={
                                  iteration.status === "completed" ? "success" :
                                  iteration.status === "failed" ? "destructive" : "warning"
                                }
                                className="text-[10px] px-2 py-0.5"
                              >
                                {iteration.status}
                              </Badge>
                            </div>
                          </CardHeader>

                          {!isCollapsed && (
                            <CardContent className="space-y-3 pt-0 p-3">
                              {/* AI Reasoning */}
                              <div>
                                <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide">Reasoning</h4>
                                <div className="text-xs bg-muted p-2 rounded-md leading-relaxed">
                                  {iteration.reasoning}
                                </div>
                              </div>

                              {/* Code Changes */}
                              {iteration.changes.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide">Code Changes</h4>
                                  <DiffView changes={iteration.changes} />
                                </div>
                              )}

                              {/* Runtime Output */}
                              {iteration.runtimeOutput && (
                                <div>
                                  <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide">Runtime Output</h4>
                                  <RuntimeOutput
                                    output={iteration.runtimeOutput}
                                    exitCode={iteration.exitCode}
                                    isRunning={iteration.status === "running"}
                                  />
                                </div>
                              )}
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}

                    {/* Final Status Summary */}
                    {selectedIssue.iterations.length > 0 && (
                      <Card className="bg-muted/30 border-border/50">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</span>
                            <div className="h-3 w-px bg-border"></div>
                            <Badge
                              variant={
                                selectedIssue.status === "solved" ? "success" :
                                selectedIssue.status === "in_progress" ? "warning" :
                                selectedIssue.status === "failed" ? "destructive" : "outline"
                              }
                              className="text-xs px-2 py-0.5"
                            >
                              {selectedIssue.status.replace("_", " ")}
                            </Badge>

                            {/* PR Status Badge - Only show if PR exists */}
                            {selectedIssue.githubPrUrl && selectedIssue.githubPrMerged && (
                              <>
                                <div className="h-3 w-px bg-border"></div>
                                <Badge variant="default" className="text-xs px-2 py-0.5 bg-purple-600 hover:bg-purple-700">
                                  <GitMerge className="h-2.5 w-2.5 mr-1" />
                                  PR #{selectedIssue.githubPrNumber} Merged
                                </Badge>
                              </>
                            )}
                            {selectedIssue.githubPrUrl && !selectedIssue.githubPrMerged && (
                              <>
                                <div className="h-3 w-px bg-border"></div>
                                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                  <GitPullRequest className="h-2.5 w-2.5 mr-1" />
                                  PR #{selectedIssue.githubPrNumber} Open
                                </Badge>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons - Fixed at bottom */}
              {selectedIssue.iterations.length > 0 &&
                selectedIssue.iterations[selectedIssue.iterations.length - 1].status === "completed" &&
                !selectedIssue.iterations[selectedIssue.iterations.length - 1].changes.some(c => c.accepted !== undefined) && (
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
                        <Check className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
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
      <CreateProject
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        onCreateProject={(data) => {
          console.log("Create project:", data);
        }}
      />

      <CreateIssue
        open={createIssueOpen}
        onOpenChange={setCreateIssueOpen}
        onCreateIssue={(data) => {
          console.log("Create issue:", data, "for project:", createIssueProjectId);
        }}
      />
    </div>
  );
}
