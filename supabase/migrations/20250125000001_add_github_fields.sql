-- Add GitHub metadata fields to projects table
ALTER TABLE projects
ADD COLUMN github_url TEXT,
ADD COLUMN github_repo_name TEXT;

-- Add index for GitHub URL for potential lookups
CREATE INDEX idx_projects_github_url ON projects(github_url) WHERE github_url IS NOT NULL;
