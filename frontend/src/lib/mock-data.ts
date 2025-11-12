import type { Project, FileNode, Issue, Iteration } from "./types";

// Mock file tree for a Python project
const pythonProjectFiles: FileNode[] = [
  {
    id: "f1",
    name: "main.py",
    type: "file",
    path: "main.py",
    language: "python",
    content: `def calculate_sum(a, b):
    return a + b

def main():
    result = calculate_sum(5, 10)
    print(f"Sum: {result}")

if __name__ == "__main__":
    main()`,
  },
  {
    id: "f2",
    name: "utils.py",
    type: "file",
    path: "utils.py",
    language: "python",
    content: `def validate_input(value):
    if not isinstance(value, (int, float)):
        raise ValueError("Input must be a number")
    return True`,
  },
  {
    id: "d1",
    name: "tests",
    type: "directory",
    path: "tests",
    children: [
      {
        id: "f3",
        name: "test_main.py",
        type: "file",
        path: "tests/test_main.py",
        language: "python",
        content: `import unittest
from main import calculate_sum

class TestCalculateSum(unittest.TestCase):
    def test_positive_numbers(self):
        self.assertEqual(calculate_sum(5, 10), 15)

    def test_negative_numbers(self):
        self.assertEqual(calculate_sum(-5, -10), -15)`,
      },
    ],
  },
];

// Mock diffs for various scenarios
const approvedDiff = `--- a/main.py
+++ b/main.py
@@ -1,6 +1,7 @@
 def calculate_sum(a, b):
+    # Added input validation
+    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
+        raise TypeError("Both arguments must be numbers")
     return a + b`;

const deniedDiff = `--- a/utils.py
+++ b/utils.py
@@ -1,4 +1,5 @@
 def validate_input(value):
+    # This change was rejected by user
     if not isinstance(value, (int, float)):
         raise ValueError("Input must be a number")`;

const syntaxFixDiff = `--- a/main.py
+++ b/main.py
@@ -5,6 +5,6 @@
 def main():
     result = calculate_sum(5, 10)
-    print(f"Sum: {result}"
+    print(f"Sum: {result}")

 if __name__ == "__main__":`;

// Mock iterations - various states
const completedIterationApproved: Iteration = {
  id: "iter1",
  issueId: "issue1",
  number: 1,
  status: "completed",
  reasoning: "I identified that the calculate_sum function lacks input validation. This could cause unexpected behavior if non-numeric values are passed. I've added type checking to make the function more robust and prevent runtime errors.",
  changes: [
    {
      id: "change1",
      filePath: "main.py",
      diff: approvedDiff,
      language: "python",
      accepted: true,
    },
  ],
  runtimeOutput: `Running tests...
test_positive_numbers ... ok
test_negative_numbers ... ok
test_type_validation ... ok

----------------------------------------------------------------------
Ran 3 tests in 0.002s

OK`,
  exitCode: 0,
  startedAt: new Date("2025-11-08T10:30:00"),
  completedAt: new Date("2025-11-08T10:31:30"),
};

const completedIterationDenied: Iteration = {
  id: "iter2",
  issueId: "issue2",
  number: 1,
  status: "completed",
  reasoning: "I noticed the validate_input function could benefit from additional logging. I've added a log statement to track validation calls.",
  changes: [
    {
      id: "change2",
      filePath: "utils.py",
      diff: deniedDiff,
      language: "python",
      accepted: false,
    },
  ],
  runtimeOutput: `Running validation tests...
All tests passed.`,
  exitCode: 0,
  startedAt: new Date("2025-11-08T11:00:00"),
  completedAt: new Date("2025-11-08T11:01:15"),
};

const runningIteration: Iteration = {
  id: "iter3",
  issueId: "issue3",
  number: 1,
  status: "running",
  reasoning: "Analyzing the code for syntax errors... Found missing closing parenthesis on line 8. Fixing now...",
  changes: [
    {
      id: "change3",
      filePath: "main.py",
      diff: syntaxFixDiff,
      language: "python",
    },
  ],
  runtimeOutput: `Checking syntax...
Found error at line 8: SyntaxError: unexpected EOF while parsing
Applying fix...`,
  startedAt: new Date(),
};

const failedIteration: Iteration = {
  id: "iter4",
  issueId: "issue4",
  number: 2,
  status: "failed",
  reasoning: "Attempted to fix the import error by adding the missing module. However, the module doesn't exist in the standard library.",
  changes: [
    {
      id: "change4",
      filePath: "main.py",
      diff: `--- a/main.py
+++ b/main.py
@@ -1,3 +1,4 @@
+import nonexistent_module
 import sys

 def main():`,
      language: "python",
      accepted: false,
    },
  ],
  runtimeOutput: `Traceback (most recent call last):
  File "main.py", line 1, in <module>
    import nonexistent_module
ModuleNotFoundError: No module named 'nonexistent_module'

Error: Unable to resolve dependency issue.`,
  exitCode: 1,
  startedAt: new Date("2025-11-08T14:00:00"),
  completedAt: new Date("2025-11-08T14:00:45"),
};

const multipleIterations: Iteration[] = [
  {
    id: "iter5",
    issueId: "issue5",
    number: 1,
    status: "completed",
    reasoning: "First attempt: Added basic error handling.",
    changes: [
      {
        id: "change5",
        filePath: "main.py",
        diff: syntaxFixDiff,
        language: "python",
        accepted: true,
      },
    ],
    runtimeOutput: "Tests passing: 2/3\nOne test still failing.",
    exitCode: 1,
    startedAt: new Date("2025-11-08T15:00:00"),
    completedAt: new Date("2025-11-08T15:01:00"),
  },
  {
    id: "iter6",
    issueId: "issue5",
    number: 2,
    status: "completed",
    reasoning: "Second attempt: Fixed edge case in validation logic.",
    changes: [
      {
        id: "change6",
        filePath: "utils.py",
        diff: approvedDiff,
        language: "python",
        accepted: true,
      },
    ],
    runtimeOutput: "All tests passing: 3/3",
    exitCode: 0,
    startedAt: new Date("2025-11-08T15:01:30"),
    completedAt: new Date("2025-11-08T15:02:30"),
  },
];

