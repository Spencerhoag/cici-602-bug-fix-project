# E2E Testing Setup

## Overview

E2E tests run with a full stack:
- **Supabase** - PostgreSQL database with authentication
- **Backend** - FastAPI server
- **Ollama** - LLM service
- **Frontend** - Vite dev server (started by Playwright)

All services run in Docker containers for easy setup and teardown.

## Quick Start (Local Testing)

### First Time Setup

1. **Install Playwright browsers** (one-time):
   ```bash
   npm run e2e:setup
   ```

### Running Tests

2. **Start all services**:
   ```bash
   npm run e2e:start
   ```

   This starts:
   - PostgreSQL with Supabase (port 54322)
   - Supabase API Gateway (port 54321)
   - Backend API (port 8000)
   - Ollama (port 11434)

   And automatically:
   - Creates test database with schema
   - Seeds test user account
   - Creates frontend `.env` file

3. **Run E2E tests**:
   ```bash
   npm run e2e:test
   # or
   cd frontend && npm run test:e2e
   ```

4. **Stop all services**:
   ```bash
   npm run e2e:stop
   ```

## Test User Credentials

**Email:** `test@example.com`
**Password:** `testpassword123`

Available as environment variables in tests:
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`

## Services

Once started with `npm run e2e:start`, services are available at:

- **Supabase API:** http://localhost:54321
- **Backend API:** http://localhost:8000/docs
- **Ollama:** http://localhost:11434
- **PostgreSQL:** localhost:54322

## Test Helpers

### Authentication Helper

```typescript
import { signInTestUser, signOut } from './helpers/test-auth'

test('my test', async ({ page }) => {
  // Sign in with test user
  await signInTestUser(page)

  // Do authenticated actions
  // ...

  // Sign out
  await signOut(page)
})
```

## GitHub Actions Workflow

The E2E test workflow runs automatically on PRs:

1. **Start Supabase** - Using Supabase CLI
2. **Seed Database** - Create test user account
3. **Start Backend** - Launch API and Ollama via docker-compose
4. **Run Tests** - Playwright tests with real authentication
5. **Cleanup** - Stop all services

## Database Schema

Database migrations are in `supabase/migrations/` and run automatically when starting services.

Current schema includes:
- `users` - User profiles
- `projects` - User projects
- `project_files` - Project files
- `issues` - Bug reports and issues

## Troubleshooting

### Services won't start

```bash
# Stop everything and try again
npm run e2e:stop
npm run e2e:start
```

### Port conflicts

If ports 54321, 54322, 8000, or 11434 are in use:
```bash
# Check what's using the port
lsof -i :54321
# Kill the process or stop conflicting services
```

### Test user login fails

```bash
# Restart services to re-seed database
npm run e2e:stop
npm run e2e:start
```

### Backend not accessible

```bash
# Check backend logs
docker compose -f docker-compose.e2e.yml logs app
```

### Clean slate

```bash
# Remove all containers and volumes
docker compose -f docker-compose.e2e.yml down -v
npm run e2e:start
```

## CI/CD Workflow Files

- `.github/workflows/frontend-tests.yml` - Main workflow
- `supabase/config.toml` - Supabase configuration
- `supabase/seed.sql` - Database seed data
- `frontend/e2e/helpers/test-auth.ts` - Auth helper
- `frontend/e2e/auth.spec.ts` - Auth tests

## Troubleshooting

### Supabase won't start
```bash
supabase stop
supabase start
```

### Test user login fails
Check that the user was created:
```bash
supabase db reset
```

### Backend not accessible
```bash
docker compose logs app
```

### Port conflicts
Change ports in `supabase/config.toml` if needed.
