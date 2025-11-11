/**
 * FastAPI Client for CICI Backend
 *
 * This module provides functions to interact with the FastAPI backend.
 * All endpoints are currently stubbed with mock data for development.
 * Replace with actual API calls when backend is ready.
 */

import type {
  Project,
  Issue,
  Iteration,
  CreateProjectRequest,
  CreateIssueRequest,
  StartIterationRequest,
  ReviewChangesRequest,
} from "./types";

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const WS_BASE_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000";

// Helper function for fetch with error handling
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Projects API

export async function getProjects(): Promise<Project[]> {
  // TODO: Replace with actual API call
  // return fetchAPI<Project[]>('/api/projects');

  // Mock implementation
  return Promise.resolve([]);
}

export async function getProject(id: string): Promise<Project> {
  // TODO: Replace with actual API call
  // return fetchAPI<Project>(`/api/projects/${id}`);

  throw new Error("Not implemented");
}

export async function createProject(
  data: CreateProjectRequest
): Promise<Project> {
  // TODO: Replace with actual API call
  // return fetchAPI<Project>('/api/projects', {
  //   method: 'POST',
  //   body: JSON.stringify(data),
  // });

  throw new Error("Not implemented");
}

export async function deleteProject(id: string): Promise<void> {
  // TODO: Replace with actual API call
  // await fetchAPI(`/api/projects/${id}`, { method: 'DELETE' });

  throw new Error("Not implemented");
}

// Issues API

export async function getIssues(projectId: string): Promise<Issue[]> {
  // TODO: Replace with actual API call
  // return fetchAPI<Issue[]>(`/api/projects/${projectId}/issues`);

  return Promise.resolve([]);
}

export async function getIssue(issueId: string): Promise<Issue> {
  // TODO: Replace with actual API call
  // return fetchAPI<Issue>(`/api/issues/${issueId}`);

  throw new Error("Not implemented");
}

export async function createIssue(data: CreateIssueRequest): Promise<Issue> {
  // TODO: Replace with actual API call
  // return fetchAPI<Issue>(`/api/projects/${data.projectId}/issues`, {
  //   method: 'POST',
  //   body: JSON.stringify(data),
  // });

  throw new Error("Not implemented");
}

// Iterations API

export async function startIteration(
  data: StartIterationRequest
): Promise<Iteration> {
  // TODO: Replace with actual API call
  // return fetchAPI<Iteration>(`/api/issues/${data.issueId}/start`, {
  //   method: 'POST',
  // });

  throw new Error("Not implemented");
}

export async function getIterations(issueId: string): Promise<Iteration[]> {
  // TODO: Replace with actual API call
  // return fetchAPI<Iteration[]>(`/api/issues/${issueId}/iterations`);

  return Promise.resolve([]);
}

export async function reviewChanges(
  data: ReviewChangesRequest
): Promise<void> {
  // TODO: Replace with actual API call
  // await fetchAPI(`/api/iterations/${data.iterationId}/review`, {
  //   method: 'POST',
  //   body: JSON.stringify(data),
  // });

  console.log("Review changes:", data);
}

// WebSocket connection for real-time updates

export class IterationWebSocket {
  private ws: WebSocket | null = null;
  private issueId: string;
  private onMessageCallback?: (data: unknown) => void;
  private onErrorCallback?: (error: Event) => void;

  constructor(issueId: string) {
    this.issueId = issueId;
  }

  connect(
    onMessage: (data: unknown) => void,
    onError?: (error: Event) => void
  ): void {
    // TODO: Replace with actual WebSocket connection
    // this.ws = new WebSocket(`${WS_BASE_URL}/ws/issues/${this.issueId}/stream`);

    this.onMessageCallback = onMessage;
    this.onErrorCallback = onError;

    // Mock implementation
    console.log(`WebSocket connecting to issue ${this.issueId}...`);

    // this.ws.onopen = () => {
    //   console.log('WebSocket connected');
    // };

    // this.ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   this.onMessageCallback?.(data);
    // };

    // this.ws.onerror = (error) => {
    //   console.error('WebSocket error:', error);
    //   this.onErrorCallback?.(error);
    // };

    // this.ws.onclose = () => {
    //   console.log('WebSocket closed');
    // };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket not connected, cannot send data");
    }
  }
}

export function createIterationWebSocket(issueId: string): IterationWebSocket {
  return new IterationWebSocket(issueId);
}

// Bug Fixer API

export interface UploadResponse {
  run_id: string;
  filename: string;
}

export interface RepairRequest {
  language: string;
  expected_output?: string;
}

export interface RepairResponse {
  status: "success" | "failed";
  iterations: number;
  output?: string;
  message?: string;
  last_output?: string;
  last_error?: string;
  last_exit_code?: number;
  original_code?: string;
  fixed_code?: string;
}

export async function uploadFile(file: File, language: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload?language=${language}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
}

export async function repairCode(runId: string, request: RepairRequest): Promise<RepairResponse> {
  const response = await fetch(`${API_BASE_URL}/repair/${runId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Repair failed: ${response.statusText}`);
  }

  return response.json();
}
