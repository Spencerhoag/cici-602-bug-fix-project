# Todo List - Bug Fixes and Features

## High Priority Bugs

### 1. Enable Early Termination of Code Fixes
- **Issue**: The terminate/stop button is currently disabled while the AI is running code fixes
- **Expected**: Users should be able to cancel/stop code fixes mid-execution
- **Priority**: High
- **Status**: To Do

### 2. Fix Non-Basic Syntax Fixes
- **Issue**: Only the basic syntax fix is working. Other fix types are not functioning properly
- **Expected**: All fix types should work correctly
- **Priority**: High
- **Status**: To Do
- **Notes**: Need to investigate which specific fix types are broken

- **Remaining Task**: Clean up existing dummy/test data in Supabase database
  - Go to Supabase Dashboard → SQL Editor
  - Run this query to see projects without valid users:
    ```sql
    SELECT * FROM projects WHERE user_id NOT IN (SELECT id FROM auth.users);
    ```
  - If you want to delete test data, run:
    ```sql
    -- Delete orphaned issues first (foreign key constraint)
    DELETE FROM issues WHERE user_id NOT IN (SELECT id FROM auth.users);
    -- Delete orphaned project files
    DELETE FROM project_files WHERE project_id IN (
      SELECT id FROM projects WHERE user_id NOT IN (SELECT id FROM auth.users)
    );
    -- Delete orphaned projects
    DELETE FROM projects WHERE user_id NOT IN (SELECT id FROM auth.users);
    ```

## Feature Requests

### 5. Edit Issue Description and Expected Output
- **Issue**: Users cannot modify issue descriptions or expected outputs after creation
- **Expected**: Add ability to edit issue details in case of user mistakes
- **Priority**: Medium
- **Status**: To Do
- **Implementation Ideas**:
  - Add edit button to issue view
  - Create edit form/modal
  - Update API endpoints to support PATCH/PUT operations
