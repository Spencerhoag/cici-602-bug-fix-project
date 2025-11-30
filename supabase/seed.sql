-- Seed file for test data
-- This runs after migrations in local Supabase

-- Test user credentials:
-- Email: test@example.com
-- Password: testpassword123
-- ID: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11

-- Create test user entry in users table
INSERT INTO users (id, username)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'testuser')
ON CONFLICT (id) DO NOTHING;

-- Optional: Add sample test data
-- INSERT INTO projects (user_id, name, storage_path)
-- VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Test Project', '/test-project');
