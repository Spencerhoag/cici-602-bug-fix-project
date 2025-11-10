// Core data types for the CICI platform

export type ProjectLanguage = 'python' | 'java' | 'multi' | 'javascript' | 'typescript' | 'other';

export type IssueStatus = 'open' | 'in_progress' | 'solved' | 'failed';

export type IterationStatus = 'running' | 'completed' | 'failed';

export type IssueMode = 'basic' | 'expected_output';

export interface Project {
  id: string;
  name: string;
  description?: string;
  language: ProjectLanguage;
  createdAt: Date;
  updatedAt: Date;
  files: FileNode[];
  issues: Issue[];
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  content?: string;        // For files only
  language?: string;       // For syntax highlighting (e.g., 'python', 'java')
  children?: FileNode[];   // For directories
}

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  description: string;  // User's description of the problem
  mode: IssueMode;      // 'basic' for syntax fixing, 'expected_output' for custom behavior
  expectedOutput?: string;  // Natural language description of expected behavior (when mode is 'expected_output')
  status: IssueStatus;
  maxIterations: number;
  currentIteration: number;
  iterations: Iteration[];
  githubIssueUrl?: string;  // Link to GitHub issue if connected
  githubIssueNumber?: number;  // GitHub issue number (e.g., 42)
  githubPrUrl?: string;  // Link to GitHub PR if created
  githubPrNumber?: number;  // GitHub PR number
  githubPrMerged?: boolean;  // True if PR was merged
  createdAt: Date;
  updatedAt: Date;
}

export interface Iteration {
  id: string;
  issueId: string;
  number: number;  // 1-indexed
  status: IterationStatus;
  reasoning: string;  // AI's explanation of what it's doing
  changes: CodeChange[];
  runtimeOutput: string;  // stdout + stderr
  exitCode?: number;
  startedAt: Date;
  completedAt?: Date;
}

export interface CodeChange {
  id: string;
  filePath: string;
  diff: string;        // Unified diff format
  accepted?: boolean;  // User's review decision
  language?: string;   // For syntax highlighting
}

// API Request/Response types

export interface CreateProjectRequest {
  name: string;
  description?: string;
  files: File[] | FileNode[];  // File upload or structured data
}

export interface CreateIssueRequest {
  projectId: string;
  title: string;
  description: string;
  mode: IssueMode;
  expectedOutput?: string;
  maxIterations: number;
}

export interface StartIterationRequest {
  issueId: string;
}

export interface ReviewChangesRequest {
  iterationId: string;
  changeId: string;
  accepted: boolean;
}

// WebSocket message types

export interface WebSocketMessage {
  type: 'iteration_start' | 'iteration_update' | 'iteration_complete' | 'output' | 'error';
  data: unknown;
}

export interface IterationUpdateMessage extends WebSocketMessage {
  type: 'iteration_update';
  data: {
    iterationId: string;
    status: IterationStatus;
    reasoning?: string;
    changes?: CodeChange[];
  };
}

export interface OutputMessage extends WebSocketMessage {
  type: 'output';
  data: {
    iterationId: string;
    output: string;
    stream: 'stdout' | 'stderr';
  };
}

export interface ErrorMessage extends WebSocketMessage {
  type: 'error';
  data: {
    message: string;
    code?: string;
  };
}
