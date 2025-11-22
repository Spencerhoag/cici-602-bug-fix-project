"use client";

import { useState, memo } from "react";
import { Plus, ChevronRight, ChevronDown, FolderPlus, Github, GitPullRequest, GitMerge, Settings, Users } from "lucide-react";
import {
  SiPython, SiJavascript, SiTypescript, SiReact, SiOpenjdk,
  SiCplusplus, SiC, SiGo, SiRust, SiRuby, SiPhp, SiSwift,
  SiKotlin, SiSharp, SiHtml5, SiCss3, SiVuedotjs, SiMysql
} from "react-icons/si";
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
  onManageProject?: (projectId: string) => void;
  onManageGroups?: () => void;
}

const getTopLanguages = (files: string[]): Array<{ icon: React.ComponentType<{ className?: string }>; name: string; color: string }> => {
  const langCounts: Record<string, number> = {};
  const langMap: Record<string, { icon: React.ComponentType<{ className?: string }>; name: string; color: string }> = {
    '.py': { icon: SiPython, name: 'Python', color: 'text-[#3776AB]' },
    '.js': { icon: SiJavascript, name: 'JavaScript', color: 'text-[#F7DF1E]' },
    '.ts': { icon: SiTypescript, name: 'TypeScript', color: 'text-[#3178C6]' },
    '.tsx': { icon: SiReact, name: 'React', color: 'text-[#61DAFB]' },
    '.jsx': { icon: SiReact, name: 'React', color: 'text-[#61DAFB]' },
    '.java': { icon: SiOpenjdk, name: 'Java', color: 'text-[#007396]' },
    '.cpp': { icon: SiCplusplus, name: 'C++', color: 'text-[#00599C]' },
    '.c': { icon: SiC, name: 'C', color: 'text-[#A8B9CC]' },
    '.go': { icon: SiGo, name: 'Go', color: 'text-[#00ADD8]' },
    '.rs': { icon: SiRust, name: 'Rust', color: 'text-[#CE422B]' },
    '.rb': { icon: SiRuby, name: 'Ruby', color: 'text-[#CC342D]' },
    '.php': { icon: SiPhp, name: 'PHP', color: 'text-[#777BB4]' },
    '.swift': { icon: SiSwift, name: 'Swift', color: 'text-[#FA7343]' },
    '.kt': { icon: SiKotlin, name: 'Kotlin', color: 'text-[#7F52FF]' },
    '.cs': { icon: SiSharp, name: 'C#', color: 'text-[#239120]' },
    '.html': { icon: SiHtml5, name: 'HTML', color: 'text-[#E34F26]' },
    '.css': { icon: SiCss3, name: 'CSS', color: 'text-[#1572B6]' },
    '.vue': { icon: SiVuedotjs, name: 'Vue', color: 'text-[#4FC08D]' },
    '.sql': { icon: SiMysql, name: 'SQL', color: 'text-[#4479A1]' },
  };

  files.forEach(file => {
    const ext = file.substring(file.lastIndexOf('.'));
    const lang = langMap[ext];
    if (lang) {
      const key = lang.name;
      langCounts[key] = (langCounts[key] || 0) + 1;
    }
  });

  return Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([langName]) => {
      const langInfo = Object.values(langMap).find(l => l.name === langName);
      return langInfo || { icon: SiJavascript, name: langName, color: 'text-gray-400' };
    });
};

export const Sidebar = memo(function Sidebar({
  projects,
  selectedProjectId,
  selectedIssueId,
  onProjectSelect,
  onIssueSelect,
  onCreateProject,
  onCreateIssue,
  onManageProject,
  onManageGroups,
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
      case "merged":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="w-full md:w-64 border-r bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-2 md:p-3 border-b flex items-center justify-between">
        <h2 className="font-semibold text-xs">Projects</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onManageGroups}
            className="h-7 w-7 p-0"
            title="Manage Groups"
          >
            <Users className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateProject}
            className="h-7 w-7 p-0"
            title="Create Project"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </Button>
        </div>
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
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                          <span>{project.issues.length} issue{project.issues.length !== 1 ? "s" : ""}</span>
                          <span>•</span>
                          <span>{(project as any).fileCount || 0} file{((project as any).fileCount || 0) !== 1 ? "s" : ""}</span>
                          {(project as any).files && (project as any).files.length > 0 && (
                            <div className="flex items-center gap-1">
                              {getTopLanguages((project as any).files).map((lang, i) => {
                                const Icon = lang.icon;
                                return (
                                  <span key={i} title={lang.name}>
                                    <Icon className={`h-3 w-3 ${lang.color}`} />
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onManageProject?.(project.id);
                          }}
                          title="Manage project"
                        >
                          <Settings className="h-2.5 w-2.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateIssue?.(project.id);
                          }}
                          title="Create issue"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </Button>
                      </div>
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
                                className={`text-[9px] px-1.5 py-0 h-4 flex-shrink-0 ${
                                  issue.status === "merged" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""
                                }`}
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
});
