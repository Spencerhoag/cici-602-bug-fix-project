"use client";

import { useState } from "react";
import { Plus, ChevronRight, ChevronDown, FolderPlus, Github, GitPullRequest, GitMerge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Project, Issue } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  projects: Project[];
  selectedProjectId?: string;
  selectedIssueId?: string;
  onProjectSelect?: (projectId: string) => void;
  onIssueSelect?: (issueId: string) => void;
  onCreateProject?: () => void;
  onCreateIssue?: (projectId: string) => void;
}

export function Sidebar({
  projects,
  selectedProjectId,
  selectedIssueId,
  onProjectSelect,
  onIssueSelect,
  onCreateProject,
  onCreateIssue,
}: SidebarProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(projects.map((p) => p.id))
  );

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
    onProjectSelect?.(projectId);
  };

  const getStatusColor = (status: Issue["status"]) => {
    switch (status) {
      case "open":
        return "outline";
      case "in_progress":
        return "warning";
      case "solved":
        return "success";
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="w-full md:w-64 border-r bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-2 md:p-3 border-b flex items-center justify-between">
        <h2 className="font-semibold text-xs">Projects</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCreateProject}
          className="h-7 w-7 p-0"
        >
          <FolderPlus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Projects List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {projects.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No projects yet
            </div>
          ) : (
            <div className="space-y-1">
              {projects.map((project) => {
                const isExpanded = expandedProjects.has(project.id);
                const isSelected = selectedProjectId === project.id;

                return (
                  <div key={project.id} className="space-y-0.5">
                    {/* Project Header */}
                    <div
                      className={cn(
                        "group flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-colors hover:bg-accent/50",
                        isSelected && !selectedIssueId && "bg-accent"
                      )}
                      onClick={() => toggleProject(project.id)}
                    >
                      {project.issues.length > 0 ? (
                        isExpanded ? (
                          <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        )
                      ) : (
                        <div className="w-3" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs truncate">
                          {project.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {project.issues.length} issue{project.issues.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateIssue?.(project.id);
                        }}
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </Button>
                    </div>

                    {/* Issues */}
                    {isExpanded && project.issues.length > 0 && (
                      <div className="ml-3 pl-3 border-l border-border space-y-0.5">
                        {project.issues.map((issue) => (
                          <div
                            key={issue.id}
                            className={cn(
                              "px-2 py-1 rounded-md cursor-pointer hover:bg-accent/50 transition-colors",
                              selectedIssueId === issue.id && "bg-accent"
                            )}
                            onClick={() => onIssueSelect?.(issue.id)}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <div className="font-medium text-[11px] truncate">
                                    {issue.title}
                                  </div>
                                  {/* GitHub Issue */}
                                  {issue.githubIssueUrl && (
                                    <div className="flex items-center gap-0.5 text-muted-foreground flex-shrink-0">
                                      <Github className="h-2.5 w-2.5" />
                                      <span className="text-[9px]">#{issue.githubIssueNumber}</span>
                                    </div>
                                  )}
                                  {/* GitHub PR - Merged */}
                                  {issue.githubPrUrl && issue.githubPrMerged && (
                                    <div className="flex items-center gap-0.5 text-purple-500 flex-shrink-0">
                                      <GitMerge className="h-2.5 w-2.5" />
                                      <span className="text-[9px]">#{issue.githubPrNumber}</span>
                                    </div>
                                  )}
                                  {/* GitHub PR - Open */}
                                  {issue.githubPrUrl && !issue.githubPrMerged && (
                                    <div className="flex items-center gap-0.5 text-green-500 flex-shrink-0">
                                      <GitPullRequest className="h-2.5 w-2.5" />
                                      <span className="text-[9px]">#{issue.githubPrNumber}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                  Iteration {issue.currentIteration}
                                </div>
                              </div>
                              <Badge
                                variant={getStatusColor(issue.status)}
                                className="text-[9px] px-1.5 py-0 h-4 flex-shrink-0"
                              >
                                {issue.status.replace("_", " ")}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
