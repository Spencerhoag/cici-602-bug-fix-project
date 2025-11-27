-- Seed file for test data
-- This runs after migrations in local Supabase

-- Test user credentials:
-- Email: test@example.com
-- Password: testpassword123
-- ID: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11

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

-- Create a test group
INSERT INTO groups (id, name, owner_id)
VALUES ('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Test Group', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
ON CONFLICT (id) DO NOTHING;

-- Add user to the test group
INSERT INTO user_groups (user_id, group_id, role)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'admin')
ON CONFLICT (user_id, group_id) DO NOTHING;

-- Optional: Add sample test data
INSERT INTO projects (user_id, group_id, name, storage_path)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Test Project', '/test-project')
ON CONFLICT (user_id, name) DO NOTHING;
