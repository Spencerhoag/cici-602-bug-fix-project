-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create test user in auth.users table
-- Setting all token fields to empty strings to avoid NULL scan errors in GoTrue
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  confirmation_token,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('testpassword123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Create corresponding user in users table
INSERT INTO users (id, username)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'testuser')
ON CONFLICT (id) DO NOTHING;