// Mock issues with various states
export const mockProjects: Project[] = [
  {
    id: "proj1",
    name: "Python Calculator",
    description: "A simple calculator application",
    language: "python",
    files: pythonProjectFiles,
    issues: [
      {
        id: "issue1",
        projectId: "proj1",
        title: "Add input validation",
        description: "Need to validate that inputs are numbers",
        mode: "expected_output",
        expectedOutput: "The program should raise a TypeError when non-numeric values are passed",
        status: "solved",
        currentIteration: 1,
        iterations: [completedIterationApproved],
        githubIssueUrl: "https://github.com/example/calculator/issues/42",
        githubIssueNumber: 42,
        githubPrUrl: "https://github.com/example/calculator/pull/45",
        githubPrNumber: 45,
        githubPrMerged: true,
        createdAt: new Date("2025-11-08T10:00:00"),
        updatedAt: new Date("2025-11-08T10:31:30"),
      },
      {
        id: "issue2",
        projectId: "proj1",
        title: "Add logging to validation",
        description: "Track validation calls for debugging",
        mode: "expected_output",
        expectedOutput: "Log each validation call with timestamp",
        status: "failed",
        currentIteration: 1,
        iterations: [completedIterationDenied],
        githubIssueUrl: "https://github.com/example/calculator/issues/56",
        githubIssueNumber: 56,
        createdAt: new Date("2025-11-08T11:00:00"),
        updatedAt: new Date("2025-11-08T11:01:15"),
      },
      {
        id: "issue3",
        projectId: "proj1",
        title: "Fix syntax error",
        description: "",
        mode: "basic",
        status: "in_progress",
        currentIteration: 1,
        iterations: [runningIteration],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    createdAt: new Date("2025-11-01T09:00:00"),
    updatedAt: new Date(),
  },
  {
    id: "proj2",
    name: "Data Processor",
    description: "Processes CSV files and generates reports",
    language: "python",
    files: [],
    issues: [
      {
        id: "issue4",
        projectId: "proj2",
        title: "Missing module error",
        description: "",
        mode: "basic",
        status: "failed",
        currentIteration: 2,
        iterations: [failedIteration],
        createdAt: new Date("2025-11-08T14:00:00"),
        updatedAt: new Date("2025-11-08T14:00:45"),
      },
      {
        id: "issue5",
        projectId: "proj2",
        title: "Fix all test failures",
        description: "Multiple tests are failing",
        mode: "expected_output",
        expectedOutput: "All unit tests should pass",
        status: "solved",
        currentIteration: 2,
        iterations: multipleIterations,
        githubIssueUrl: "https://github.com/example/data-processor/issues/15",
        githubIssueNumber: 15,
        githubPrUrl: "https://github.com/example/data-processor/pull/18",
        githubPrNumber: 18,
        githubPrMerged: false,
        createdAt: new Date("2025-11-08T15:00:00"),
        updatedAt: new Date("2025-11-08T15:02:30"),
      },
    ],
    createdAt: new Date("2025-11-05T14:30:00"),
    updatedAt: new Date(),
  },
  {
    id: "proj3",
    name: "Web Scraper",
    description: "Scrapes product data from e-commerce sites",
    language: "python",
    files: [],
    issues: [
      {
        id: "issue6",
        projectId: "proj3",
        title: "Handle rate limiting",
        description: "Add backoff when rate limited",
        mode: "expected_output",
        expectedOutput: "Should retry with exponential backoff",
        status: "open",
        currentIteration: 0,
        iterations: [],
        createdAt: new Date("2025-11-09T08:00:00"),
        updatedAt: new Date("2025-11-09T08:00:00"),
      },
    ],
    createdAt: new Date("2025-11-07T11:00:00"),
    updatedAt: new Date("2025-11-09T08:00:00"),
  },
  {
    id: "proj4",
    name: "API Server",
    description: "RESTful API for mobile app",
    language: "python",
    files: [],
    issues: [],
    createdAt: new Date("2025-11-08T16:00:00"),
    updatedAt: new Date("2025-11-08T16:00:00"),
  },
];

// Helper function to get project by ID
export function getProjectById(id: string): Project | undefined {
  return mockProjects.find((p) => p.id === id);
}

// Helper function to get issue by ID
export function getIssueById(issueId: string): Issue | undefined {
  for (const project of mockProjects) {
    const issue = project.issues.find((i) => i.id === issueId);
    if (issue) return issue;
  }
  return undefined;
}

// Helper function to flatten file tree for search
export function flattenFileTree(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = [];

  function traverse(nodes: FileNode[]) {
    for (const node of nodes) {
      result.push(node);
      if (node.type === "directory" && node.children) {
        traverse(node.children);
      }
    }
  }

  traverse(nodes);
  return result;
}

// Helper function to search files
export function searchFiles(query: string, files: FileNode[]): FileNode[] {
  const flatFiles = flattenFileTree(files);
  return flatFiles.filter((file) =>
    file.name.toLowerCase().includes(query.toLowerCase()) ||
    file.path.toLowerCase().includes(query.toLowerCase())
  );
}
